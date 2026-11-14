"""
Eastworld blog backend.

A minimal Flask app that does two jobs:
  1. Serves the static frontend (index.html, post.html, css, js)
     from the project root, so everything runs on one server
     and there are no CORS headaches.
  2. Exposes a small JSON API for blog posts, backed by SQLite.

Run it with:  python3 app.py   then open http://localhost:5001
"""

import html as html_lib
import json
import os
import re
import sqlite3
import time
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent          # .../backend
FRONTEND_DIR = BASE_DIR.parent                       # project root

# Where the database and uploaded images live. Locally this is just
# the backend folder; in production, point DATA_DIR at the host's
# persistent disk so data survives restarts and redeploys.
DATA_DIR = Path(os.environ.get("DATA_DIR", BASE_DIR))
DB_PATH = DATA_DIR / "blog.db"

# Uploaded post images are stored on disk here and served at /uploads/...
UPLOADS_DIR = DATA_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

# Simple write protection for the admin page. Override in production:
#   ADMIN_PASSWORD=something-secret python3 app.py
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "eastworld")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # reject uploads over 8 MB


def get_db():
    """Open a connection to the SQLite database.

    sqlite3.Row lets us access columns by name (row["title"])
    instead of by index, which makes converting to JSON easy.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_listings_table():
    """Create the listings table if needed and seed it once.

    Runs on every startup but is a no-op after the first time,
    so deploys never touch existing data. The seed comes from
    listings_seed.json (extracted from the old food.js / stays.js /
    places.js data with extract_listings.mjs).
    """
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS listings (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            type        TEXT NOT NULL,      -- food | stay | place | product
            name        TEXT NOT NULL,
            country     TEXT NOT NULL,
            city        TEXT DEFAULT '',
            price_range TEXT DEFAULT '',    -- e.g. "$10-15" or "$400-800/night"
            budget_tier TEXT DEFAULT '',    -- budget | standard | premium
            category    TEXT DEFAULT '',    -- e.g. cultural, landmark (places)
            description TEXT DEFAULT '',
            content     TEXT DEFAULT '',    -- long-form write-up (optional)
            rating      REAL,               -- editorial score 0-5 (optional)
            image_url   TEXT DEFAULT '',
            link        TEXT DEFAULT '',    -- legacy detail page, if one exists
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    count = conn.execute("SELECT COUNT(*) FROM listings").fetchone()[0]
    seed_file = BASE_DIR / "listings_seed.json"
    if count == 0 and seed_file.exists():
        listings = json.loads(seed_file.read_text())
        conn.executemany(
            "INSERT INTO listings (type, name, country, city, price_range,"
            " budget_tier, category, description, image_url, link)"
            " VALUES (:type, :name, :country, :city, :price_range,"
            " :budget_tier, :category, :description, :image_url, :link)",
            listings,
        )
        print(f"Seeded {len(listings)} listings.")

    conn.commit()
    conn.close()


TAB_TO_TYPE = {"food": "food", "stays": "stay", "places": "place", "products": "product"}


def ensure_trending_table():
    """Create and seed the curated top-5 table.

    Each row points at a real listing, so editing a listing (name,
    image, rating...) automatically updates the sidebar too. The seed
    comes from trending_seed.json (the old hardcoded trending.js data);
    entries that don't match an existing listing get one created.
    """
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS trending (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            tab        TEXT NOT NULL,       -- food | stays | places | products
            country    TEXT NOT NULL,
            rank       INTEGER NOT NULL,    -- 1 (top) to 5
            listing_id INTEGER NOT NULL REFERENCES listings(id),
            UNIQUE(tab, country, rank)
        )
    """)

    count = conn.execute("SELECT COUNT(*) FROM trending").fetchone()[0]
    seed_file = BASE_DIR / "trending_seed.json"
    if count == 0 and seed_file.exists():
        created = 0
        for entry in json.loads(seed_file.read_text()):
            listing_type = TAB_TO_TYPE[entry["tab"]]
            row = conn.execute(
                "SELECT id FROM listings WHERE lower(name) = lower(?)"
                " AND country = ? AND type = ?",
                (entry["name"], entry["country"], listing_type),
            ).fetchone()

            if row:
                listing_id = row["id"]
                # Backfill links and images the old sidebar had but the
                # legacy listing data files didn't include
                if entry["link"]:
                    conn.execute(
                        "UPDATE listings SET link = ? WHERE id = ? AND link = ''",
                        (entry["link"], listing_id),
                    )
                if entry["image"]:
                    conn.execute(
                        "UPDATE listings SET image_url = ? WHERE id = ? AND image_url = ''",
                        (entry["image"], listing_id),
                    )
            else:
                # Trending pick that wasn't in the old food/stays/places
                # data files: create a listing for it so it can be edited.
                city = "" if listing_type == "product" else entry["location"].lower()
                cursor = conn.execute(
                    "INSERT INTO listings (type, name, country, city, image_url, link)"
                    " VALUES (?, ?, ?, ?, ?, ?)",
                    (listing_type, entry["name"], entry["country"], city,
                     entry["image"], entry["link"]),
                )
                listing_id = cursor.lastrowid
                created += 1

            conn.execute(
                "INSERT INTO trending (tab, country, rank, listing_id)"
                " VALUES (?, ?, ?, ?)",
                (entry["tab"], entry["country"], entry["rank"], listing_id),
            )
        print(f"Seeded trending table ({created} listings created for unmatched picks).")

    conn.commit()
    conn.close()


def ensure_videos_table():
    """Create the homepage video rail table and seed it once.

    Videos are just YouTube references: we store the 11-character
    video id and a title. Thumbnails come straight from YouTube's
    CDN and playback happens in an embedded player, so the site
    never hosts any video files itself.
    """
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS videos (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT NOT NULL,
            youtube_id TEXT NOT NULL,
            position   INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    count = conn.execute("SELECT COUNT(*) FROM videos").fetchone()[0]
    seed_file = BASE_DIR / "videos_seed.json"
    if count == 0 and seed_file.exists():
        videos = json.loads(seed_file.read_text())
        conn.executemany(
            "INSERT INTO videos (title, youtube_id, position) VALUES (?, ?, ?)",
            [(v["title"], v["youtube_id"], i + 1) for i, v in enumerate(videos)],
        )
        print(f"Seeded {len(videos)} videos.")

    conn.commit()
    conn.close()


def ensure_events_table():
    """Create the EW Events table and seed it once from events_seed.json."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT NOT NULL,
            city        TEXT NOT NULL,       -- slug, e.g. "phnom-penh"
            country     TEXT DEFAULT '',
            event_date  TEXT NOT NULL,       -- ISO date "2026-09-15"
            end_date    TEXT DEFAULT '',     -- for multi-day events
            time        TEXT DEFAULT '',     -- e.g. "5:00 PM - 9:00 PM"
            venue       TEXT DEFAULT '',
            price       TEXT DEFAULT '',     -- e.g. "$85 per person"
            description TEXT DEFAULT '',
            sponsor     TEXT DEFAULT '',
            link        TEXT DEFAULT '',     -- registration / tickets URL
            image_url   TEXT DEFAULT '',
            featured    INTEGER DEFAULT 0,   -- 1 = shown in the hero slot
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    count = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
    seed_file = BASE_DIR / "events_seed.json"
    if count == 0 and seed_file.exists():
        events = json.loads(seed_file.read_text())
        conn.executemany(
            "INSERT INTO events (title, city, country, event_date, end_date, time,"
            " venue, price, description, sponsor, link, image_url, featured)"
            " VALUES (:title, :city, :country, :event_date, :end_date, :time,"
            " :venue, :price, :description, :sponsor, :link, :image_url, :featured)",
            events,
        )
        print(f"Seeded {len(events)} events.")

    conn.commit()
    conn.close()


def ensure_slides_table():
    """Create the homepage carousel slides table, seeded once.

    Two carousels ('top' and 'bottom') share the table; position
    orders the slides within each. This replaces the hardcoded
    slides that used to live in index.html.
    """
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS slides (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            carousel    TEXT NOT NULL,       -- top | bottom
            category    TEXT DEFAULT '',     -- small label, e.g. "ARTIST SPOTLIGHT"
            title       TEXT NOT NULL,
            description TEXT DEFAULT '',
            image_url   TEXT NOT NULL,
            link        TEXT DEFAULT '',     -- optional: slide becomes clickable
            position    INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    count = conn.execute("SELECT COUNT(*) FROM slides").fetchone()[0]
    seed_file = BASE_DIR / "slides_seed.json"
    if count == 0 and seed_file.exists():
        slides = json.loads(seed_file.read_text())
        conn.executemany(
            "INSERT INTO slides (carousel, category, title, description, image_url,"
            " link, position) VALUES (:carousel, :category, :title, :description,"
            " :image_url, :link, :position)",
            slides,
        )
        print(f"Seeded {len(slides)} carousel slides.")

    conn.commit()
    conn.close()


def ensure_users_table():
    """Create the users table if needed, then add newer columns.

    user_type is the local/expat/visitor tag that can power split
    reviews later. role is member|creator|admin (creators are
    admin-promoted, never self-selected on register). Passwords
    are never stored in plain text — only a salted hash.
    """
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            username           TEXT NOT NULL UNIQUE,
            email              TEXT NOT NULL UNIQUE,
            password_hash      TEXT NOT NULL,
            user_type          TEXT NOT NULL DEFAULT 'visitor',
            home_city          TEXT DEFAULT '',
            profile_image_url  TEXT DEFAULT '',
            country            TEXT DEFAULT '',
            bio                TEXT DEFAULT '',
            role               TEXT NOT NULL DEFAULT 'member',
            created_at         TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    # Existing DBs created before these columns need ALTER.
    existing = {
        row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()
    }
    for col, decl in (
        ("profile_image_url", "TEXT DEFAULT ''"),
        ("country", "TEXT DEFAULT ''"),
        ("bio", "TEXT DEFAULT ''"),
        ("role", "TEXT NOT NULL DEFAULT 'member'"),
    ):
        if col not in existing:
            conn.execute(f"ALTER TABLE users ADD COLUMN {col} {decl}")
    conn.commit()
    conn.close()


def ensure_reviews_table():
    """Create the reviews table if needed.

    One review per user per listing — a UNIQUE constraint enforces
    it, so re-submitting is an update, not a duplicate. user_type
    isn't stored here: it's read live from the users table via JOIN,
    so the local/expat split always reflects a reviewer's CURRENT
    tag, not whatever it was when they posted.
    """
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            listing_id  INTEGER NOT NULL REFERENCES listings(id),
            user_id     INTEGER NOT NULL REFERENCES users(id),
            rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            body        TEXT DEFAULT '',
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(listing_id, user_id)
        )
    """)
    conn.commit()
    conn.close()


# Accepts full YouTube URLs in any common shape (watch, shorts,
# youtu.be, embed, live) or a bare 11-character video id.
YOUTUBE_URL_RE = re.compile(
    r"(?:youtube\.com/(?:watch\?(?:.*&)?v=|shorts/|embed/|live/)|youtu\.be/)"
    r"([A-Za-z0-9_-]{11})"
)


def youtube_id_from(value):
    """Extract the video id from a YouTube URL, or None."""
    value = (value or "").strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", value):
        return value
    match = YOUTUBE_URL_RE.search(value)
    return match.group(1) if match else None


def run_once(key, action):
    """Run a one-time data migration, remembered in the meta table.

    This is how deletions reach the live server: seeds only run on
    empty tables, so removing rows from an already-seeded database
    needs an explicit, once-only cleanup step.
    """
    conn = get_db()
    conn.execute("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY)")
    done = conn.execute("SELECT 1 FROM meta WHERE key = ?", (key,)).fetchone()
    if not done:
        action(conn)
        conn.execute("INSERT INTO meta (key) VALUES (?)", (key,))
        conn.commit()
        print(f"Applied one-time migration: {key}")
    conn.close()


def purge_thailand(conn):
    """Remove all Thailand content (listings, trending picks, the
    Bangkok coffee post). July 2026 editorial decision."""
    conn.execute("DELETE FROM trending WHERE country = 'thailand'")
    conn.execute(
        "DELETE FROM trending WHERE listing_id IN"
        " (SELECT id FROM listings WHERE country = 'thailand')"
    )
    conn.execute("DELETE FROM listings WHERE country = 'thailand'")
    conn.execute("DELETE FROM posts WHERE title = \"Inside Bangkok's Booming Specialty Coffee Scene\"")


def normalize_city(value):
    """Keep city values consistent: lowercase, hyphens for spaces.

    Filter buttons across the site use slugs like 'phnom-penh', so
    everything written to the database must match that format.
    """
    return value.strip().lower().replace(" ", "-")


def normalize_cities_once():
    """Repair any legacy multi-word city values on boot (idempotent)."""
    conn = get_db()
    conn.execute("UPDATE listings SET city = REPLACE(city, ' ', '-') WHERE city LIKE '% %'")
    conn.commit()
    conn.close()


def backfill_listing_media():
    """Fill in images/links for listings that still lack them.

    Sources: images_seed.json (extracted from the legacy food.js /
    places.js image maps) and trending_seed.json. Only touches empty
    fields, so anything set through the admin is never overwritten.
    Runs on every boot; a no-op once everything is filled.
    """
    conn = get_db()

    images_file = BASE_DIR / "images_seed.json"
    if images_file.exists():
        for e in json.loads(images_file.read_text()):
            conn.execute(
                "UPDATE listings SET image_url = ? WHERE lower(name) = lower(?)"
                " AND type = ? AND image_url = ''",
                (e["image"], e["name"], e["type"]),
            )

    # Products that only ever existed as hardcoded cards in
    # products.html — import any that aren't in the table yet.
    products_file = BASE_DIR / "products_seed.json"
    if products_file.exists():
        for p in json.loads(products_file.read_text()):
            exists = conn.execute(
                "SELECT 1 FROM listings WHERE lower(name) = lower(?) AND type = 'product'",
                (p["name"],),
            ).fetchone()
            if not exists:
                conn.execute(
                    "INSERT INTO listings (type, name, country, city, price_range,"
                    " budget_tier, category, description, image_url, link)"
                    " VALUES (:type, :name, :country, :city, :price_range,"
                    " :budget_tier, :category, :description, :image_url, :link)",
                    p,
                )

    trending_file = BASE_DIR / "trending_seed.json"
    if trending_file.exists():
        for e in json.loads(trending_file.read_text()):
            listing_type = TAB_TO_TYPE[e["tab"]]
            if e["image"]:
                conn.execute(
                    "UPDATE listings SET image_url = ? WHERE lower(name) = lower(?)"
                    " AND country = ? AND type = ? AND image_url = ''",
                    (e["image"], e["name"], e["country"], listing_type),
                )
            if e["link"]:
                conn.execute(
                    "UPDATE listings SET link = ? WHERE lower(name) = lower(?)"
                    " AND country = ? AND type = ? AND link = ''",
                    (e["link"], e["name"], e["country"], listing_type),
                )

    conn.commit()
    conn.close()


def add_column_if_missing(conn, table, column, ddl):
    cols = [r[1] for r in conn.execute(f"PRAGMA table_info({table})")]
    if column not in cols:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")


# Keyword -> (country, city) rules for tagging legacy posts/slides.
# Matched case-insensitively against title + category, first hit wins.
GEO_TAG_RULES = [
    ("tokyo", "japan", "tokyo"), ("shibuya", "japan", "tokyo"),
    ("kyoto", "japan", "kyoto"), ("osaka", "japan", "osaka"),
    ("okayama", "japan", "okayama"), ("ichiran", "japan", ""),
    ("japan", "japan", ""),
    ("seoul", "korea", "seoul"), ("k-pop", "korea", ""),
    ("hoyeon", "korea", ""),
    ("shanghai", "china", "shanghai"), ("chengdu", "china", "chengdu"),
    ("chongqing", "china", "chongqing"), ("beijing", "china", "beijing"),
    ("xiaomi", "china", ""),
    ("saigon", "vietnam", "ho-chi-minh"), ("ho chi minh", "vietnam", "ho-chi-minh"),
    ("bánh mì", "vietnam", "ho-chi-minh"), ("hanoi", "vietnam", "hanoi"),
    ("melbourne", "australia", "melbourne"),
    ("siem reap", "cambodia", "siem-reap"), ("phnom penh", "cambodia", "phnom-penh"),
    ("cambodia", "cambodia", ""),
]


def ensure_geo_tagging():
    """Add the fields behind the homepage map and country filter.

    posts/slides/videos get a country tag (posts also a city), listings
    get lat/lng. Legacy content is tagged by city-name keywords; listing
    coordinates come from listing_coords.json (generated by
    geocode_listings.py). Everything only fills empty fields, so admin
    edits are never overwritten. Safe to run on every boot.
    """
    conn = get_db()
    add_column_if_missing(conn, "posts", "country", "TEXT DEFAULT ''")
    add_column_if_missing(conn, "posts", "city", "TEXT DEFAULT ''")
    add_column_if_missing(conn, "videos", "country", "TEXT DEFAULT ''")
    add_column_if_missing(conn, "slides", "country", "TEXT DEFAULT ''")
    add_column_if_missing(conn, "listings", "lat", "REAL")
    add_column_if_missing(conn, "listings", "lng", "REAL")

    for row in conn.execute("SELECT id, title, category FROM posts WHERE country = ''").fetchall():
        haystack = f"{row['title']} {row['category']}".lower()
        for keyword, country, city in GEO_TAG_RULES:
            if keyword in haystack:
                conn.execute("UPDATE posts SET country = ?, city = ? WHERE id = ?",
                             (country, city, row["id"]))
                break

    for row in conn.execute("SELECT id, title, category FROM slides WHERE country = ''").fetchall():
        haystack = f"{row['title']} {row['category']}".lower()
        for keyword, country, _ in GEO_TAG_RULES:
            if keyword in haystack:
                conn.execute("UPDATE slides SET country = ? WHERE id = ?",
                             (country, row["id"]))
                break

    coords_file = BASE_DIR / "listing_coords.json"
    if coords_file.exists():
        for e in json.loads(coords_file.read_text()):
            conn.execute(
                "UPDATE listings SET lat = ?, lng = ? WHERE lower(name) = lower(?)"
                " AND REPLACE(city, ' ', '-') = REPLACE(?, ' ', '-') AND lat IS NULL",
                (e["lat"], e["lng"], e["name"], e["city"]),
            )

    conn.commit()
    conn.close()


def is_authorized():
    """True if the request carries the admin password.

    The dashboard sends it as an X-Admin-Password header; plain
    form posts can also send it as a 'password' field.
    """
    supplied = request.headers.get("X-Admin-Password") or request.form.get("password")
    return supplied == ADMIN_PASSWORD


def save_image_if_present():
    """Store an uploaded image (if any) and return its URL.

    Returns (image_url, error): image_url is '' when nothing was
    uploaded, error is an error string or None.
    """
    file = request.files.get("image")
    if not file or not file.filename:
        return "", None
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return "", f"Image type .{ext} not allowed"
    filename = f"{int(time.time())}-{secure_filename(file.filename)}"
    file.save(UPLOADS_DIR / filename)
    return f"/uploads/{filename}", None


def delete_uploaded_image(image_url):
    """Remove an image file from disk if it was one of our uploads."""
    if image_url and image_url.startswith("/uploads/"):
        (UPLOADS_DIR / image_url.removeprefix("/uploads/")).unlink(missing_ok=True)


# ---------------------------- API ----------------------------

@app.route("/api/admin/check")
def admin_check():
    """Lets the dashboard verify the password before showing itself."""
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401
    return jsonify({"ok": True})


USER_PUBLIC_COLS = (
    "id, username, email, user_type, home_city, profile_image_url,"
    " country, bio, role, created_at"
)


def user_public(row):
    """Safe user payload — never includes password_hash."""
    data = {k: row[k] for k in (
        "id", "username", "email", "user_type", "home_city",
        "profile_image_url", "country", "bio", "role", "created_at",
    )}
    # Optional: present on /api/auth/me after the reviews table exists
    keys = row.keys() if hasattr(row, "keys") else []
    if "review_count" in keys:
        data["review_count"] = row["review_count"]
    return data


@app.route("/api/admin/users")
def list_users():
    """All registered users, for the admin dashboard. Never
    returns password_hash — no reason that value should ever
    travel over the network, even to you."""
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    conn = get_db()
    rows = conn.execute(
        f"SELECT {USER_PUBLIC_COLS} FROM users ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return jsonify([user_public(row) for row in rows])


# ---------------------------- Auth ----------------------------

VALID_USER_TYPES = {"local", "expat", "visitor"}
VALID_COUNTRIES = {
    "japan", "china", "australia", "cambodia", "vietnam",
    "usa", "uk", "singapore", "korea", "thailand", "other",
}


@app.route("/api/auth/register", methods=["POST"])
def register():
    """Create a member account (multipart so a photo can upload).

    Public signup always sets role=member. Creators are promoted
    later from the admin dashboard.
    """
    # Prefer form fields (multipart); fall back to JSON for tests/tools.
    data = request.form if request.form else (request.get_json(silent=True) or {})
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user_type = (data.get("user_type") or "").strip().lower()
    country = (data.get("country") or "").strip().lower()
    home_city_raw = (data.get("home_city") or "").strip()
    if home_city_raw.lower() == "other":
        home_city_raw = (data.get("home_city_other") or "").strip()
    home_city = normalize_city(home_city_raw) if home_city_raw else ""
    bio = (data.get("bio") or "").strip()[:160]

    if not username or not email or not password:
        return jsonify({"error": "Username, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if user_type not in VALID_USER_TYPES:
        return jsonify({"error": "user_type must be local, expat or visitor"}), 400
    if country not in VALID_COUNTRIES:
        return jsonify({"error": "Please select a valid country"}), 400

    profile_image_url, img_error = save_image_if_present()
    if img_error:
        return jsonify({"error": img_error}), 400

    conn = get_db()
    existing = conn.execute(
        "SELECT 1 FROM users WHERE email = ? OR username = ?",
        (email, username),
    ).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "That username or email is already taken"}), 409

    # pbkdf2:sha256 works on macOS system Python; default scrypt may not.
    password_hash = generate_password_hash(password, method="pbkdf2:sha256")
    cursor = conn.execute(
        "INSERT INTO users (username, email, password_hash, user_type,"
        " home_city, profile_image_url, country, bio, role)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'member')",
        (
            username, email, password_hash, user_type, home_city,
            profile_image_url or "", country, bio,
        ),
    )
    conn.commit()
    new_id = cursor.lastrowid
    row = conn.execute(
        f"SELECT {USER_PUBLIC_COLS} FROM users WHERE id = ?", (new_id,)
    ).fetchone()
    conn.close()

    session["user_id"] = new_id
    return jsonify({"user": user_public(row), "message": "Account created"}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Log in with email + password; stores user_id in the session."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if user is None or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    session["user_id"] = user["id"]
    return jsonify({"user": user_public(user), "message": "Logged in"})


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """Clear the logged-in user from the session."""
    session.pop("user_id", None)
    return jsonify({"message": "Logged out"})


@app.route("/api/auth/me")
def me():
    """Return the currently logged-in user, or 401 if none."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    conn = get_db()
    user = conn.execute("""
        SELECT u.id, u.username, u.email, u.user_type, u.home_city,
               u.profile_image_url, u.country, u.bio, u.role, u.created_at,
               (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) AS review_count
        FROM users u WHERE u.id = ?
    """, (user_id,)).fetchone()
    conn.close()

    if user is None:
        session.pop("user_id", None)
        return jsonify({"error": "Not logged in"}), 401
    return jsonify(user_public(user))


@app.route("/api/auth/profile", methods=["POST"])
def update_profile():
    """Update the logged-in member's pass (photo, country, city, type, bio).

    Multipart form — same image field name as register. Role cannot be
    changed here (admin promotes creators separately).
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.form if request.form else (request.get_json(silent=True) or {})
    user_type = (data.get("user_type") or "").strip().lower()
    country = (data.get("country") or "").strip().lower()
    home_city_raw = (data.get("home_city") or "").strip()
    if home_city_raw.lower() == "other":
        home_city_raw = (data.get("home_city_other") or "").strip()
    home_city = normalize_city(home_city_raw) if home_city_raw else ""
    bio = (data.get("bio") or "").strip()[:160]

    if user_type and user_type not in VALID_USER_TYPES:
        return jsonify({"error": "user_type must be local, expat or visitor"}), 400
    if country and country not in VALID_COUNTRIES:
        return jsonify({"error": "Please select a valid country"}), 400

    uploaded_url, img_error = save_image_if_present()
    if img_error:
        return jsonify({"error": img_error}), 400

    conn = get_db()
    row = conn.execute(
        f"SELECT {USER_PUBLIC_COLS} FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    if row is None:
        conn.close()
        session.pop("user_id", None)
        return jsonify({"error": "Not logged in"}), 401

    new_image = uploaded_url or row["profile_image_url"] or ""
    new_type = user_type or row["user_type"]
    new_country = country or row["country"] or ""
    # Allow clearing city by sending empty home_city explicitly in form.
    if "home_city" in data or "home_city_other" in data:
        new_city = home_city
    else:
        new_city = row["home_city"] or ""
    if "bio" in data:
        new_bio = bio
    else:
        new_bio = row["bio"] or ""

    if uploaded_url and row["profile_image_url"]:
        delete_uploaded_image(row["profile_image_url"])

    conn.execute(
        "UPDATE users SET profile_image_url = ?, user_type = ?, country = ?,"
        " home_city = ?, bio = ? WHERE id = ?",
        (new_image, new_type, new_country, new_city, new_bio, user_id),
    )
    conn.commit()
    updated = conn.execute(
        f"SELECT {USER_PUBLIC_COLS} FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()
    return jsonify({"user": user_public(updated), "message": "Profile updated"})


@app.route("/api/posts")
def list_posts():
    """Return a page of posts, newest first, WITHOUT the full content.

    Supports pagination for the homepage's infinite scroll:
        /api/posts?limit=5&offset=10  ->  posts 11-15

    The homepage only needs enough to draw the cards; sending the
    full article text for every post would be wasted bandwidth.
    """
    limit = min(request.args.get("limit", default=5, type=int), 50)
    offset = max(request.args.get("offset", default=0, type=int), 0)

    # Optional country filter for the homepage's country toggle
    country = (request.args.get("country") or "").strip().lower()
    where = " WHERE country = ?" if country else ""
    params = (country, limit, offset) if country else (limit, offset)

    conn = get_db()
    rows = conn.execute(
        "SELECT id, title, category, excerpt, image_url, country, city, created_at"
        f" FROM posts{where} ORDER BY created_at DESC, id DESC"
        " LIMIT ? OFFSET ?",
        params,
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route("/api/posts", methods=["POST"])
def create_post():
    """Create a new post from the admin form.

    Expects multipart/form-data (because it can carry a file):
      - password:  must match ADMIN_PASSWORD
      - title, category, content:  required text fields
      - excerpt:   optional; auto-generated from content if omitted
      - image:     optional file upload (png/jpg/gif/webp)
      - image_url: optional URL, used when no file is uploaded
    """
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    title = (request.form.get("title") or "").strip()
    category = (request.form.get("category") or "").strip().upper()
    content = (request.form.get("content") or "").strip()
    excerpt = (request.form.get("excerpt") or "").strip()

    if not title or not category or not content:
        return jsonify({"error": "Title, category and content are required"}), 400

    if not excerpt:
        excerpt = content.split("\n")[0][:150]

    # Prefer an uploaded file; fall back to a pasted URL.
    uploaded_url, error = save_image_if_present()
    if error:
        return jsonify({"error": error}), 400
    image_url = uploaded_url or (request.form.get("image_url") or "").strip()

    if not image_url:
        return jsonify({"error": "Provide an image file or an image URL"}), 400

    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO posts (title, category, excerpt, content, image_url, country, city)"
        " VALUES (?, ?, ?, ?, ?, ?, ?)",
        (title, category, excerpt, content, image_url,
         (request.form.get("country") or "").strip().lower(),
         normalize_city(request.form.get("city") or "")),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return jsonify({"id": new_id, "message": "Post created"}), 201


@app.route("/api/posts/<int:post_id>", methods=["PUT"])
def update_post(post_id):
    """Update an existing post (admin). Same fields as create."""
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    conn = get_db()
    existing = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
    if existing is None:
        conn.close()
        return jsonify({"error": "Post not found"}), 404

    title = (request.form.get("title") or "").strip() or existing["title"]
    category = (request.form.get("category") or "").strip().upper() or existing["category"]
    excerpt = (request.form.get("excerpt") or "").strip() or existing["excerpt"]
    content = (request.form.get("content") or "").strip() or existing["content"]

    uploaded_url, error = save_image_if_present()
    if error:
        conn.close()
        return jsonify({"error": error}), 400
    image_url = uploaded_url or (request.form.get("image_url") or "").strip() or existing["image_url"]

    # A newly uploaded image replaces an old uploaded file on disk
    if uploaded_url and uploaded_url != existing["image_url"]:
        delete_uploaded_image(existing["image_url"])

    country = (request.form.get("country") or "").strip().lower() or existing["country"]
    city = normalize_city(request.form.get("city") or "") or existing["city"]

    conn.execute(
        "UPDATE posts SET title=?, category=?, excerpt=?, content=?, image_url=?,"
        " country=?, city=? WHERE id=?",
        (title, category, excerpt, content, image_url, country, city, post_id),
    )
    conn.commit()
    conn.close()
    return jsonify({"id": post_id, "message": "Post updated"})


@app.route("/api/posts/<int:post_id>", methods=["DELETE"])
def delete_post(post_id):
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    conn = get_db()
    existing = conn.execute("SELECT image_url FROM posts WHERE id = ?", (post_id,)).fetchone()
    if existing is None:
        conn.close()
        return jsonify({"error": "Post not found"}), 404

    conn.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()
    delete_uploaded_image(existing["image_url"])
    return jsonify({"id": post_id, "message": "Post deleted"})


@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOADS_DIR, filename)


@app.route("/api/posts/<int:post_id>")
def get_post(post_id):
    """Return one post including its full content."""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM posts WHERE id = ?", (post_id,)
    ).fetchone()
    conn.close()

    if row is None:
        return jsonify({"error": "Post not found"}), 404
    return jsonify(dict(row))


# -------------------------- Listings --------------------------

@app.route("/api/listings")
def list_listings():
    """Return listings, filterable by any combination of:

        /api/listings?type=food&country=japan&budget=premium
        /api/listings?type=stay&city=osaka
        /api/listings?q=ramen

    This is the query that will eventually power the country/budget
    filter system on the food, stays, places and products pages.
    """
    limit = min(request.args.get("limit", default=200, type=int), 500)
    offset = max(request.args.get("offset", default=0, type=int), 0)

    # Build the WHERE clause piece by piece, only for filters that
    # were actually passed. Values always go through ? placeholders,
    # never into the SQL string itself (that prevents SQL injection).
    where, params = [], []
    for param, column in [("type", "type"), ("country", "country"),
                          ("city", "city"), ("budget", "budget_tier"),
                          ("category", "category")]:
        value = request.args.get(param)
        if value:
            where.append(f"{column} = ?")
            params.append(value.lower())

    search = request.args.get("q")
    if search:
        where.append("(name LIKE ? OR description LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])

    sql = "SELECT * FROM listings"
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY name LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    conn = get_db()
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route("/api/listings/<int:listing_id>")
def get_listing(listing_id):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM listings WHERE id = ?", (listing_id,)
    ).fetchone()
    conn.close()

    if row is None:
        return jsonify({"error": "Listing not found"}), 404
    return jsonify(dict(row))


# --------------------------- Reviews ---------------------------

@app.route("/api/listings/<int:listing_id>/reviews")
def list_reviews(listing_id):
    """All reviews for a listing, plus the local/expat/visitor split.

    Three separate averages — not one blended score. 'overall' is
    everyone combined for anyone who just wants a single number.
    """
    conn = get_db()
    listing = conn.execute(
        "SELECT id FROM listings WHERE id = ?", (listing_id,)
    ).fetchone()
    if listing is None:
        conn.close()
        return jsonify({"error": "Listing not found"}), 404

    rows = conn.execute("""
        SELECT r.id, r.rating, r.body, r.created_at, r.updated_at,
               u.id AS user_id, u.username, u.profile_image_url,
               u.user_type, u.country
        FROM reviews r JOIN users u ON u.id = r.user_id
        WHERE r.listing_id = ?
        ORDER BY r.created_at DESC
    """, (listing_id,)).fetchall()
    conn.close()

    reviews = [dict(row) for row in rows]

    summary = {}
    for key in ("local", "expat", "visitor"):
        ratings = [r["rating"] for r in reviews if r["user_type"] == key]
        summary[key] = {
            "average": round(sum(ratings) / len(ratings), 1) if ratings else None,
            "count": len(ratings),
        }
    all_ratings = [r["rating"] for r in reviews]
    summary["overall"] = {
        "average": round(sum(all_ratings) / len(all_ratings), 1) if all_ratings else None,
        "count": len(all_ratings),
    }

    return jsonify({"summary": summary, "reviews": reviews})


@app.route("/api/listings/<int:listing_id>/reviews", methods=["POST"])
def submit_review(listing_id):
    """Create or update the logged-in user's review for this listing.

    Submitting again updates the existing review (UNIQUE constraint)
    — one honest opinion per person per place.
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in to leave a review"}), 401

    conn = get_db()
    listing = conn.execute(
        "SELECT id FROM listings WHERE id = ?", (listing_id,)
    ).fetchone()
    if listing is None:
        conn.close()
        return jsonify({"error": "Listing not found"}), 404

    data = request.get_json(silent=True) or {}
    try:
        rating = int(data.get("rating"))
    except (TypeError, ValueError):
        conn.close()
        return jsonify({"error": "Rating must be a whole number from 1 to 5"}), 400
    body = (data.get("body") or "").strip()

    if rating < 1 or rating > 5:
        conn.close()
        return jsonify({"error": "Rating must be a whole number from 1 to 5"}), 400

    existing = conn.execute(
        "SELECT id FROM reviews WHERE listing_id = ? AND user_id = ?",
        (listing_id, user_id),
    ).fetchone()

    if existing:
        conn.execute(
            "UPDATE reviews SET rating = ?, body = ?, updated_at = datetime('now')"
            " WHERE id = ?",
            (rating, body, existing["id"]),
        )
        review_id, message = existing["id"], "Review updated"
        status = 200
    else:
        cursor = conn.execute(
            "INSERT INTO reviews (listing_id, user_id, rating, body) VALUES (?, ?, ?, ?)",
            (listing_id, user_id, rating, body),
        )
        review_id, message = cursor.lastrowid, "Review submitted"
        status = 201

    conn.commit()
    conn.close()
    return jsonify({"id": review_id, "message": message}), status


@app.route("/api/reviews/<int:review_id>", methods=["DELETE"])
def delete_review(review_id):
    """Delete a review — the author, or an admin, can do this."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "You must be logged in"}), 401

    conn = get_db()
    review = conn.execute(
        "SELECT * FROM reviews WHERE id = ?", (review_id,)
    ).fetchone()
    if review is None:
        conn.close()
        return jsonify({"error": "Review not found"}), 404

    user = conn.execute(
        "SELECT role FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    is_owner = review["user_id"] == user_id
    is_admin = (user and user["role"] == "admin") or is_authorized()

    if not (is_owner or is_admin):
        conn.close()
        return jsonify({"error": "You can only delete your own reviews"}), 403

    conn.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
    conn.commit()
    conn.close()
    return jsonify({"id": review_id, "message": "Review deleted"})


@app.route("/api/users/me/reviews")
def my_reviews():
    """The logged-in user's review history — profile count + list."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    conn = get_db()
    rows = conn.execute("""
        SELECT r.id, r.rating, r.body, r.created_at,
               l.id AS listing_id, l.name AS listing_name,
               l.type, l.city, l.country
        FROM reviews r JOIN listings l ON l.id = r.listing_id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
    """, (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route("/api/listings", methods=["POST"])
def create_listing():
    """Create a listing from the admin (multipart form, like posts)."""
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    fields = {
        key: (request.form.get(key) or "").strip()
        for key in ["type", "name", "country", "city", "price_range",
                    "budget_tier", "category", "description", "content"]
    }
    if not fields["type"] or not fields["name"] or not fields["country"]:
        return jsonify({"error": "Type, name and country are required"}), 400
    if fields["type"] not in {"food", "stay", "place", "product"}:
        return jsonify({"error": "Type must be food, stay, place or product"}), 400

    rating = request.form.get("rating", type=float)

    uploaded_url, error = save_image_if_present()
    if error:
        return jsonify({"error": error}), 400
    image_url = uploaded_url or (request.form.get("image_url") or "").strip()

    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO listings (type, name, country, city, price_range,"
        " budget_tier, category, description, content, rating, image_url)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (fields["type"], fields["name"], fields["country"].lower(),
         normalize_city(fields["city"]), fields["price_range"], fields["budget_tier"],
         fields["category"], fields["description"], fields["content"],
         rating, image_url),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return jsonify({"id": new_id, "message": "Listing created"}), 201


@app.route("/api/listings/<int:listing_id>", methods=["PUT"])
def update_listing(listing_id):
    """Update an existing listing (admin)."""
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM listings WHERE id = ?", (listing_id,)
    ).fetchone()
    if existing is None:
        conn.close()
        return jsonify({"error": "Listing not found"}), 404

    def field(name, transform=lambda v: v):
        value = (request.form.get(name) or "").strip()
        return transform(value) if value else existing[name]

    listing_type = field("type")
    if listing_type not in {"food", "stay", "place", "product"}:
        conn.close()
        return jsonify({"error": "Type must be food, stay, place or product"}), 400

    rating = request.form.get("rating", type=float)
    if rating is None:
        rating = existing["rating"]

    uploaded_url, error = save_image_if_present()
    if error:
        conn.close()
        return jsonify({"error": error}), 400
    image_url = uploaded_url or (request.form.get("image_url") or "").strip() or existing["image_url"]
    if uploaded_url and uploaded_url != existing["image_url"]:
        delete_uploaded_image(existing["image_url"])

    conn.execute(
        "UPDATE listings SET type=?, name=?, country=?, city=?, price_range=?,"
        " budget_tier=?, category=?, description=?, content=?, rating=?, image_url=?"
        " WHERE id=?",
        (listing_type, field("name"), field("country", str.lower),
         field("city", normalize_city), field("price_range"), field("budget_tier"),
         field("category"), field("description"), field("content"),
         rating, image_url, listing_id),
    )
    conn.commit()
    conn.close()
    return jsonify({"id": listing_id, "message": "Listing updated"})


@app.route("/api/listings/<int:listing_id>", methods=["DELETE"])
def delete_listing(listing_id):
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    conn = get_db()
    existing = conn.execute(
        "SELECT image_url FROM listings WHERE id = ?", (listing_id,)
    ).fetchone()
    if existing is None:
        conn.close()
        return jsonify({"error": "Listing not found"}), 404

    conn.execute("DELETE FROM listings WHERE id = ?", (listing_id,))
    # Also drop it from any curated top-5 lists it appeared in
    conn.execute("DELETE FROM trending WHERE listing_id = ?", (listing_id,))
    conn.commit()
    conn.close()
    delete_uploaded_image(existing["image_url"])
    return jsonify({"id": listing_id, "message": "Listing deleted"})


# -------------------------- Trending --------------------------

COUNTRY_ORDER = ["japan", "china", "vietnam", "cambodia", "australia"]


# --------------------------- Tours ---------------------------

def ensure_tours_tables():
    """Create the tours, tour_stops and booking_requests tables and
    seed the five launch tours once.

    A tour is a product built FROM the listings table: every stop
    references a real, visited listing, so tour pages and listing
    pages cross-link automatically. Booking requests are a manual
    pipeline (request -> confirm over chat -> deposit link), so no
    payment processing lives here. Safe to run on every boot: the
    seed only fires when the tours table is empty.
    """
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tours (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            slug           TEXT NOT NULL UNIQUE,
            title          TEXT NOT NULL,
            country        TEXT NOT NULL,
            city           TEXT DEFAULT '',   -- '' when it spans cities
            kind           TEXT NOT NULL DEFAULT 'packaged',  -- packaged | bespoke
            duration_label TEXT DEFAULT '',   -- e.g. "Full day, ~10 hours"
            duration_days  INTEGER NOT NULL DEFAULT 1,
            price_usd      INTEGER NOT NULL,
            max_group      INTEGER NOT NULL DEFAULT 8,
            themes         TEXT DEFAULT '',   -- comma list: food,temples,history,photo
            tagline        TEXT DEFAULT '',
            description    TEXT DEFAULT '',
            includes       TEXT DEFAULT '',   -- one per line
            excludes       TEXT DEFAULT '',
            meeting_point  TEXT DEFAULT '',
            image_url      TEXT DEFAULT '',
            guide_name     TEXT DEFAULT '',
            status         TEXT NOT NULL DEFAULT 'live',  -- live | coming_soon
            created_at     TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tour_stops (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            tour_id      INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
            listing_id   INTEGER NOT NULL REFERENCES listings(id),
            position     INTEGER NOT NULL,   -- 1-based stop order
            time_label   TEXT DEFAULT '',    -- e.g. "05:00" or "Day 2 morning"
            note         TEXT DEFAULT '',
            duration_min INTEGER
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS booking_requests (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            tour_id         INTEGER REFERENCES tours(id),  -- NULL = bespoke build
            name            TEXT NOT NULL,
            email           TEXT NOT NULL,
            dates           TEXT DEFAULT '',
            party_size      INTEGER,
            message         TEXT DEFAULT '',
            bespoke_payload TEXT DEFAULT '',               -- JSON from the tour builder
            status          TEXT NOT NULL DEFAULT 'new',   -- new|confirmed|completed|cancelled
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    count = conn.execute("SELECT COUNT(*) FROM tours").fetchone()[0]
    if count == 0:
        seed_tours(conn)

    conn.commit()
    conn.close()


# The five launch tours. stops are listing ids (see listings table);
# each tour's hero image is taken from its first stop's listing.
TOURS_SEED = [
    {
        "slug": "angkor-sunrise-discovery",
        "title": "Angkor Sunrise Discovery",
        "country": "cambodia", "city": "siem-reap",
        "duration_label": "Full day, ~10 hours", "duration_days": 1,
        "price_usd": 75, "max_group": 8,
        "themes": "temples,history,photo",
        "tagline": "Sunrise at Angkor Wat, then the great temples before the crowds — with a local guide who grew up here.",
        "description": (
            "We start in the dark at 4:45 AM to catch sunrise over Angkor Wat's towers, "
            "then explore the temple while the tour buses are still at breakfast. From there "
            "it's Angkor Thom and the faces of Bayon, a local Khmer lunch, and Ta Prohm in "
            "the afternoon light before heading back.\n\n"
            "This is the classic Angkor day, done properly: unhurried, in the right order, "
            "with the stories you don't get from a plaque."
        ),
        "includes": "Hotel pickup in Siem Reap\nEnglish & Khmer speaking local guide\nAir-conditioned transport\nCold water and towels\nKhmer lunch",
        "excludes": "Angkor Archaeological Park pass ($37, bought at the gate)\nDinner",
        "meeting_point": "Hotel pickup anywhere in Siem Reap town",
        "guide_name": "Eastworld",
        "stops": [
            (284, "05:00", "Sunrise at the world's largest religious monument, then a full walkthrough.", 180),
            (287, "09:00", "The walled royal city — South Gate, Terrace of the Elephants.", 60),
            (285, "10:00", "The 216 smiling faces. Best light of the morning.", 75),
            (109, "12:30", "Proper Khmer lunch at a local institution.", 75),
            (286, "14:30", "The 'Tomb Raider' temple, swallowed by silk-cotton trees.", 90),
        ],
    },
    {
        "slug": "siem-reap-after-dark-food",
        "title": "Siem Reap After Dark: Street Food Tour",
        "country": "cambodia", "city": "siem-reap",
        "duration_label": "Evening, ~4 hours", "duration_days": 1,
        "price_usd": 39, "max_group": 8,
        "themes": "food,nightlife",
        "tagline": "The city wakes up when the temples close. Eat your way through it.",
        "description": (
            "Most visitors never see Siem Reap's second act. We start at the evening food "
            "stalls where locals actually eat, work through Khmer classics you won't find "
            "on tourist menus, and finish on Pub Street with a drink in hand.\n\n"
            "Come hungry — this is five-plus stops of real eating, not tasting spoons."
        ),
        "includes": "Local English & Khmer speaking guide\nAll food at 5+ stops\nOne drink on Pub Street",
        "excludes": "Extra drinks\nHotel pickup (central meeting point)",
        "meeting_point": "Old Market (Phsar Chas) entrance, 5:45 PM",
        "guide_name": "Eastworld",
        "stops": [
            (111, "18:00", "Grilled meats, noodle stalls and the night-market classics.", 60),
            (109, "19:00", "Amok and Khmer curry done right.", 60),
            (113, "20:00", "Family-recipe Khmer dishes in a wooden house.", 45),
            (107, "20:45", "Vocational-training restaurant with serious food.", 45),
            (288, "21:30", "Finish with a drink where the night ends up anyway.", 60),
        ],
    },
    {
        "slug": "phnom-penh-street-food-riverside",
        "title": "Phnom Penh Street Food & Riverside Walk",
        "country": "cambodia", "city": "phnom-penh",
        "duration_label": "Half day, ~4 hours", "duration_days": 1,
        "price_usd": 35, "max_group": 8,
        "themes": "food,culture",
        "tagline": "Markets, coffee, river air — the capital the way Phnom Penh people live it.",
        "description": (
            "We dive into Central Market's food halls in the morning rush, snack through "
            "the stalls Phnom Penh grew up on, break for proper Khmer coffee, and walk it "
            "off along the Sisowath Quay riverside as the city comes out for the evening.\n\n"
            "Part food tour, part walking orientation — the best first day in the capital."
        ),
        "includes": "Local English & Khmer speaking guide\nAll tastings at 4+ stops\nKhmer coffee or fresh sugarcane juice",
        "excludes": "Lunch (we can point you to the right place after)\nTransport",
        "meeting_point": "Central Market (Phsar Thmei) main entrance, 8:30 AM",
        "guide_name": "Eastworld",
        "stops": [
            (282, "08:30", "The art-deco market and its legendary food halls.", 75),
            (98, "10:00", "Market-side Khmer dishes the locals queue for.", 45),
            (97, "11:00", "Former-street-kid training restaurant, fearless menu.", 45),
            (283, "11:45", "Riverside walk along the Tonlé Sap — snacks and river air.", 60),
            (101, "12:45", "Finish with coffee or brunch by the river.", 45),
        ],
    },
    {
        "slug": "phnom-penh-history-remembrance",
        "title": "Phnom Penh History & Remembrance",
        "country": "cambodia", "city": "phnom-penh",
        "duration_label": "Half day, ~5 hours", "duration_days": 1,
        "price_usd": 45, "max_group": 8,
        "themes": "history,culture",
        "tagline": "The Royal Palace to Tuol Sleng — Cambodia's triumphs and its darkest years, told honestly.",
        "description": (
            "A morning that covers the full arc: the gilded Royal Palace and the treasures "
            "of the National Museum, then Tuol Sleng (S-21), where the Khmer Rouge years "
            "are confronted directly and respectfully.\n\n"
            "This is heavy material handled with care — I grew up with these stories, and "
            "the tour ends over lunch where you can ask anything."
        ),
        "includes": "Local English & Khmer speaking guide\nTransport between sites\nLunch\nCold water",
        "excludes": "Entry fees (Royal Palace $10, Tuol Sleng $5, Museum $10)",
        "meeting_point": "Hotel pickup anywhere in central Phnom Penh",
        "guide_name": "Eastworld",
        "stops": [
            (279, "08:30", "The Silver Pagoda and the throne halls.", 90),
            (281, "10:30", "The world's finest Khmer sculpture collection.", 60),
            (280, "11:45", "S-21. Difficult, essential, handled with respect.", 90),
            (99, "13:45", "Late lunch and open conversation at a calm garden café.", 60),
        ],
    },
    {
        "slug": "ultimate-cambodia-3-day",
        "title": "Ultimate Cambodia: 3 Days, Phnom Penh to Angkor",
        "country": "cambodia", "city": "",
        "duration_label": "3 days, 2 nights", "duration_days": 3,
        "price_usd": 390, "max_group": 6,
        "themes": "temples,food,history,culture",
        "tagline": "The whole country in one long weekend — capital, cuisine and the temples, all handled.",
        "description": (
            "Day one: Phnom Penh's Royal Palace, Tuol Sleng and dinner at the country's "
            "flagship Khmer restaurant. Day two: we travel to Siem Reap and ease in with "
            "the evening food scene. Day three: sunrise at Angkor Wat, Bayon and Ta Prohm, "
            "and a farewell dinner.\n\n"
            "Everything is arranged — transport, timing, reservations. You just show up. "
            "This is the tour I would give a friend with three days and one chance."
        ),
        "includes": "Personal guide for all 3 days\nAll ground transport incl. Phnom Penh–Siem Reap\nTwo signature dinners + all tour food stops\nAirport/hotel pickup and drop-off",
        "excludes": "Accommodation (we recommend and book for you)\nAngkor Park pass ($37)\nEntry fees",
        "meeting_point": "Phnom Penh airport or your hotel, day 1, 9:00 AM",
        "guide_name": "Eastworld",
        "stops": [
            (279, "Day 1 · 09:30", "Royal Palace and Silver Pagoda.", 90),
            (280, "Day 1 · 13:00", "Tuol Sleng, with time and context.", 90),
            (100, "Day 1 · 19:00", "Dinner at Cambodia's flagship Khmer table.", 120),
            (284, "Day 3 · 05:00", "Sunrise at Angkor Wat.", 180),
            (285, "Day 3 · 09:30", "Bayon and the faces of Angkor Thom.", 90),
            (286, "Day 3 · 14:00", "Ta Prohm in the afternoon light.", 90),
            (106, "Day 3 · 19:30", "Farewell dinner, refined Khmer cooking.", 120),
        ],
    },
]


def seed_tours(conn):
    """Insert the launch tours and their stops. Stop listing ids are
    validated against the listings table so a bad id fails loudly at
    seed time rather than as a broken link on the site."""
    for tour in TOURS_SEED:
        stops = tour.pop("stops")
        first_image = conn.execute(
            "SELECT image_url FROM listings WHERE id = ?", (stops[0][0],)
        ).fetchone()
        tour["image_url"] = first_image["image_url"] if first_image else ""
        cursor = conn.execute(
            "INSERT INTO tours (slug, title, country, city, kind, duration_label,"
            " duration_days, price_usd, max_group, themes, tagline, description,"
            " includes, excludes, meeting_point, image_url, guide_name, status)"
            " VALUES (:slug, :title, :country, :city, 'packaged', :duration_label,"
            " :duration_days, :price_usd, :max_group, :themes, :tagline, :description,"
            " :includes, :excludes, :meeting_point, :image_url, :guide_name, 'live')",
            tour,
        )
        tour_id = cursor.lastrowid
        for position, (listing_id, time_label, note, duration_min) in enumerate(stops, 1):
            conn.execute(
                "INSERT INTO tour_stops (tour_id, listing_id, position, time_label,"
                " note, duration_min) VALUES (?, ?, ?, ?, ?, ?)",
                (tour_id, listing_id, position, time_label, note, duration_min),
            )
        tour["stops"] = stops  # restore for idempotence of the constant
    print(f"Seeded {len(TOURS_SEED)} tours.")


@app.route("/api/tours")
def list_tours():
    """Tours for the catalog page. Filters: country, city, kind, status
    (status defaults to live so coming-soon Japan tours stay hidden
    until flipped). Includes stop_count so cards can say '5 stops'."""
    where, params = [], []
    status = request.args.get("status", "live")
    if status != "all":
        where.append("status = ?")
        params.append(status)
    for param in ("country", "city", "kind"):
        value = request.args.get(param)
        if value:
            where.append(f"{param} = ?")
            params.append(value.lower())

    sql = ("SELECT t.*, (SELECT COUNT(*) FROM tour_stops s WHERE s.tour_id = t.id)"
           " AS stop_count FROM tours t")
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY t.price_usd"

    conn = get_db()
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route("/api/tours/<int:tour_id>")
def get_tour(tour_id):
    """Full tour detail: the tour row plus its stops joined to the
    listing each stop visits (name, image, coords, link) so the tour
    page can cross-link and the builder can draw the route."""
    conn = get_db()
    tour = conn.execute("SELECT * FROM tours WHERE id = ?", (tour_id,)).fetchone()
    if tour is None:
        conn.close()
        return jsonify({"error": "Tour not found"}), 404
    stops = conn.execute(
        "SELECT s.position, s.time_label, s.note, s.duration_min,"
        " l.id AS listing_id, l.name, l.type, l.city, l.image_url, l.link, l.lat, l.lng"
        " FROM tour_stops s JOIN listings l ON l.id = s.listing_id"
        " WHERE s.tour_id = ? ORDER BY s.position",
        (tour_id,),
    ).fetchall()
    conn.close()
    result = dict(tour)
    result["stops"] = [dict(s) for s in stops]
    return jsonify(result)


@app.route("/api/tours/by-listing/<int:listing_id>")
def tours_for_listing(listing_id):
    """The reverse lookup behind the 'Visit this on a tour' block on
    listing pages: which live tours stop at this place."""
    conn = get_db()
    rows = conn.execute(
        "SELECT t.id, t.slug, t.title, t.tagline, t.price_usd, t.duration_label,"
        " t.image_url FROM tours t JOIN tour_stops s ON s.tour_id = t.id"
        " WHERE s.listing_id = ? AND t.status = 'live' ORDER BY t.price_usd",
        (listing_id,),
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route("/api/booking-requests", methods=["POST"])
def create_booking_request():
    """Public booking request. Guest checkout by design — name + email
    is all we insist on. tour_id NULL means a bespoke builder request,
    whose selections arrive as JSON in bespoke_payload."""
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    if not name or not email or "@" not in email:
        return jsonify({"error": "A name and a valid email are required."}), 400

    tour_id = data.get("tour_id")
    if tour_id is not None:
        conn = get_db()
        tour = conn.execute(
            "SELECT id FROM tours WHERE id = ? AND status = 'live'", (tour_id,)
        ).fetchone()
        conn.close()
        if tour is None:
            return jsonify({"error": "That tour isn't available."}), 400

    party_size = data.get("party_size")
    try:
        party_size = int(party_size) if party_size not in (None, "") else None
        if party_size is not None and not (1 <= party_size <= 30):
            party_size = None
    except (TypeError, ValueError):
        party_size = None

    bespoke = data.get("bespoke_payload")
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO booking_requests (tour_id, name, email, dates, party_size,"
        " message, bespoke_payload) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (tour_id, name, email,
         (data.get("dates") or "").strip()[:200], party_size,
         (data.get("message") or "").strip()[:2000],
         json.dumps(bespoke) if bespoke else ""),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({"ok": True, "id": new_id}), 201


@app.route("/api/booking-requests")
def list_booking_requests():
    """Admin: the booking pipeline, newest first."""
    if not is_authorized():
        return jsonify({"error": "Unauthorized"}), 401
    conn = get_db()
    rows = conn.execute(
        "SELECT b.*, t.title AS tour_title FROM booking_requests b"
        " LEFT JOIN tours t ON t.id = b.tour_id"
        " ORDER BY b.created_at DESC LIMIT 500"
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route("/api/booking-requests/<int:request_id>", methods=["PUT"])
def update_booking_request(request_id):
    """Admin: move a request through new -> confirmed -> completed
    (or cancelled)."""
    if not is_authorized():
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("new", "confirmed", "completed", "cancelled"):
        return jsonify({"error": "Unknown status"}), 400
    conn = get_db()
    cursor = conn.execute(
        "UPDATE booking_requests SET status = ? WHERE id = ?", (status, request_id)
    )
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        return jsonify({"error": "Request not found"}), 404
    return jsonify({"ok": True})


def trending_items(conn, tab, country):
    """Ranked picks for one tab+country, joined with listing details."""
    rows = conn.execute(
        "SELECT t.rank, l.id, l.name, l.city, l.country, l.type,"
        "       l.image_url, l.link, l.rating"
        " FROM trending t JOIN listings l ON l.id = t.listing_id"
        " WHERE t.tab = ? AND t.country = ? ORDER BY t.rank",
        (tab, country),
    ).fetchall()
    return [dict(row) for row in rows]


@app.route("/api/trending")
def get_trending():
    """The homepage sidebar data.

        /api/trending?country=japan  -> top 5 per tab for Japan
        /api/trending?country=all    -> each country's #1 pick per tab
    """
    country = (request.args.get("country") or "all").lower()

    conn = get_db()
    result = {}
    for tab in TAB_TO_TYPE:
        if country == "all":
            # A hand-curated "world" list (set in the admin) wins.
            curated = trending_items(conn, tab, "world")
            if curated:
                result[tab] = curated
                continue
            # Fallback: always a top FIVE, regardless of how many
            # countries have picks — every country's #1 first, then
            # #2s, and so on until five slots are filled.
            per_country = [trending_items(conn, tab, c) for c in COUNTRY_ORDER]
            picks = []
            rank = 0
            while len(picks) < 5 and any(len(items) > rank for items in per_country):
                for items in per_country:
                    if rank < len(items) and len(picks) < 5:
                        picks.append(items[rank])
                rank += 1
            result[tab] = picks
        else:
            result[tab] = trending_items(conn, tab, country)
    conn.close()
    return jsonify(result)


@app.route("/api/trending", methods=["PUT"])
def set_trending():
    """Replace the top 5 for one tab+country (admin).

    Expects JSON: {"tab": "food", "country": "japan", "listing_ids": [5, 12, 3, 40, 7]}
    The order of listing_ids is the ranking.
    """
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    data = request.get_json(silent=True) or {}
    tab = data.get("tab")
    country = (data.get("country") or "").lower()
    listing_ids = data.get("listing_ids")

    if tab not in TAB_TO_TYPE:
        return jsonify({"error": "Tab must be food, stays, places or products"}), 400
    if not country:
        return jsonify({"error": "Country is required"}), 400
    # An empty list is allowed: it clears the curation (for "world"
    # that means falling back to the automatic top-5 mix).
    if not isinstance(listing_ids, list) or len(listing_ids) > 5:
        return jsonify({"error": "Provide up to 5 listing_ids in ranked order"}), 400

    conn = get_db()
    for listing_id in listing_ids:
        if conn.execute("SELECT 1 FROM listings WHERE id = ?", (listing_id,)).fetchone() is None:
            conn.close()
            return jsonify({"error": f"Listing {listing_id} does not exist"}), 400

    conn.execute("DELETE FROM trending WHERE tab = ? AND country = ?", (tab, country))
    conn.executemany(
        "INSERT INTO trending (tab, country, rank, listing_id) VALUES (?, ?, ?, ?)",
        [(tab, country, i + 1, lid) for i, lid in enumerate(listing_ids)],
    )
    conn.commit()
    conn.close()
    return jsonify({"message": f"Top {len(listing_ids)} saved for {tab}/{country}"})


# --------------------------- Videos ---------------------------

@app.route("/api/videos")
def list_videos():
    """The homepage video rail, in curated order.

    Each item carries thumbnail/embed URLs derived from the
    YouTube id, so the frontend never builds URLs itself.
    """
    limit = min(request.args.get("limit", default=50, type=int), 100)
    country = (request.args.get("country") or "").strip().lower()
    where = " WHERE country = ?" if country else ""
    params = (country, limit) if country else (limit,)
    conn = get_db()
    rows = conn.execute(
        "SELECT id, title, youtube_id, position, country FROM videos"
        f"{where} ORDER BY position, id LIMIT ?",
        params,
    ).fetchall()
    conn.close()
    return jsonify([
        {
            **dict(row),
            "thumbnail": f"https://i.ytimg.com/vi/{row['youtube_id']}/hqdefault.jpg",
            "embed_url": f"https://www.youtube.com/embed/{row['youtube_id']}",
            "watch_url": f"https://www.youtube.com/watch?v={row['youtube_id']}",
        }
        for row in rows
    ])


@app.route("/api/videos", methods=["POST"])
def create_video():
    """Add a video (admin). JSON: {"title": ..., "url": <YouTube URL or id>}"""
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    youtube_id = youtube_id_from(data.get("url"))

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if not youtube_id:
        return jsonify({"error": "That doesn't look like a YouTube link"}), 400

    conn = get_db()
    next_pos = conn.execute(
        "SELECT COALESCE(MAX(position), 0) + 1 FROM videos"
    ).fetchone()[0]
    cursor = conn.execute(
        "INSERT INTO videos (title, youtube_id, position, country) VALUES (?, ?, ?, ?)",
        (title, youtube_id, next_pos, (data.get("country") or "").strip().lower()),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({"id": new_id, "message": "Video added"}), 201


@app.route("/api/videos/order", methods=["PUT"])
def reorder_videos():
    """Set the rail order (admin). JSON: {"ids": [7, 2, 5, ...]}"""
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    ids = (request.get_json(silent=True) or {}).get("ids")
    if not isinstance(ids, list) or not all(isinstance(i, int) for i in ids):
        return jsonify({"error": "Provide ids as a list of numbers"}), 400

    conn = get_db()
    conn.executemany(
        "UPDATE videos SET position = ? WHERE id = ?",
        [(pos + 1, vid) for pos, vid in enumerate(ids)],
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Order saved"})


@app.route("/api/videos/<int:video_id>", methods=["PUT"])
def update_video(video_id):
    """Edit a video's title and/or URL (admin)."""
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    conn = get_db()
    existing = conn.execute("SELECT * FROM videos WHERE id = ?", (video_id,)).fetchone()
    if existing is None:
        conn.close()
        return jsonify({"error": "Video not found"}), 404

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip() or existing["title"]
    youtube_id = existing["youtube_id"]
    if (data.get("url") or "").strip():
        youtube_id = youtube_id_from(data["url"])
        if not youtube_id:
            conn.close()
            return jsonify({"error": "That doesn't look like a YouTube link"}), 400

    conn.execute(
        "UPDATE videos SET title = ?, youtube_id = ?, country = ? WHERE id = ?",
        (title, youtube_id,
         (data.get("country") or "").strip().lower() or existing["country"],
         video_id),
    )
    conn.commit()
    conn.close()
    return jsonify({"id": video_id, "message": "Video updated"})


@app.route("/api/videos/<int:video_id>", methods=["DELETE"])
def delete_video(video_id):
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    conn = get_db()
    if conn.execute("SELECT 1 FROM videos WHERE id = ?", (video_id,)).fetchone() is None:
        conn.close()
        return jsonify({"error": "Video not found"}), 404
    conn.execute("DELETE FROM videos WHERE id = ?", (video_id,))
    conn.commit()
    conn.close()
    return jsonify({"id": video_id, "message": "Video deleted"})


# --------------------------- Events ---------------------------

EVENT_FIELDS = ["title", "city", "country", "event_date", "end_date", "time",
                "venue", "price", "description", "sponsor", "link"]


@app.route("/api/events")
def list_events():
    """All events, soonest first. The page splits featured/past itself."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM events ORDER BY event_date").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route("/api/events", methods=["POST"])
def create_event():
    """Create an event (admin, multipart form so it can carry an image)."""
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    fields = {key: (request.form.get(key) or "").strip() for key in EVENT_FIELDS}
    if not fields["title"] or not fields["city"] or not fields["event_date"]:
        return jsonify({"error": "Title, city and date are required"}), 400
    fields["city"] = normalize_city(fields["city"])
    fields["country"] = fields["country"].lower()
    featured = 1 if request.form.get("featured") else 0

    uploaded_url, error = save_image_if_present()
    if error:
        return jsonify({"error": error}), 400
    image_url = uploaded_url or (request.form.get("image_url") or "").strip()

    conn = get_db()
    if featured:  # only one hero at a time
        conn.execute("UPDATE events SET featured = 0")
    cursor = conn.execute(
        f"INSERT INTO events ({', '.join(EVENT_FIELDS)}, image_url, featured)"
        f" VALUES ({', '.join('?' * len(EVENT_FIELDS))}, ?, ?)",
        [fields[k] for k in EVENT_FIELDS] + [image_url, featured],
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({"id": new_id, "message": "Event created"}), 201


@app.route("/api/events/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    conn = get_db()
    existing = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    if existing is None:
        conn.close()
        return jsonify({"error": "Event not found"}), 404

    # Text fields come through as-is (empty string clears a field);
    # missing fields keep their current value.
    values = {}
    for key in EVENT_FIELDS:
        sent = request.form.get(key)
        values[key] = sent.strip() if sent is not None else existing[key]
    values["city"] = normalize_city(values["city"])
    values["country"] = values["country"].lower()
    featured = 1 if request.form.get("featured") else 0

    uploaded_url, error = save_image_if_present()
    if error:
        conn.close()
        return jsonify({"error": error}), 400
    image_url = uploaded_url or (request.form.get("image_url") or "").strip() or existing["image_url"]
    if uploaded_url and uploaded_url != existing["image_url"]:
        delete_uploaded_image(existing["image_url"])

    if featured:
        conn.execute("UPDATE events SET featured = 0")
    conn.execute(
        f"UPDATE events SET {', '.join(f'{k} = ?' for k in EVENT_FIELDS)},"
        " image_url = ?, featured = ? WHERE id = ?",
        [values[k] for k in EVENT_FIELDS] + [image_url, featured, event_id],
    )
    conn.commit()
    conn.close()
    return jsonify({"id": event_id, "message": "Event updated"})


@app.route("/api/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    conn = get_db()
    existing = conn.execute("SELECT image_url FROM events WHERE id = ?", (event_id,)).fetchone()
    if existing is None:
        conn.close()
        return jsonify({"error": "Event not found"}), 404
    conn.execute("DELETE FROM events WHERE id = ?", (event_id,))
    conn.commit()
    conn.close()
    delete_uploaded_image(existing["image_url"])
    return jsonify({"id": event_id, "message": "Event deleted"})


# ---------------------- Carousel slides -----------------------

@app.route("/api/slides")
def list_slides():
    """Homepage carousels: {"top": [slides...], "bottom": [slides...]}

    Optional ?country= filter for the homepage's country toggle.
    """
    conn = get_db()
    country = (request.args.get("country") or "").strip().lower()
    if country:
        rows = conn.execute(
            "SELECT * FROM slides WHERE country = ? ORDER BY position, id",
            (country,),
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM slides ORDER BY position, id").fetchall()
    conn.close()
    result = {"top": [], "bottom": []}
    for row in rows:
        result.setdefault(row["carousel"], []).append(dict(row))
    return jsonify(result)


@app.route("/api/slides", methods=["POST"])
def create_slide():
    """Add a slide (admin, multipart form)."""
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    carousel = (request.form.get("carousel") or "").strip()
    title = (request.form.get("title") or "").strip()
    category = (request.form.get("category") or "").strip().upper()
    description = (request.form.get("description") or "").strip()
    link = (request.form.get("link") or "").strip()

    if carousel not in {"top", "bottom"}:
        return jsonify({"error": "Carousel must be top or bottom"}), 400
    if not title:
        return jsonify({"error": "Title is required"}), 400

    uploaded_url, error = save_image_if_present()
    if error:
        return jsonify({"error": error}), 400
    image_url = uploaded_url or (request.form.get("image_url") or "").strip()
    if not image_url:
        return jsonify({"error": "Provide an image file or an image URL"}), 400

    conn = get_db()
    next_pos = conn.execute(
        "SELECT COALESCE(MAX(position), 0) + 1 FROM slides WHERE carousel = ?",
        (carousel,),
    ).fetchone()[0]
    cursor = conn.execute(
        "INSERT INTO slides (carousel, category, title, description, image_url,"
        " link, position, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (carousel, category, title, description, image_url, link, next_pos,
         (request.form.get("country") or "").strip().lower()),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({"id": new_id, "message": "Slide added"}), 201


@app.route("/api/slides/order", methods=["PUT"])
def reorder_slides():
    """Set slide order within one carousel (admin). JSON: {"ids": [...]}"""
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    ids = (request.get_json(silent=True) or {}).get("ids")
    if not isinstance(ids, list) or not all(isinstance(i, int) for i in ids):
        return jsonify({"error": "Provide ids as a list of numbers"}), 400

    conn = get_db()
    conn.executemany(
        "UPDATE slides SET position = ? WHERE id = ?",
        [(pos + 1, sid) for pos, sid in enumerate(ids)],
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Order saved"})


@app.route("/api/slides/<int:slide_id>", methods=["PUT"])
def update_slide(slide_id):
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    conn = get_db()
    existing = conn.execute("SELECT * FROM slides WHERE id = ?", (slide_id,)).fetchone()
    if existing is None:
        conn.close()
        return jsonify({"error": "Slide not found"}), 404

    values = {}
    for key in ["category", "title", "description", "link", "country"]:
        sent = request.form.get(key)
        values[key] = sent.strip() if sent is not None else existing[key]
    values["category"] = values["category"].upper()
    values["country"] = values["country"].lower()
    if not values["title"]:
        conn.close()
        return jsonify({"error": "Title is required"}), 400

    uploaded_url, error = save_image_if_present()
    if error:
        conn.close()
        return jsonify({"error": error}), 400
    image_url = uploaded_url or (request.form.get("image_url") or "").strip() or existing["image_url"]
    if uploaded_url and uploaded_url != existing["image_url"]:
        delete_uploaded_image(existing["image_url"])

    conn.execute(
        "UPDATE slides SET category = ?, title = ?, description = ?, link = ?,"
        " image_url = ?, country = ? WHERE id = ?",
        (values["category"], values["title"], values["description"],
         values["link"], image_url, values["country"], slide_id),
    )
    conn.commit()
    conn.close()
    return jsonify({"id": slide_id, "message": "Slide updated"})


@app.route("/api/slides/<int:slide_id>", methods=["DELETE"])
def delete_slide(slide_id):
    if not is_authorized():
        return jsonify({"error": "Wrong password"}), 401

    conn = get_db()
    existing = conn.execute("SELECT image_url FROM slides WHERE id = ?", (slide_id,)).fetchone()
    if existing is None:
        conn.close()
        return jsonify({"error": "Slide not found"}), 404
    conn.execute("DELETE FROM slides WHERE id = ?", (slide_id,))
    conn.commit()
    conn.close()
    delete_uploaded_image(existing["image_url"])
    return jsonify({"id": slide_id, "message": "Slide deleted"})


# ----------------------- Static frontend ----------------------

def render_with_seo(filename, title, description, image, path):
    """Serve a static page with real SEO/social tags injected.

    post.html and listing.html render their content with JavaScript,
    which Google handles but social-media crawlers (WhatsApp, X,
    Instagram DMs...) do not. Injecting the tags server-side means
    shared links show a proper title, description and image card.
    """
    page = (FRONTEND_DIR / filename).read_text()
    title = html_lib.escape(title)
    description = html_lib.escape(description[:200])
    url = request.url_root.rstrip("/") + path
    image_tag = f'\n  <meta property="og:image" content="{html_lib.escape(image)}">' if image else ""
    tags = f"""<title>{title}</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Eastworld">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">{image_tag}
  <meta property="og:url" content="{url}">
  <meta name="twitter:card" content="summary_large_image">"""
    return page.replace("<!-- SEO_TAGS -->", tags)


@app.route("/post.html")
def post_page():
    post_id = request.args.get("id", type=int)
    conn = get_db()
    row = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone() if post_id else None
    conn.close()

    if row is None:
        return render_with_seo("post.html", "Eastworld",
                               "The latest in Asian culture, food, stays and travel.",
                               "", "/post.html")
    image = row["image_url"]
    if image.startswith("/"):
        image = request.url_root.rstrip("/") + image
    return render_with_seo("post.html", f"{row['title']} - Eastworld",
                           row["excerpt"], image, f"/post.html?id={post_id}")


@app.route("/listing.html")
def listing_page():
    listing_id = request.args.get("id", type=int)
    conn = get_db()
    row = conn.execute("SELECT * FROM listings WHERE id = ?", (listing_id,)).fetchone() if listing_id else None
    conn.close()

    if row is None:
        return render_with_seo("listing.html", "Eastworld",
                               "The latest in Asian culture, food, stays and travel.",
                               "", "/listing.html")
    place = (row["city"] or row["country"]).title()
    description = row["description"] or f"{row['name']} in {place} — on Eastworld."
    image = row["image_url"]
    if image.startswith("/"):
        image = request.url_root.rstrip("/") + image
    return render_with_seo("listing.html", f"{row['name']}, {place} - Eastworld",
                           description, image, f"/listing.html?id={listing_id}")


@app.route("/tour.html")
def tour_page():
    tour_id = request.args.get("id", type=int)
    conn = get_db()
    row = conn.execute("SELECT * FROM tours WHERE id = ?", (tour_id,)).fetchone() if tour_id else None
    conn.close()

    if row is None:
        return render_with_seo("tour.html", "Eastworld Tours",
                               "Local-led tours in Cambodia, built from places we've actually been.",
                               "", "/tour.html")
    place = (row["city"] or row["country"]).replace("-", " ").title()
    description = row["tagline"] or f"{row['title']} — a local-led tour in {place}."
    image = row["image_url"]
    if image.startswith("/"):
        image = request.url_root.rstrip("/") + image
    return render_with_seo("tour.html", f"{row['title']} - Eastworld Tours",
                           description, image, f"/tour.html?id={tour_id}")


@app.route("/sitemap.xml")
def sitemap():
    """Every page on the site, for search engines."""
    base = request.url_root.rstrip("/")
    urls = [f"{base}/"] + [
        f"{base}/{page}" for page in
        ["tours.html", "tour-builder.html", "food.html", "stays.html", "places.html",
         "cities.html"]
    ]

    conn = get_db()
    urls += [f"{base}/post.html?id={r['id']}"
             for r in conn.execute("SELECT id FROM posts ORDER BY id")]
    urls += [f"{base}/listing.html?id={r['id']}"
             for r in conn.execute("SELECT id FROM listings ORDER BY id")]
    urls += [f"{base}/tour.html?id={r['id']}"
             for r in conn.execute("SELECT id FROM tours WHERE status = 'live' ORDER BY id")]
    conn.close()

    entries = "\n".join(f"  <url><loc>{html_lib.escape(u)}</loc></url>" for u in urls)
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           f"{entries}\n</urlset>")
    return xml, 200, {"Content-Type": "application/xml"}


@app.route("/robots.txt")
def robots():
    base = request.url_root.rstrip("/")
    body = f"User-agent: *\nAllow: /\nDisallow: /admin.html\nSitemap: {base}/sitemap.xml\n"
    return body, 200, {"Content-Type": "text/plain"}


@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)


# First boot on a fresh machine (e.g. a new server): create and seed
# the database automatically. Runs at import time so it also works
# when gunicorn starts the app in production.
if not DB_PATH.exists():
    import init_db
    init_db.main()

# Idempotent: creates/seeds these tables only if they're missing/empty
ensure_listings_table()
ensure_trending_table()
ensure_videos_table()
ensure_events_table()
ensure_slides_table()
ensure_users_table()
ensure_reviews_table()
ensure_tours_tables()
normalize_cities_once()
backfill_listing_media()
ensure_geo_tagging()
run_once("purge_thailand_2026_07", purge_thailand)

if __name__ == "__main__":
    # Port 5001 because macOS AirPlay already listens on 5000.
    # In production the host runs this app with gunicorn instead.
    app.run(port=int(os.environ.get("PORT", 5001)), debug=True)
