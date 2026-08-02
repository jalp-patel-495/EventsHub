import os
# Add parent directory to sys.path to resolve django settings and apps
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


import django
import json

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')
django.setup()

from django.contrib.auth import get_user_model
from venues.models import Venue

User = get_user_model()

def add_party_plots():
    email = 'jalppatel4950@gmail.com'
    password = 'Jalp@4950'
    
    # 1. Create or update venue owner user
    owner, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': 'Sumit',
            'last_name': 'Gohel',
            'role': 'plot_owner',
            'phone': '6845125462',
            'is_approved': True,
            'is_active': True
        }
    )
    owner.role = 'plot_owner'
    owner.is_approved = True
    owner.is_active = True
    owner.set_password(password)
    owner.save()
    
    print(f"User '{email}' set up successfully (Role: plot_owner, Approved: True)!")

    # 2. 5 Party Plots Data
    plots_data = [
        {
            "name": "Agrasen Foundation & Lawns",
            "description": "Premium luxury party plot and indoor banquet hall with crystal chandeliers, lush green open gardens, ample parking, and full event infrastructure in Shela, Ahmedabad.",
            "location": "Agrasen Foundation, Near Club O7, Agrasen Road, Shela, Gujarat 380058",
            "category": "Banquet Hall",
            "price_per_day": 15000.00,
            "facilities": ["Ample Parking", "Central AC", "Catering Service", "DJ Setup", "Decoration", "Changing Rooms", "CCTV Security"],
            "image": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 350.00,
            "catering_min_plates": 50,
            "catering_cuisine": "Gujarati Thali",
            "catering_description": json.dumps([
                {"name": "Gujarati Thali", "price": "350", "description": "2 Sabzis, Dal/Kadhi, Rice, Roti, 2 Farsan, 1 Sweet, Butter Milk"},
                {"name": "Punjabi Buffet", "price": "450", "description": "Paneer Tikka, Dal Makhani, Naan, Jeera Rice, Sweet, Raita"}
            ]),
            "has_dj": True,
            "dj_price": 8000.00,
            "dj_equipment": json.dumps([
                {"name": "Standard DJ Setup", "price": "8000", "equipment": "2x 15-inch Speakers, DJ Mixer, Wireless Mic, LED Stage Lights"}
            ]),
            "has_decor": True,
            "decor_price": 15000.00,
            "decor_themes": json.dumps([
                {"name": "Classic Floral Decor", "price": "15000", "description": "Flower Arches, Stage Background, Carpet, Velvet Pathway"}
            ]),
            "is_approved": True
        },
        {
            "name": "Karnavati Celebration Party Plot",
            "description": "Massive open-air celebration lawn on S.G. Highway, featuring royal entrance arches, high capacity guest lawns, and state-of-the-art stage setups for weddings and grand galas.",
            "location": "S.G. Highway, Opp. Karnavati Club, Bodakdev, Ahmedabad, Gujarat 380058",
            "category": "Party Plot / Lawn",
            "price_per_day": 45000.00,
            "facilities": ["Valet Parking", "Huge Lawns", "Stage Lighting", "Generator Backup", "Catering", "DJ System", "VIP Lounge"],
            "image": "https://images.unsplash.com/photo-1545232979-fbfd42e000b9?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 450.00,
            "catering_min_plates": 100,
            "catering_cuisine": "Multi-Cuisine Buffet",
            "catering_description": json.dumps([
                {"name": "Multi-Cuisine Buffet", "price": "450", "description": "Starters, Paneer Curry, Dal Fry, Biryani, Assorted Breads, 2 Desserts"}
            ]),
            "has_dj": True,
            "dj_price": 12000.00,
            "dj_equipment": json.dumps([
                {"name": "Premium Club DJ", "price": "12000", "equipment": "4x JBL Speakers, Pioneer Controller, Moving Heads, Fog Machine"}
            ]),
            "has_decor": True,
            "decor_price": 25000.00,
            "decor_themes": json.dumps([
                {"name": "Royal Palace Theme", "price": "25000", "description": "Chandelier Entrance, Royal Sofa Seating, Gold Backdrop, Flower Canopy"}
            ]),
            "is_approved": True
        },
        {
            "name": "YMCA International Party Ground",
            "description": "Top-tier mega event ground in Vastrapur suitable for corporate summits, garba nights, musical concerts, and large-scale social gatherings.",
            "location": "S.G. Highway, Near Vastrapur, Ahmedabad, Gujarat 380015",
            "category": "Exhibition Ground & Lawn",
            "price_per_day": 65000.00,
            "facilities": ["Massive Parking", "Security Guards", "AC Restrooms", "Stage Setup", "Catering", "DJ & Line Array"],
            "image": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 500.00,
            "catering_min_plates": 150,
            "catering_cuisine": "Multi-Cuisine",
            "catering_description": json.dumps([
                {"name": "Grand Royal Buffet", "price": "500", "description": "3 Starters, 2 Soups, 3 Main Course Curries, Live Counter, 3 Desserts"}
            ]),
            "has_dj": True,
            "dj_price": 15000.00,
            "dj_equipment": json.dumps([
                {"name": "Grand Concert DJ & Line Array", "price": "15000", "equipment": "JBL Line Array, Truss Lighting, LED Screen Backdrop, Wireless Mics"}
            ]),
            "has_decor": True,
            "decor_price": 30000.00,
            "decor_themes": json.dumps([
                {"name": "Bollywood Glamour Theme", "price": "30000", "description": "Red Carpet, LED Wash Lights, Glitter Backdrop, Film Roll Arches"}
            ]),
            "is_approved": True
        },
        {
            "name": "Royal Palace Lawns & Banquet",
            "description": "Ultra-luxurious Sindhu Bhavan Road venue with royal architecture, air-conditioned bride/groom suits, elegantmandap spaces, and lush greens.",
            "location": "Sindhu Bhavan Road, Off S.G. Highway, Bodakdev, Ahmedabad, Gujarat 380054",
            "category": "Luxury Villa & Lawn",
            "price_per_day": 55000.00,
            "facilities": ["Valet Parking", "AC Rooms", "Mandap Setup", "Catering", "DJ", "Theme Decoration"],
            "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 550.00,
            "catering_min_plates": 80,
            "catering_cuisine": "Multi-Cuisine",
            "catering_description": json.dumps([
                {"name": "Royal Gourmet Buffet", "price": "550", "description": "Paneer Lababdar, Dal Makhani, Kashmiri Pulao, Stuffed Naan, Gulab Jamun"}
            ]),
            "has_dj": True,
            "dj_price": 10000.00,
            "dj_equipment": json.dumps([
                {"name": "Premium DJ Setup", "price": "10000", "equipment": "JBL Sound System, Stage Lights, Wireless Microphones"}
            ]),
            "has_decor": True,
            "decor_price": 28000.00,
            "decor_themes": json.dumps([
                {"name": "Royal Wedding Mandap Decor", "price": "28000", "description": "Custom Mandap Flowers, Golden Pillars, Carpeted Aisles"}
            ]),
            "is_approved": True
        },
        {
            "name": "Shankus Resort & Celebration Lawn",
            "description": "Serene resort lawn featuring poolside views, manicured gardens, open dining areas, and peaceful party spaces near Bopal.",
            "location": "Ambali - Bopal Road, Near Ring Road, Ahmedabad, Gujarat 380058",
            "category": "Resort / Farmhouse Lawn",
            "price_per_day": 35000.00,
            "facilities": ["Poolside View", "Ample Parking", "Changing Rooms", "Catering", "DJ System", "Garden Lighting"],
            "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 400.00,
            "catering_min_plates": 50,
            "catering_cuisine": "Gujarati & Punjabi",
            "catering_description": json.dumps([
                {"name": "Resort Special Thali", "price": "400", "description": "2 Sabzis, Dal Fry, Jeera Rice, Butter Roti, 2 Farsan, 1 Sweet, Ice Cream"}
            ]),
            "has_dj": True,
            "dj_price": 7500.00,
            "dj_equipment": json.dumps([
                {"name": "Resort DJ Setup", "price": "7500", "equipment": "2x High Quality Speakers, DJ Mixer, Mic, Warm LED Lighting"}
            ]),
            "has_decor": True,
            "decor_price": 18000.00,
            "decor_themes": json.dumps([
                {"name": "Minimalist Nature & Fairy Lights", "price": "18000", "description": "Fairy Light Canopy over Trees, Clean White Drapes, Wood Backdrop"}
            ]),
            "is_approved": True
        }
    ]

    count = 0
    for p in plots_data:
        venue, _ = Venue.objects.update_or_create(
            name=p["name"],
            owner=owner,
            defaults=p
        )
        count += 1
        print(f"[{count}/5] Created/Updated Party Plot: '{venue.name}' (Rent: Rs.{venue.price_per_day}/day)")

    print(f"\nAll {count} party plots added successfully under account: {email}")

if __name__ == "__main__":
    add_party_plots()
