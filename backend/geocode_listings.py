"""One-off geocoder: gives every listing a lat/lng for the homepage map.

Uses OpenStreetMap's Nominatim (free, no API key), one request per
second per their usage policy. Falls back to the city centroid with a
small deterministic offset when a specific address can't be found, so
pins still land in the right city.

Writes listing_coords.json (committed to the repo). app.py reads that
file on boot and fills any listings whose lat/lng are still empty —
so production gets the coordinates without any network calls.

    python3 geocode_listings.py
"""

import hashlib
import json
import os
import sqlite3
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("DATA_DIR", BASE_DIR)) / "blog.db"
OUT_FILE = BASE_DIR / "listing_coords.json"

CITY_CENTROIDS = {
    "tokyo": (35.6762, 139.6503), "osaka": (34.6937, 135.5023),
    "kyoto": (35.0116, 135.7681), "kobe": (34.6901, 135.1955),
    "beijing": (39.9042, 116.4074), "shanghai": (31.2304, 121.4737),
    "guangzhou": (23.1291, 113.2644), "chongqing": (29.5630, 106.5516),
    "chengdu": (30.5728, 104.0668), "hong-kong": (22.3193, 114.1694),
    "hanoi": (21.0278, 105.8342), "ho-chi-minh": (10.8231, 106.6297),
    "phnom-penh": (11.5564, 104.9282), "siem-reap": (13.3671, 103.8448),
    "melbourne": (-37.8136, 144.9631), "sydney": (-33.8688, 151.2093),
    "bangkok": (13.7563, 100.5018), "seoul": (37.5665, 126.9780),
}


def geocode(query):
    url = ("https://nominatim.openstreetmap.org/search?format=json&limit=1&q="
           + urllib.parse.quote(query))
    req = urllib.request.Request(url, headers={"User-Agent": "eastworld-geocoder/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            results = json.loads(res.read())
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception as e:
        print(f"    request failed: {e}")
    return None


def centroid_fallback(city, name):
    if city not in CITY_CENTROIDS:
        return None
    lat, lng = CITY_CENTROIDS[city]
    # Deterministic small offset so pins in one city don't stack up
    digest = hashlib.md5(name.encode()).digest()
    lat += (digest[0] / 255 - 0.5) * 0.06
    lng += (digest[1] / 255 - 0.5) * 0.06
    return round(lat, 6), round(lng, 6)


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT name, city, country FROM listings WHERE type != 'product'"
    ).fetchall()
    conn.close()

    existing = {}
    if OUT_FILE.exists():
        for e in json.loads(OUT_FILE.read_text()):
            existing[(e["name"].lower(), e["city"])] = e

    results = []
    for row in rows:
        name, city, country = row["name"], row["city"] or "", row["country"]
        key = (name.lower(), city)
        if key in existing:
            results.append(existing[key])
            continue

        query = ", ".join(x.replace("-", " ") for x in [name, city, country] if x)
        print(f"Geocoding: {query}")
        coords = geocode(query)
        source = "nominatim"
        if coords is None:
            coords = centroid_fallback(city, name)
            source = "city centroid"
        time.sleep(1.1)  # Nominatim rate limit: max 1 request/second

        if coords is None:
            print(f"    skipped (no coordinates found)")
            continue
        lat, lng = coords
        results.append({"name": name, "city": city,
                        "lat": round(lat, 6), "lng": round(lng, 6)})
        print(f"    -> {lat}, {lng} ({source})")

    OUT_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\nWrote {len(results)} coordinates to {OUT_FILE.name}")


if __name__ == "__main__":
    main()
