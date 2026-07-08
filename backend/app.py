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

from flask import Flask, jsonify, request, send_from_directory
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

    conn = get_db()
    rows = conn.execute(
        "SELECT id, title, category, excerpt, image_url, created_at"
        " FROM posts ORDER BY created_at DESC, id DESC"
        " LIMIT ? OFFSET ?",
        (limit, offset),
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
        "INSERT INTO posts (title, category, excerpt, content, image_url)"
        " VALUES (?, ?, ?, ?, ?)",
        (title, category, excerpt, content, image_url),
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

    conn.execute(
        "UPDATE posts SET title=?, category=?, excerpt=?, content=?, image_url=?"
        " WHERE id=?",
        (title, category, excerpt, content, image_url, post_id),
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
    conn = get_db()
    rows = conn.execute(
        "SELECT id, title, youtube_id, position FROM videos"
        " ORDER BY position, id LIMIT ?",
        (limit,),
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
        "INSERT INTO videos (title, youtube_id, position) VALUES (?, ?, ?)",
        (title, youtube_id, next_pos),
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
        "UPDATE videos SET title = ?, youtube_id = ? WHERE id = ?",
        (title, youtube_id, video_id),
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


@app.route("/sitemap.xml")
def sitemap():
    """Every page on the site, for search engines."""
    base = request.url_root.rstrip("/")
    urls = [f"{base}/"] + [
        f"{base}/{page}" for page in
        ["food.html", "stays.html", "places.html", "products.html", "cities.html"]
    ]

    conn = get_db()
    urls += [f"{base}/post.html?id={r['id']}"
             for r in conn.execute("SELECT id FROM posts ORDER BY id")]
    urls += [f"{base}/listing.html?id={r['id']}"
             for r in conn.execute("SELECT id FROM listings ORDER BY id")]
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
normalize_cities_once()
backfill_listing_media()
run_once("purge_thailand_2026_07", purge_thailand)

if __name__ == "__main__":
    # Port 5001 because macOS AirPlay already listens on 5000.
    # In production the host runs this app with gunicorn instead.
    app.run(port=int(os.environ.get("PORT", 5001)), debug=True)
