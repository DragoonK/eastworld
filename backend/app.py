"""
Eastworld blog backend.

A minimal Flask app that does two jobs:
  1. Serves the static frontend (index.html, post.html, css, js)
     from the project root, so everything runs on one server
     and there are no CORS headaches.
  2. Exposes a small JSON API for blog posts, backed by SQLite.

Run it with:  python3 app.py   then open http://localhost:5001
"""

import os
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


# ---------------------------- API ----------------------------

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
    if request.form.get("password") != ADMIN_PASSWORD:
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
    image_url = (request.form.get("image_url") or "").strip()
    file = request.files.get("image")
    if file and file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({"error": f"Image type .{ext} not allowed"}), 400
        # Timestamp prefix guarantees uniqueness; secure_filename strips
        # anything dangerous like "../" from the user's filename.
        filename = f"{int(time.time())}-{secure_filename(file.filename)}"
        file.save(UPLOADS_DIR / filename)
        image_url = f"/uploads/{filename}"

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


# ----------------------- Static frontend ----------------------

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

if __name__ == "__main__":
    # Port 5001 because macOS AirPlay already listens on 5000.
    # In production the host runs this app with gunicorn instead.
    app.run(port=int(os.environ.get("PORT", 5001)), debug=True)
