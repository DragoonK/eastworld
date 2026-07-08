# Eastworld Blog Backend

A minimal Flask + SQLite backend that powers the blog posts on the homepage.

## How it works

```
Browser                      Flask server (app.py)            SQLite (blog.db)
   |                                |                                |
   |  GET /                        |                                |
   |------------------------------>|  serves index.html             |
   |  GET /api/posts               |                                |
   |------------------------------>|  SELECT ... FROM posts ------->|
   |   <- JSON list of posts       |   <- rows                      |
   |  (script.js renders cards)    |                                |
   |                                |                                |
   |  click a card -> post.html?id=3                                |
   |  GET /api/posts/3             |                                |
   |------------------------------>|  SELECT ... WHERE id=3 ------->|
   |   <- JSON with full content   |   <- row                       |
```

There are only three pieces:

1. **`blog.db`** – a SQLite database file holding one `posts` table.
2. **`init_db.py`** – creates the table and inserts the starter posts. Run it once (or again any time to reset).
3. **`app.py`** – the Flask server. It serves the frontend files *and* two JSON endpoints:
   - `GET /api/posts` – all posts (without full content) for the homepage grid
   - `GET /api/posts/<id>` – one post with full content for post.html

## Running it

First time only — create a virtual environment (an isolated Python setup for this project) and install Flask into it:

```bash
cd eastworld-v1
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
cd backend && ../.venv/bin/python init_db.py   # creates blog.db
```

Every time you want to run the site:

```bash
cd eastworld-v1/backend
../.venv/bin/python app.py
```

Then open **http://localhost:5001** — that's the whole site, frontend and API together.

## Adding a new post

Open a Python shell (or write a small script):

```python
import sqlite3
conn = sqlite3.connect("blog.db")
conn.execute(
    "INSERT INTO posts (title, category, excerpt, content, image_url) VALUES (?, ?, ?, ?, ?)",
    ("My New Post", "CULTURE", "A short teaser.", "First paragraph.\n\nSecond paragraph.", "https://example.com/image.jpg"),
)
conn.commit()
```

Refresh the homepage and the new card appears — no HTML changes needed.
