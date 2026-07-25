import os
import django
import json

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')
django.setup()

from django.contrib.auth import get_user_model
from venues.models import Venue

User = get_user_model()

def add_banquet_halls():
    email = 'jalppatel4950@gmail.com'
    password = 'Jalp@4950'
    
    # 1. Ensure owner user exists & is active
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

    # 2. 4 Banquet Halls Data in Ahmedabad
    halls_data = [
        {
            "name": "The Grand Bhagwati Crystal Ballroom",
            "description": "5-star luxury indoor banquet hall on S.G. Highway, featuring crystal chandeliers, carpeted floors, central AC, executive catering, and high-tech stage lighting for weddings and corporate galas.",
            "location": "S.G. Highway, Opp. Rajpath Club, Bodakdev, Ahmedabad, Gujarat 380054",
            "category": "Banquet Hall",
            "price_per_day": 50000.00,
            "facilities": ["Central AC", "Valet Parking", "Grand Stage", "Catering Service", "DJ & Sound", "Changing Rooms", "CCTV Security"],
            "image": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 600.00,
            "catering_min_plates": 50,
            "catering_cuisine": "Multi-Cuisine Gourmet",
            "catering_description": json.dumps([
                {"name": "Multi-Cuisine Gourmet", "price": "600", "description": "Welcome Drinks, 3 Starters, Paneer Butter Masala, Dal Makhani, Pulao, Naan, 2 Sweets, Ice Cream"}
            ]),
            "has_dj": True,
            "dj_price": 10000.00,
            "dj_equipment": json.dumps([
                {"name": "Premium Banquet DJ Setup", "price": "10000", "equipment": "4x Speaker Sound System, Wireless Mics, Ambient Stage Lights, Mixer"}
            ]),
            "has_decor": True,
            "decor_price": 20000.00,
            "decor_themes": json.dumps([
                {"name": "Royal Crystal & Floral Theme", "price": "20000", "description": "Chandelier Arches, Flower Stage Backdrop, Red Carpet Aisle, Velvet Sofa"}
            ]),
            "is_approved": True
        },
        {
            "name": "Novotel Grand Imperial Ballroom",
            "description": "Ultra-modern luxury indoor hotel banquet hall with high ceilings, acoustic walls, LED screen display, and executive dining suites next to Wide Angle Cinema, S.G. Highway.",
            "location": "Iscon Cross Road, Next to Wide Angle, S.G. Highway, Ahmedabad, Gujarat 380015",
            "category": "Banquet Hall",
            "price_per_day": 75000.00,
            "facilities": ["Central AC", "Valet Parking", "Projector & LED Display", "Catering", "DJ System", "Security", "Green Rooms"],
            "image": "https://images.unsplash.com/photo-1545232979-fbfd42e000b9?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 750.00,
            "catering_min_plates": 75,
            "catering_cuisine": "5-Star Chef's Special Buffet",
            "catering_description": json.dumps([
                {"name": "5-Star Chef's Special Buffet", "price": "750", "description": "Mocktails, Live Counter, Continental & Indian Main Courses, Exotic Desserts"}
            ]),
            "has_dj": True,
            "dj_price": 15000.00,
            "dj_equipment": json.dumps([
                {"name": "Concert Quality DJ & Sound", "price": "15000", "equipment": "JBL Line Array System, Pioneer Console, Moving Head Lights"}
            ]),
            "has_decor": True,
            "decor_price": 35000.00,
            "decor_themes": json.dumps([
                {"name": "Contemporary Elegance Decor", "price": "35000", "description": "Custom Mandap Decor, Warm Lighting, Designer Flower Pillars"}
            ]),
            "is_approved": True
        },
        {
            "name": "Pride Plaza Crystal Banquet Hall",
            "description": "Sophisticated air-conditioned banquet hall located on Judges Bungalow Road, perfect for wedding receptions, engagement parties, and corporate conferences.",
            "location": "Judges Bungalow Road, Off S.G. Highway, Bodakdev, Ahmedabad, Gujarat 380054",
            "category": "Banquet Hall",
            "price_per_day": 40000.00,
            "facilities": ["Central AC", "Ample Parking", "Sound & Lighting", "Catering Service", "Changing Rooms", "WiFi"],
            "image": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 500.00,
            "catering_min_plates": 50,
            "catering_cuisine": "Gujarati & North Indian",
            "catering_description": json.dumps([
                {"name": "North Indian & Gujarati Fusion", "price": "500", "description": "2 Starters, Paneer Kadhai, Dal Tadka, Jeera Rice, Roti, 2 Sweets, Salad"}
            ]),
            "has_dj": True,
            "dj_price": 8000.00,
            "dj_equipment": json.dumps([
                {"name": "Standard Banquet DJ", "price": "8000", "equipment": "2x Speakers, Mixer, Mic, Warm Wash Lights"}
            ]),
            "has_decor": True,
            "decor_price": 18000.00,
            "decor_themes": json.dumps([
                {"name": "Velvet & Marigold Decor", "price": "18000", "description": "Stage Flower Backdrop, Velvet Drapes, Pathway Lighting"}
            ]),
            "is_approved": True
        },
        {
            "name": "Karnavati Grand Ballroom Banquet",
            "description": "Spacious premium indoor hall with high capacity guest seating, wooden dance floors, and full catering support inside Karnavati Club campus on S.G. Highway.",
            "location": "Karnavati Club Campus, S.G. Highway, Bodakdev, Ahmedabad, Gujarat 380058",
            "category": "Banquet Hall",
            "price_per_day": 60000.00,
            "facilities": ["Central AC", "Valet Parking", "Wooden Stage", "Catering Service", "DJ System", "Security"],
            "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 550.00,
            "catering_min_plates": 60,
            "catering_cuisine": "Multi-Cuisine Buffet",
            "catering_description": json.dumps([
                {"name": "Karnavati Special Buffet", "price": "550", "description": "Starters, Paneer Handi, Veg Pulao, Naan/Roti, Gulab Jamun, Ice Cream"}
            ]),
            "has_dj": True,
            "dj_price": 12000.00,
            "dj_equipment": json.dumps([
                {"name": "Grand DJ Setup", "price": "12000", "equipment": "4x Sound Speakers, Wireless Microphones, Stage Lights"}
            ]),
            "has_decor": True,
            "decor_price": 25000.00,
            "decor_themes": json.dumps([
                {"name": "Royal Gold & White Decor", "price": "25000", "description": "Golden Mandap Pillars, Flower Arches, Plush Sofa Seating"}
            ]),
            "is_approved": True
        }
    ]

    count = 0
    for h in halls_data:
        venue, _ = Venue.objects.update_or_create(
            name=h["name"],
            owner=owner,
            defaults=h
        )
        count += 1
        print(f"[{count}/4] Created/Updated Banquet Hall: '{venue.name}' (Rent: Rs.{venue.price_per_day}/day)")

    print(f"\nAll {count} Banquet Halls added successfully under account: {email}")

if __name__ == "__main__":
    add_banquet_halls()
