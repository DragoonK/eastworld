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
    {
        "title": "The Bánh Mì Trail: Saigon's Perfect Sandwich",
        "category": "FOOD",
        "excerpt": "Ho Chi Minh City's street corners hide the world's best baguette. We followed the trail.",
        "image_url": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "The bánh mì is a masterpiece of culinary history: a French baguette, colonized by "
            "Vietnamese flavor. Pâté, pickled daikon, cilantro, chili — every vendor in Ho Chi Minh "
            "City has their own ratio, and locals defend their favorite stand like a football team.\n\n"
            "We spent three days following recommendations from taxi drivers, market vendors, and "
            "one very opinionated hotel concierge.\n\n"
            "The verdict: skip the famous spots with tour-bus queues. The best sandwich we found came "
            "from a cart with no name, two plastic stools, and a line of motorbike drivers at 6 AM."
        ),
    },
    {
        "title": "Inside Japan's Capsule Hotel Renaissance",
        "category": "STAYS",
        "excerpt": "Once a salaryman's last resort, the capsule hotel has become a design destination.",
        "image_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "The capsule hotel was invented in Osaka in 1979 as cheap crash space for salarymen who "
            "missed the last train. For decades it carried that reputation: functional, anonymous, "
            "slightly sad.\n\n"
            "A new generation of properties has flipped the concept. Capsules now come with cedar "
            "interiors, planetarium ceilings, and libraries curated by famous booksellers.\n\n"
            "The appeal is the same minimalism that draws travelers to ryokan — just compressed into "
            "two cubic meters and priced under 5,000 yen."
        ),
    },
    {
        "title": "M50: Shanghai's Contemporary Art Machine",
        "category": "CULTURE",
        "excerpt": "A former textile mill on Suzhou Creek is now China's most exciting gallery district.",
        "image_url": "https://images.unsplash.com/photo-1535139262971-c51845709a48?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "M50 doesn't look like an art district from the street: a cluster of brick factory "
            "buildings along Suzhou Creek, still marked with faded industrial signage.\n\n"
            "Inside are more than a hundred galleries and studios, from established names to art "
            "school graduates renting a single white room.\n\n"
            "Unlike Beijing's 798, M50 has kept its working studios. Visit on a weekday and you'll "
            "see canvases in progress, not just finished shows."
        ),
    },
    {
        "title": "Angkor After Hours: Siem Reap Beyond the Temples",
        "category": "TRAVEL",
        "excerpt": "What to do when the temple gates close — Cambodia's coolest small city comes alive at night.",
        "image_url": "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "Most visitors treat Siem Reap as a base camp: wake at 4 AM for sunrise at Angkor Wat, "
            "nap through the afternoon, repeat.\n\n"
            "They're missing the second act. After the temple gates close, the city turns on: "
            "night markets along the river, craft cocktail bars in restored shophouses, and a "
            "contemporary Khmer dining scene led by chefs returning from abroad.\n\n"
            "Our advice: give it three nights minimum. The temples earned their fame, but the city "
            "is the surprise."
        ),
    },
    {
        "title": "Okayama Denim: Why Japan Makes the World's Best Jeans",
        "category": "FASHION",
        "excerpt": "In a quiet corner of western Japan, vintage looms weave denim that sells for $400 a pair.",
        "image_url": "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "The Kojima district of Okayama produces denim on vintage shuttle looms that American "
            "mills scrapped in the 1980s. The fabric comes out narrower, slower, and slightly "
            "irregular — which is exactly the point.\n\n"
            "Selvedge denim from Kojima develops fades that mass-produced fabric can't replicate, "
            "and collectors treat raw pairs like wine to be aged.\n\n"
            "The district's Jeans Street has become a pilgrimage site, with two dozen boutiques and "
            "a denim-blue bridge to greet arrivals."
        ),
    },
    {
        "title": "Hanoi's Egg Coffee and the Cafés That Time Forgot",
        "category": "FOOD",
        "excerpt": "Vietnam's capital serves its coffee whipped with egg yolk, in cafés unchanged since the 1950s.",
        "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "Cà phê trứng — egg coffee — was invented in Hanoi in 1946, when milk was scarce and a "
            "resourceful bartender whipped egg yolk with sugar instead.\n\n"
            "The result tastes like liquid tiramisu, and the cafés that serve it are attractions in "
            "themselves: hidden up staircases, furnished with tiny stools, walls yellowed by decades "
            "of cigarette smoke and conversation.\n\n"
            "Giảng Café, run by the inventor's son, still makes it the original way. Go early; the "
            "secret has been out for years."
        ),
    },
    {
        "title": "Shibuya's New Skyline: Tokyo Builds Upward",
        "category": "PLACES",
        "excerpt": "A decade of construction has transformed Tokyo's most famous crossing district.",
        "image_url": "https://images.unsplash.com/photo-1533050487297-09b450131914?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "The Shibuya scramble crossing is still there, still chaotic, still photographed ten "
            "thousand times a day. Everything around it has changed.\n\n"
            "A decade-long redevelopment has added a cluster of towers — Shibuya Sky's open-air roof "
            "at 229 meters is now the city's best viewpoint, dethroning older observation decks.\n\n"
            "The neighborhood's back streets survived the construction, and the contrast is the "
            "attraction: izakaya alleys from 1950 in the shadow of glass megatowers."
        ),
    },
    {
        "title": "The Great Firewall of Flavor: Chengdu vs. Chongqing Hotpot",
        "category": "FOOD",
        "excerpt": "China's two spice capitals have a rivalry hotter than their broth.",
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "Ask anyone in Chengdu about Chongqing hotpot and you'll get a diplomatic smile. Ask in "
            "Chongqing about Chengdu's version and you'll get a laugh.\n\n"
            "The technical difference: Chongqing uses beef tallow and pure heat; Chengdu adds "
            "rapeseed oil and a gentler, numbing complexity. The cultural difference is bigger — "
            "each city considers its broth a statement of identity.\n\n"
            "Our take after a week of research: eat both, in both cities, and never tell either "
            "side what you preferred."
        ),
    },
    {
        "title": "Kyoto's Machiya Revival: Sleeping in a Merchant's House",
        "category": "STAYS",
        "excerpt": "Hundreds of Kyoto's wooden townhouses are being rescued and reborn as boutique stays.",
        "image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "Kyoto was losing its machiya — the narrow wooden merchant houses that line its older "
            "streets — at a rate of two per day, demolished for parking lots and apartment blocks.\n\n"
            "A preservation movement has turned the tide by making the houses pay for themselves: "
            "restored machiya now operate as one-group-per-night rentals, with cedar baths, interior "
            "gardens, and tatami rooms lit by paper lanterns.\n\n"
            "They cost less than a mid-range hotel room in high season, and there is no closer way "
            "to sleep to the city's past."
        ),
    },
    {
        "title": "Tokyo's Listening Bars: Where Vinyl Is the Main Event",
        "category": "MUSIC",
        "excerpt": "No talking during the A-side: inside the city's obsessive hi-fi bar culture.",
        "image_url": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80",
        "content": (
            "The Tokyo listening bar — jazz kissa in its original form — is built around a simple "
            "contract: the records are the point. You come to hear a $50,000 sound system play an "
            "original pressing, and conversation stays at a murmur.\n\n"
            "The format dates to the 1950s, when records were too expensive to own and cafés "
            "functioned as public libraries of jazz.\n\n"
            "Today's generation mixes formats — ambient nights, city pop revivals, whisky pairings — "
            "but the etiquette survives. When the needle drops, you listen."
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
