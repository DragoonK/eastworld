"""
Creates the SQLite database (blog.db) and fills it with the
Eastworld blog posts. Run once before starting the server,
or re-run any time to reset the data:

    python3 init_db.py
"""

import os
import sqlite3
from pathlib import Path

# Matches app.py: DATA_DIR env var in production, backend folder locally
DB_PATH = Path(os.environ.get("DATA_DIR", Path(__file__).resolve().parent)) / "blog.db"

SCHEMA = """
DROP TABLE IF EXISTS posts;

CREATE TABLE posts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    category   TEXT NOT NULL,
    excerpt    TEXT NOT NULL,          -- short teaser for the homepage card
    content    TEXT NOT NULL,          -- full article, blank lines = paragraphs
    image_url  TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""

POSTS = [
    {
        "title": "The Rise of HoYeon Jung",
        "category": "CULTURE",
        "excerpt": "We examine the rise of the Korean star, HoYeon Jung.",
        "image_url": "https://www.hola.com/horizon/landscape/806bdb3b7954-hoyeon-jung-met-t.jpg?im=Resize=(960),type=downsize",
        "content": (
            "In just a few short years, HoYeon Jung has transformed from a rising model to one of "
            "South Korea's most recognizable global stars. Her meteoric rise represents the growing "
            "international influence of Korean talent across multiple entertainment sectors.\n\n"
            "Born in Seoul in 1994, Jung began her career as a model at the age of 16. Her distinctive "
            "look and powerful runway presence quickly caught attention in the fashion world. She became "
            "a finalist on Korea's Next Top Model in 2013, which significantly raised her profile in the "
            "domestic fashion scene.\n\n"
            "Her life transformed dramatically in 2021 when she was cast in Netflix's global phenomenon "
            "Squid Game as Kang Sae-byeok. Despite having no prior acting experience, Jung delivered a "
            "performance that resonated with viewers worldwide for its emotional depth and authenticity.\n\n"
            "Her performance earned her the Screen Actors Guild Award for Outstanding Performance by a "
            "Female Actor in a Drama Series, making her the first Korean actress to win an individual SAG "
            "award. As she continues to develop as both an actress and model, HoYeon Jung stands as a "
            "symbol of Korean entertainment's increasingly borderless appeal."
        ),
    },
    {
        "title": "Seoul's New Wave of Modern Korean Cuisine",
        "category": "FOOD",
        "excerpt": "Young chefs are revolutionizing traditional Korean dishes with innovative techniques.",
        "image_url": "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "A new generation of chefs in Seoul is rewriting the rules of Korean cuisine, applying "
            "modern techniques to dishes that have been prepared the same way for centuries.\n\n"
            "From fine-dining reinterpretations of jang-based sauces to fermented flavors appearing in "
            "unexpected desserts, the city's restaurant scene has never been more adventurous. Several of "
            "these young kitchens have already earned Michelin recognition.\n\n"
            "What sets this movement apart is its respect for tradition. Rather than replacing classic "
            "recipes, these chefs study them deeply, then ask how modern tools and global influences can "
            "make the flavors even more expressive."
        ),
    },
    {
        "title": "Asian Cinema's Global Impact Continues to Grow",
        "category": "CINEMA",
        "excerpt": "From Korea to Thailand, Asian filmmakers are reshaping global entertainment.",
        "image_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "The influence of Asian cinema on global entertainment keeps accelerating. Korean thrillers, "
            "Japanese animation, and a rising wave of Thai and Taiwanese independent films are winning "
            "audiences and awards far beyond their home markets.\n\n"
            "Streaming platforms have played a huge role, giving international viewers instant access to "
            "films that once required festival screenings or import DVDs to see.\n\n"
            "Critics point to a simple reason for the success: these films take creative risks. Genre "
            "boundaries are treated as suggestions, and emotional honesty is prized over formula."
        ),
    },
    {
        "title": "K-pop's Evolution: Beyond the Boy Band Era",
        "category": "MUSIC",
        "excerpt": "New genres and independent artists are diversifying Korea's music scene.",
        "image_url": "https://contents.oricon.co.jp/upimg/news/2371000/2370359/20250221_154226_p_o_83372072.jpg",
        "content": (
            "K-pop is no longer defined solely by its polished idol groups. A thriving independent scene "
            "spanning R&B, hip-hop, indie rock, and electronic music is broadening what Korean pop music "
            "means to the world.\n\n"
            "Independent labels and self-producing artists are finding audiences directly through "
            "streaming and social platforms, bypassing the traditional agency system entirely.\n\n"
            "The result is a richer, more varied musical landscape where experimental artists and "
            "mainstream idols push each other creatively."
        ),
    },
    {
        "title": "Tokyo's Sakura Season Draws Record Crowds",
        "category": "FESTIVALS",
        "excerpt": "Cherry blossom viewings this year combine tradition with innovative light shows.",
        "image_url": "https://blog.sakura.co/wp-content/uploads/2021/08/shutterstock_776445706-1.jpg",
        "content": (
            "Tokyo's cherry blossom season drew record crowds this year, as the city's parks paired the "
            "centuries-old tradition of hanami with projection-mapped light shows and nighttime "
            "illuminations.\n\n"
            "Ueno Park and the Meguro River remained the most popular spots, with visitors arriving "
            "before dawn to claim picnic spaces under the blooming trees.\n\n"
            "City officials estimate blossom-season tourism brought in billions of yen, and next year's "
            "events are already being planned on an even larger scale."
        ),
    },
    {
        "title": "Ichiran: Perfecting the Solo Ramen Experience",
        "category": "FOOD",
        "excerpt": "How the Japanese chain revolutionized the solitary dining experience.",
        "image_url": "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "Ichiran built an empire on a simple insight: sometimes people want to eat ramen alone, with "
            "zero distractions. Its famous solo booths, where diners face a curtained window and order by "
            "paper form, turn a bowl of tonkotsu ramen into a private ritual.\n\n"
            "The concept, called 'flavor concentration seating', was designed so nothing competes with "
            "the food for your attention. Even the servers remain unseen behind the curtain.\n\n"
            "What began in Fukuoka in 1960 now spans locations across Japan and internationally, and the "
            "solo-dining format it pioneered has influenced restaurants worldwide."
        ),
    },
    {
        "title": "Inside Bangkok's Booming Specialty Coffee Scene",
        "category": "FOOD",
        "excerpt": "Thai-grown beans and third-wave cafes are turning Bangkok into Asia's next coffee capital.",
        "image_url": "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "Bangkok's coffee culture has exploded over the past five years. What was once a city of "
            "instant coffee and condensed milk is now home to hundreds of specialty cafes, many roasting "
            "beans grown in Thailand's own northern highlands.\n\n"
            "Farms around Chiang Rai and Chiang Mai are producing arabica that competes with beans from "
            "Ethiopia and Colombia, and Bangkok's baristas are winning international competitions with "
            "them.\n\n"
            "The scene's signature is its playfulness: espresso tonics with local citrus, coconut-based "
            "flat whites, and cafes designed like art galleries."
        ),
    },
    {
        "title": "The Quiet Luxury of Japanese Ryokan Stays",
        "category": "STAYS",
        "excerpt": "Traditional inns are winning over travelers who want calm instead of five-star flash.",
        "image_url": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "While luxury hotel chains race to add rooftop bars and infinity pools, Japan's ryokan are "
            "attracting travelers with the opposite: silence, simplicity, and ritual.\n\n"
            "A stay typically includes tatami rooms, onsen bathing, and kaiseki dinners served in-room, "
            "with every course timed to the season.\n\n"
            "Bookings from overseas guests have doubled since 2023, and many historic inns now sell out "
            "months ahead. The appeal is exactly what they haven't changed in three hundred years."
        ),
    },
    {
        "title": "Cyberpunk Chongqing: China's Most Cinematic City",
        "category": "TRAVEL",
        "excerpt": "The mountain megacity's stacked highways and neon fog have made it a social media star.",
        "image_url": "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "Chongqing doesn't look real. Monorails pass through apartment buildings, highways stack "
            "five layers deep on mountainsides, and fog rolls between skyscrapers lit up like circuit "
            "boards.\n\n"
            "The city has become China's unofficial cyberpunk capital, drawing photographers and "
            "filmmakers from around the world.\n\n"
            "Beyond the visuals, Chongqing offers the country's most fiery cuisine: its hotpot, loaded "
            "with Sichuan peppercorns, is a rite of passage."
        ),
    },
    {
        "title": "Seoul Fashion Week Redefines Streetwear",
        "category": "FASHION",
        "excerpt": "Korean designers are exporting a new silhouette to the world's wardrobes.",
        "image_url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "Seoul Fashion Week has grown from a regional showcase into one of the most-watched events "
            "on the global fashion calendar, and its influence is most visible on the street.\n\n"
            "The Korean look—oversized tailoring, layered neutrals, and technical fabrics—now shapes "
            "streetwear from Tokyo to Los Angeles.\n\n"
            "Young labels are using the momentum of K-pop and K-drama to reach customers directly, "
            "skipping the traditional wholesale system entirely."
        ),
    },
    {
        "title": "Melbourne's Laneway Food Revolution",
        "category": "FOOD",
        "excerpt": "Hidden alleys hide some of the southern hemisphere's most exciting kitchens.",
        "image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "Melbourne's graffiti-covered laneways have long been famous for coffee, but a new "
            "generation of chefs has turned them into a dining destination.\n\n"
            "Tiny rooms seating twenty people serve everything from modern Cantonese to native "
            "Australian ingredients cooked over open fire.\n\n"
            "The city's dining scene thrives on this intimacy: no signage, no reservations, and menus "
            "that change nightly based on the morning's market."
        ),
    },
]


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    conn.executemany(
        "INSERT INTO posts (title, category, excerpt, content, image_url)"
        " VALUES (:title, :category, :excerpt, :content, :image_url)",
        POSTS,
    )
    conn.commit()
    conn.close()
    print(f"Created {DB_PATH.name} with {len(POSTS)} posts.")


if __name__ == "__main__":
    main()
