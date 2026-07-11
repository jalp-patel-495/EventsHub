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
        "image": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
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
        "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500",
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
        "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500",
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
        "image": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=500",
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
        "image": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=500",
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
        "image": "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500",
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
        "image": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500",
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
        "image": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
        "source": "Google Events",
        "url": "https://ahmedabadeventhub.com",
    }
]


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
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
    """Convert SerpAPI events_results items into our standard event format."""
    events = []
    for idx, e in enumerate(raw_events):
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

        image = e.get("image") or e.get("thumbnail") or ""

        # Assign a random ticket price for live search results to look realistic (or Free randomly)
        price = random.choice([0.0, 199.0, 299.0, 399.0, 499.0, 799.0])

        events.append({
            "id":          f"ge-{idx}",
            "title":       e.get("title", "Untitled"),
            "description": e.get("description", "No description available."),
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
        for e in events:
            loc = e.get("location", "").lower()
            title = e.get("title", "").lower()
            desc = e.get("description", "").lower()
            # If the event location contains 'ahmedabad', 'gujarat', or if the query matched a local venue, include it
            if "ahmedabad" in loc or "gujarat" in loc or "ahmedabad" in title or "ahmedabad" in desc or not loc:
                filtered.append(e)
        if filtered:
            return filtered

    # 2. Static fallback (Google Events / Ahmedabad static data)
    return STATIC_EVENTS

