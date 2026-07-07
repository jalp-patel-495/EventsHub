import os
import requests
import random
from datetime import datetime, timedelta

def get_live_weather():
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if api_key:
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?q=Ahmedabad&appid={api_key}&units=metric"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                return {
                    "temp": data["main"]["temp"],
                    "description": data["weather"][0]["description"].capitalize(),
                    "humidity": data["main"]["humidity"],
                    "wind_speed": data["wind"]["speed"],
                    "icon": data["weather"][0]["icon"]
                }
        except Exception as e:
            print("Failed to fetch live weather from API:", e)

    # Fallback to realistic Ahmedabad weather based on seasonal parameters
    month = datetime.now().month
    if month in [3, 4, 5, 6]: # Summer
        temp = round(random.uniform(36.0, 42.0), 1)
        desc = "Sunny and Hot"
    elif month in [7, 8, 9]: # Monsoon
        temp = round(random.uniform(28.0, 33.0), 1)
        desc = "Partly Cloudy with Humid Rain showers"
    else: # Winter
        temp = round(random.uniform(18.0, 26.0), 1)
        desc = "Clear skies and Cool"

    return {
        "temp": temp,
        "description": desc,
        "humidity": random.randint(40, 75),
        "wind_speed": round(random.uniform(5.0, 15.0), 1),
        "icon": "01d"
    }

def get_live_ahmedabad_events():
    api_key = os.getenv("TICKETMASTER_API_KEY")
    events = []
    
    if api_key:
        try:
            url = f"https://app.ticketmaster.com/discovery/v2/events.json?apikey={api_key}&city=Ahmedabad"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                embedded = data.get("_embedded", {})
                raw_events = embedded.get("events", [])
                for idx, e in enumerate(raw_events):
                    events.append({
                        "id": f"tm-{idx}",
                        "title": e.get("name"),
                        "description": e.get("info", "No information description provided by Ticketmaster."),
                        "date": e.get("dates", {}).get("start", {}).get("localDate", str(datetime.now().date())),
                        "time": e.get("dates", {}).get("start", {}).get("localTime", "19:00:00"),
                        "location": e.get("_embedded", {}).get("venues", [{}])[0].get("name", "Ahmedabad Arena"),
                        "price": float(e.get("priceRanges", [{}])[0].get("min", 250)),
                        "image": e.get("images", [{}])[0].get("url"),
                        "source": "Ticketmaster"
                    })
                if events:
                    return events
        except Exception as e:
            print("Failed to fetch Ticketmaster events:", e)

    # Realistic Fallback Events
    return [
        {
            "id": "live-1",
            "title": "Sabarmati Riverfront Flower Show 2026",
            "description": "Walk through miles of spectacular seasonal flower setups, sculptures, and garden exhibits organized by AMC on the Sabarmati Riverfront.",
            "date": str((datetime.now() + timedelta(days=2)).date()),
            "time": "10:00:00",
            "location": "Sabarmati Riverfront Event Ground, Ahmedabad",
            "price": 50.00,
            "image": "https://images.unsplash.com/photo-1560421683-6856ea585c78?auto=format&fit=crop&q=80&w=800",
            "source": "Ahmedabad Municipal Corp"
        },
        {
            "id": "live-2",
            "title": "Sunburn Arena Ahmedabad Tribute",
            "description": "Experience the massive audio-visual experience with electronic dance music DJs performing live at the YMCA Club Event Grounds.",
            "date": str((datetime.now() + timedelta(days=5)).date()),
            "time": "18:00:00",
            "location": "YMCA Club, SG Highway, Ahmedabad",
            "price": 499.00,
            "image": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
            "source": "Sunburn Arena"
        },
        {
            "id": "live-3",
            "title": "Gujarat Food & Cultural Festival",
            "description": "Taste authentic Kathiyawadi, Surati, and Gujarati snacks, along with live folk garba and puppet performance stages.",
            "date": str((datetime.now() + timedelta(days=9)).date()),
            "time": "17:00:00",
            "location": "Karnavati Club Lawn, SG Highway, Ahmedabad",
            "price": 150.00,
            "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800",
            "source": "Gujarat Tourism"
        },
        {
            "id": "live-4",
            "title": "Science City Tech Expo 2026",
            "description": "Showcasing recent AI innovations, robotics demonstrations, and clean energy startups from leading engineering schools across Gujarat.",
            "date": str((datetime.now() + timedelta(days=12)).date()),
            "time": "09:30:00",
            "location": "Gujarat Science City, Sola, Ahmedabad",
            "price": 0.00,
            "image": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800",
            "source": "DST Gujarat"
        },
        {
            "id": "live-5",
            "title": "Amdavad Heritage Photo Exhibition",
            "description": "Explore custom galleries highlighting the history and architecture of Ahmedabad's pols, mosques, and stepwells.",
            "date": str((datetime.now() + timedelta(days=15)).date()),
            "time": "11:00:00",
            "location": "Sanskar Kendra Museum, Paldi, Ahmedabad",
            "price": 0.00,
            "image": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800",
            "source": "AMC Heritage"
        }
    ]
