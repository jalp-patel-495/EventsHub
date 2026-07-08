import os
import re
import requests
import random
from datetime import datetime, timedelta

SERPAPI_URL = "https://serpapi.com/search.json"


# ─────────────────────────────────────────────────────────────────────────────
# STATIC FALLBACK — Google Events data (Austin, TX)
# ─────────────────────────────────────────────────────────────────────────────
STATIC_EVENTS = [
    {
        "id": "ge-0",
        "title": "GRYFFIN with AVELLO at The Concourse Project",
        "description": "RealMusic Events presents GRYFFIN with support AVELLO at The Concourse Project, 8509 Burleson Rd, Building 1, Austin TX 78719. 18+ Welcome // 9pm – 2am.",
        "date": "2026-01-03",
        "time": "21:00:00",
        "location": "The Concourse Project, 8509 Burleson Rd, Austin, TX",
        "price": 0.0,
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT14azEw3S0tVtaKriaW2RmTmf-FRQCffR-4ca_VFto67yBhr9KDzu7-Sl8FA&s=10",
        "source": "Google Events",
        "url": "https://www.statesman.com/austin360/things-to-do/?_evDiscoveryPath=/event/1037031425n-avello",
    },
    {
        "id": "ge-1",
        "title": "Uncle Lucius",
        "description": "Find tickets for Uncle Lucius at Continental Club in Austin on 1/3/2026 at 10:00 PM.",
        "date": "2026-01-03",
        "time": "22:00:00",
        "location": "The Continental Club, 1315 S Congress Ave, Austin, TX",
        "price": 0.0,
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNDPwtxAnRgduzx50pyKkZTFyXDAyFTP-U17axt9YS_vnIgo999ZtsWz9CDg&s=10",
        "source": "Google Events",
        "url": "https://open.spotify.com/concert/6uNkwReVL14c1xaswptKcE",
    },
    {
        "id": "ge-2",
        "title": "Jesse Royal Concert – Austin Reggae Festival",
        "description": "The Austin reggae community converged for the first time on May 7th 1994, at Auditorium Shores to pay tribute to the late great Bob Marley.",
        "date": "2026-04-16",
        "time": "19:00:00",
        "location": "Auditorium Shores at Town Lake Metropolitan Park, 900 W Riverside Dr, Austin, TX",
        "price": 0.0,
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwkYbJEGGohXmDqcvPDHsG8SlDbRVf9Id8stXwZuBR1g&s=10",
        "source": "Google Events",
        "url": "https://www.austintexas.org/event/austin-reggae-festival/383745/",
    },
    {
        "id": "ge-3",
        "title": "Cosmic Gate (18+ Event)",
        "description": "Find tickets for Cosmic Gate at The Concourse Project in Austin on 1/10/2026 at 10:00 PM.",
        "date": "2026-01-10",
        "time": "22:00:00",
        "location": "The Concourse Project, 8509 Burleson Rd, Austin, TX",
        "price": 0.0,
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYFR7InaVHgWwFcdSsF8ouTO8H0HXbPeZesnHylfhPgy9ccV7EZIdZbEZqLg&s=10",
        "source": "Google Events",
        "url": "https://open.spotify.com/concert/7rTcqPeHhrBktcOJN0b4KR",
    },
    {
        "id": "ge-4",
        "title": "Boogie T",
        "description": "Born and raised in Louisiana, Brock Thornton aka Boogie T, has risen from the bayou to bring the low end.",
        "date": "2026-01-23",
        "time": "21:00:00",
        "location": "The Concourse Project, 8509 Burleson Rd, Austin, TX",
        "price": 0.0,
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3oZqrw5Ex6hLdbgiuWUkll8oXGfYBpUpSp8VnAU1uCLGzEVkBFpPU9raWVA&s=10",
        "source": "Google Events",
        "url": "https://www.statesman.com/austin360/things-to-do/?_evDiscoveryPath=/event/1182323s-boogie-t-18-event-",
    },
    {
        "id": "ge-5",
        "title": "Free Week: Candy Riot, Cloud Companion, Alma Muñeca, Almost Heaven",
        "description": "A Beloved Austin Music Tradition. Founded in 2003 at Emo's, Free Week was created to keep clubs' lights on and staff working.",
        "date": "2026-01-10",
        "time": "21:00:00",
        "location": "Stubb's Bar-B-Q, 801 Red River St, Austin, TX",
        "price": 0.0,
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBPCtdwvDq6f0e_MTygHeS95i522Aoqcpt1zwxJTo2yPSBI5wkaw8BP5a27w&s=10",
        "source": "Google Events",
        "url": "https://do512.com/events/2026/1/10/free-week-w-candy-riot-cloud-companion-alma-muneca-almost-heaven-tickets",
    },
    {
        "id": "ge-6",
        "title": "Jai Wolf",
        "description": "Find tickets for Jai Wolf at Kingdom Nightclub in Austin on 1/17/2026 at 10:00 PM.",
        "date": "2026-01-17",
        "time": "22:00:00",
        "location": "Kingdom, 505 E 7th St, Austin, TX",
        "price": 0.0,
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv0sIWQv64Wwm2iuT9q6aF_0y38804ZbjV-MOtDiao7rJpwS4Pr8l20G1cgA&s=10",
        "source": "Google Events",
        "url": "https://open.spotify.com/concert/141kJmhifkOlqCbYq81jiu",
    },
    {
        "id": "ge-7",
        "title": "Eddie Izzard",
        "description": "Find tickets for Eddie Izzard at State Theatre in Austin on 2/7/2026 at 2:00 PM.",
        "date": "2026-02-07",
        "time": "14:00:00",
        "location": "State Theatre, 719 Congress Ave., Austin, TX",
        "price": 0.0,
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNQjbOBqtaBGQ4Pp6IVpEC9HKVcAkFigBoGAcONE-5RE2pJrt6qmPslai7wew&s=10",
        "source": "Google Events",
        "url": "https://open.spotify.com/concert/1N3swjR5j4OVb0whI5rAVw",
    },
    {
        "id": "ge-8",
        "title": "Itzhak Perlman @ Dell Hall, Long Center",
        "description": "No violinist more beautifully captures and conveys the joy of music than Itzhak Perlman, the undeniable reigning virtuoso of violin.",
        "date": "2026-03-22",
        "time": "14:00:00",
        "location": "The Long Center for the Performing Arts, 701 W Riverside Dr, Austin, TX",
        "price": 0.0,
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd248bQRI9VdTdvwBzcVWz1BrcEzkfXTtbf8qhkstcrQ&s=10",
        "source": "Google Events",
        "url": "https://www.austintexas.org/event/itzhak-perlman-in-recital/390166/",
    },
    {
        "id": "ge-9",
        "title": "St. Louis City SC at Austin FC",
        "description": "Attend the Austin FC vs. St. Louis City SC event in Austin, TX at the Q2 Stadium. The event starts at 4:30 PM on Sunday, May 3, 2026.",
        "date": "2026-05-03",
        "time": "16:30:00",
        "location": "Q2 Stadium, 10414 McKalla Pl, Austin, TX",
        "price": 0.0,
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVQRzeGHYF5ADgoFuslgXuuZpMpUiwmjzzpib2VSZnaQ&s=10",
        "source": "Google Events",
        "url": "https://www.ticketmaster.com/event/Z7r9jZ1A7roZU",
    },
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

        events.append({
            "id":          f"ge-{idx}",
            "title":       e.get("title", "Untitled"),
            "description": e.get("description", "No description available."),
            "date":        date_s,
            "time":        time_s,
            "location":    location,
            "price":       0.0,
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
      2. Static Google Events   (Austin TX data — always available)
    """
    # 1. SerpAPI
    events = _fetch_serpapi_events("Ahmedabad")
    if events:
        return events

    # 2. Static fallback (Google Events / Austin data)
    return STATIC_EVENTS

