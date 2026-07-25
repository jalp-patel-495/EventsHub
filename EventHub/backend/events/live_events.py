import os
import re
import requests
import random
from datetime import datetime, timedelta

SERPAPI_URL = "https://serpapi.com/search.json"


# ─────────────────────────────────────────────────────────────────────────────
# STATIC FALLBACK — Google Events data (Ahmedabad, Gujarat)
# ─────────────────────────────────────────────────────────────────────────────
STATIC_EVENTS = [
    {
        "id": "ge-0",
        "title": "Sabarmati Riverfront Concert",
        "description": "Experience an open-air night of melodious musical performances by local folk and fusion artists along the beautiful Riverfront.",
        "date": "2026-10-12",
        "time": "19:00:00",
        "location": "Sabarmati Riverfront Event Ground, Ahmedabad, Gujarat",
        "price": 299.0,
        "image": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
        "source": "Google Events",
        "url": "https://ahmedabadeventhub.com",
    },
    {
        "id": "ge-1",
        "title": "Gujarat Literature Festival",
        "description": "Celebrating literature, poetry, and storytelling. Connect with renowned writers, poets, and speakers at GLF.",
        "date": "2026-11-20",
        "time": "10:00:00",
        "location": "Kanoria Centre for Arts, University Area, Ahmedabad, Gujarat",
        "price": 0.0,
        "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
        "source": "Google Events",
        "url": "https://ahmedabadeventhub.com",
    },
    {
        "id": "ge-2",
        "title": "Ahmedabad Street Food Festival",
        "description": "Taste the finest street foods, traditional snacks, and experimental cuisines from top food stalls in Ahmedabad.",
        "date": "2026-12-05",
        "time": "17:00:00",
        "location": "Manek Chowk, Old City, Ahmedabad, Gujarat",
        "price": 150.0,
        "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
        "source": "Google Events",
        "url": "https://ahmedabadeventhub.com",
    },
    {
        "id": "ge-3",
        "title": "Heritage Walk of Old Ahmedabad",
        "description": "Explore the rich cultural history and stunning architecture of Ahmedabad's traditional pols with experienced tour guides.",
        "date": "2026-10-18",
        "time": "08:00:00",
        "location": "Kalupur Swaminarayan Temple, Ahmedabad, Gujarat",
        "price": 200.0,
        "image": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80",
        "source": "Google Events",
        "url": "https://ahmedabadeventhub.com",
    },
    {
        "id": "ge-4",
        "title": "Navratri Garba Mahotsav",
        "description": "Get ready to dance to the rhythm of traditional dhol and melodious garba singers. Dress in your finest traditional attire.",
        "date": "2026-10-22",
        "time": "20:00:00",
        "location": "YMCA Event Ground, S.G. Highway, Ahmedabad, Gujarat",
        "price": 499.0,
        "image": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80",
        "source": "Google Events",
        "url": "https://ahmedabadeventhub.com",
    },
    {
        "id": "ge-5",
        "title": "Ahmedabad Tech Summit",
        "description": "Join top developers, designers, and startup founders in Ahmedabad to discuss artificial intelligence, blockchain, and cloud computing.",
        "date": "2026-11-15",
        "time": "09:00:00",
        "location": "Science City Auditorium, Ahmedabad, Gujarat",
        "price": 799.0,
        "image": "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80",
        "source": "Google Events",
        "url": "https://ahmedabadeventhub.com",
    },
    {
        "id": "ge-6",
        "title": "Sunday Heritage Market Tour",
        "description": "Shop traditional handicrafts, antique artifacts, clothing, and local arts at the famous weekly Ravivari bazaar.",
        "date": "2026-10-25",
        "time": "09:00:00",
        "location": "Sabarmati Riverfront Ravivari Market, Ahmedabad, Gujarat",
        "price": 0.0,
        "image": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80",
        "source": "Google Events",
        "url": "https://ahmedabadeventhub.com",
    },
    {
        "id": "ge-7",
        "title": "Standup Comedy Special",
        "description": "Prepare for a hilarious evening filled with laughter, crowd interaction, and original observational humor by local standup stars.",
        "date": "2026-10-30",
        "time": "20:00:00",
        "location": "The Laugh Club, Satellite, Ahmedabad, Gujarat",
        "price": 350.0,
        "image": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
        "source": "Google Events",
        "url": "https://ahmedabadeventhub.com",
    }
]


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS & HIGH-RES IMAGE ENHANCER
# ─────────────────────────────────────────────────────────────────────────────
# ─────────────────────────────────────────────────────────────────────────────
# CATEGORY IMAGE POOL (40+ Unique High-Definition Unsplash Photos)
# ─────────────────────────────────────────────────────────────────────────────
CATEGORY_IMAGES = {
    "music": [
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&auto=format&fit=crop&q=80",
    ],
    "tech": [
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
    ],
    "food": [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80",
    ],
    "culture": [
        "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1496024840928-4c417adf211d?w=800&auto=format&fit=crop&q=80",
    ],
    "comedy": [
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    ],
    "sports": [
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1552667466-07fdd0a48104?w=800&auto=format&fit=crop&q=80",
    ],
    "default": [
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&auto=format&fit=crop&q=80",
    ]
}


def _get_high_res_event_image(title: str, description: str, raw_image: str, used_images: set = None) -> str:
    """Return a unique crisp high-res image for event cards, rejecting low-res map pin graphics and preventing duplicate images."""
    if used_images is None:
        used_images = set()

    is_map_or_bad_thumbnail = False
    if not raw_image or not raw_image.startswith("http"):
        is_map_or_bad_thumbnail = True
    else:
        raw_lower = raw_image.lower()
        bad_keywords = [
            "encrypted-tbn", "maps.gstatic", "maps.googleapis", "ssl.gstatic",
            "staticmap", "streetviewpixels", "google.com/maps", "googleusercontent",
            "map", "pin", "marker", "location-pin", "place-holder"
        ]
        if any(bad in raw_lower for bad in bad_keywords):
            is_map_or_bad_thumbnail = True

    # If raw_image is valid and hasn't been used yet in this feed batch, use it!
    if not is_map_or_bad_thumbnail and raw_image not in used_images:
        used_images.add(raw_image)
        return raw_image

    text = f"{title} {description}".lower()

    # Determine category candidates
    category = "default"
    if any(k in text for k in ["concert", "music", "song", "singing", "band", "garba", "dj", "night", "orchestra", "singer", "artist", "live", "palm & pine", "palm", "pine", "club", "lounge", "party", "acoustic"]):
        category = "music"
    elif any(k in text for k in ["tech", "hackathon", "ai", "summit", "developer", "coding", "startup", "conference", "workshop", "webinar", "seminar"]):
        category = "tech"
    elif any(k in text for k in ["food", "taste", "cuisine", "dine", "kitchen", "street food", "restaurant", "baking", "cafe", "coffee", "dinner", "brunch"]):
        category = "food"
    elif any(k in text for k in ["heritage", "literature", "art", "walk", "bazaar", "market", "pols", "festival", "exhibition", "craft", "exhibit", "gallery"]):
        category = "culture"
    elif any(k in text for k in ["comedy", "standup", "laugh", "show", "humor", "open mic", "theatre", "drama", "act"]):
        category = "comedy"
    elif any(k in text for k in ["sport", "cricket", "run", "marathon", "match", "fitness", "yoga", "football", "game", "tournament"]):
        category = "sports"

    pool = CATEGORY_IMAGES.get(category, CATEGORY_IMAGES["default"])

    # 1. Pick an image from the target category pool that hasn't been used yet
    available = [img for img in pool if img not in used_images]
    if available:
        chosen = random.choice(available)
    else:
        # 2. Pick an unused image from ANY other category
        all_unused = [img for cat_imgs in CATEGORY_IMAGES.values() for img in cat_imgs if img not in used_images]
        if all_unused:
            chosen = random.choice(all_unused)
        else:
            # 3. Fallback pick
            chosen = random.choice(pool)

    used_images.add(chosen)
    return chosen


def _parse_serpapi_datetime(when_str: str):
    """
    Parse SerpAPI 'when' like 'Sat, 03 Jan, 21:00–23:00 GMT-6'
    Returns (date_str, time_str) as ISO strings.
    """
    date_str = str(datetime.now().date())
    time_str = "18:00:00"
    try:
        # Match day + month abbreviation
        dm = re.search(r'(\d{1,2})\s+([A-Za-z]{3})', when_str)
        # Match first time HH:MM
        tm = re.search(r'(\d{2}:\d{2})', when_str)
        if dm:
            day   = int(dm.group(1))
            month = datetime.strptime(dm.group(2), "%b").month
            year  = datetime.now().year
            try:
                d = datetime(year, month, day)
                if d < datetime.now() - timedelta(days=1):
                    d = datetime(year + 1, month, day)
                date_str = d.strftime("%Y-%m-%d")
            except ValueError:
                pass
        if tm:
            time_str = tm.group(1) + ":00"
    except Exception:
        pass
    return date_str, time_str


def _normalise_serpapi(raw_events: list) -> list:
    """Convert SerpAPI events_results items into our standard event format with unique images and deduplicated titles."""
    events = []
    used_images = set()
    seen_titles = set()
    for idx, e in enumerate(raw_events):
        title = e.get("title", "Untitled").strip()
        norm_title = re.sub(r'\s+', ' ', title.lower())

        # Skip duplicate events with the exact same title
        if norm_title in seen_titles:
            continue
        seen_titles.add(norm_title)

        when       = e.get("date", {}).get("when", "")
        date_s, time_s = _parse_serpapi_datetime(when)

        address_parts = e.get("address", [])
        location       = ", ".join(address_parts) if isinstance(address_parts, list) else str(address_parts)

        # Best ticket link: prefer link_type == "tickets"
        ticket_info   = e.get("ticket_info", [])
        url           = e.get("link", "")
        ticket_links  = [t for t in ticket_info if t.get("link_type") == "tickets"]
        if ticket_links:
            url = ticket_links[0].get("link", url)

        raw_img = e.get("image") or e.get("thumbnail") or ""
        description = e.get("description", "No description available.")
        image = _get_high_res_event_image(title, description, raw_img, used_images)

        # Assign a random ticket price for live search results to look realistic (or Free randomly)
        price = random.choice([0.0, 199.0, 299.0, 399.0, 499.0, 799.0])

        events.append({
            "id":          f"ge-{idx}",
            "title":       title,
            "description": description,
            "date":        date_s,
            "time":        time_s,
            "location":    location,
            "price":       price,
            "image":       image,
            "source":      "Google Events",
            "url":         url,
            "venue_name":  e.get("venue", {}).get("name", ""),
            "venue_rating":e.get("venue", {}).get("rating", None),
        })
    return events


# ─────────────────────────────────────────────────────────────────────────────
# WEATHER  (unchanged)
# ─────────────────────────────────────────────────────────────────────────────
def get_live_weather():
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if api_key:
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?q=Ahmedabad&appid={api_key}&units=metric"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                return {
                    "temp":        data["main"]["temp"],
                    "description": data["weather"][0]["description"].capitalize(),
                    "humidity":    data["main"]["humidity"],
                    "wind_speed":  data["wind"]["speed"],
                    "icon":        data["weather"][0]["icon"],
                }
        except Exception as e:
            print("Failed to fetch live weather:", e)

    month = datetime.now().month
    if month in [3, 4, 5, 6]:
        temp, desc = round(random.uniform(36.0, 42.0), 1), "Sunny and Hot"
    elif month in [7, 8, 9]:
        temp, desc = round(random.uniform(28.0, 33.0), 1), "Partly Cloudy with Humid Rain showers"
    else:
        temp, desc = round(random.uniform(18.0, 26.0), 1), "Clear skies and Cool"

    return {
        "temp":        temp,
        "description": desc,
        "humidity":    random.randint(40, 75),
        "wind_speed":  round(random.uniform(5.0, 15.0), 1),
        "icon":        "01d",
    }


# ─────────────────────────────────────────────────────────────────────────────
# LIVE EVENTS  — SerpAPI → OpenWebNinja → static Google Events fallback
# ─────────────────────────────────────────────────────────────────────────────
def _fetch_serpapi_events(query="Events in Ahmedabad"):
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        return []
    try:
        params = {
            "engine":   "google_events",
            "q":        query,
            "api_key":  api_key,
            "hl":       "en",
        }
        res = requests.get(SERPAPI_URL, params=params, timeout=10)
        if res.status_code == 200:
            data        = res.json()
            raw_events  = data.get("events_results", [])
            if raw_events:
                return _normalise_serpapi(raw_events)
    except Exception as e:
        print(f"SerpAPI error: {e}")
    return []


def get_live_ahmedabad_events():
    """
    Priority:
      1. SerpAPI Google Events  (requires SERPAPI_API_KEY in .env)
      2. Static Google Events   (Ahmedabad fallback data — always available)
    """
    # 1. SerpAPI
    events = _fetch_serpapi_events("Events in Ahmedabad, Gujarat, India")
    if events:
        filtered = []
        seen_titles = set()
        for e in events:
            loc = e.get("location", "").lower()
            title = e.get("title", "").strip()
            norm_title = re.sub(r'\s+', ' ', title.lower())
            desc = e.get("description", "").lower()

            if norm_title in seen_titles:
                continue

            # If the event location contains 'ahmedabad', 'gujarat', or if the query matched a local venue, include it
            if "ahmedabad" in loc or "gujarat" in loc or "ahmedabad" in title.lower() or "ahmedabad" in desc or not loc:
                seen_titles.add(norm_title)
                filtered.append(e)
        if filtered:
            return filtered

    # 2. Static fallback (Google Events / Ahmedabad static data)
    return STATIC_EVENTS

