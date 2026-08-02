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

def add_resorts_and_farmhouses():
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

    # 2. 4 Resorts & Farmhouses Data in Ahmedabad
    resorts_data = [
        {
            "name": "Gulmohar Greens Golf & Country Club Resort",
            "description": "Sprawling luxury resort with 9-hole golf course lawns, swimming pool, luxury villa rooms, open dining gazebos, and full event infrastructure off Sanand - Sarkhej Highway, Ahmedabad.",
            "location": "Off Sarkhej-Sanand Highway, Near Kolat, Sanand Road, Ahmedabad, Gujarat 382210",
            "category": "Resort / Farmhouse Lawn",
            "price_per_day": 70000.00,
            "facilities": ["Golf Course Lawn", "Swimming Pool", "Cottage Stay", "Catering", "DJ System", "Ample Parking", "Security"],
            "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 650.00,
            "catering_min_plates": 60,
            "catering_cuisine": "Resort Multi-Cuisine Feast",
            "catering_description": json.dumps([
                {"name": "Resort Multi-Cuisine Feast", "price": "650", "description": "Welcome Drinks, 3 Starters, Live Italian Pasta, Paneer Butter Masala, Kashmiri Pulao, Naan, 3 Desserts"}
            ]),
            "has_dj": True,
            "dj_price": 15000.00,
            "dj_equipment": json.dumps([
                {"name": "Resort Concert Sound & DJ", "price": "15000", "equipment": "JBL Line Array Speakers, Pioneer Controller, Stage Lights, Wireless Microphones"}
            ]),
            "has_decor": True,
            "decor_price": 30000.00,
            "decor_themes": json.dumps([
                {"name": "Golf Course Fairy Light & Canopy Decor", "price": "30000", "description": "Fairy Light Canopy, Poolside Arches, Floral Stage Background, Velvet Seating"}
            ]),
            "is_approved": True
        },
        {
            "name": "Palm Green Waterpark & Resort Lawn",
            "description": "Tropical resort featuring waterpark access, poolside party lawns, air-conditioned guest suites, and lush green lawns on Bareja Highway, Ahmedabad.",
            "location": "Bareja - Kheda Highway, Near Goblej, Ahmedabad, Gujarat 382425",
            "category": "Resort / Farmhouse Lawn",
            "price_per_day": 45000.00,
            "facilities": ["Poolside Lawn", "Waterpark View", "AC Rooms", "Catering", "DJ System", "Parking Space", "Changing Rooms"],
            "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 450.00,
            "catering_min_plates": 50,
            "catering_cuisine": "Gujarati & Punjabi Buffet",
            "catering_description": json.dumps([
                {"name": "Gujarati & Punjabi Buffet", "price": "450", "description": "Welcome Drink, 2 Starters, Paneer Kadhai, Dal Fry, Jeera Rice, Roti, 2 Sweets, Ice Cream"}
            ]),
            "has_dj": True,
            "dj_price": 10000.00,
            "dj_equipment": json.dumps([
                {"name": "Poolside DJ & Sound Setup", "price": "10000", "equipment": "4x High Quality Speakers, DJ Mixer, Mic, LED Ambient Lighting"}
            ]),
            "has_decor": True,
            "decor_price": 22000.00,
            "decor_themes": json.dumps([
                {"name": "Tropical Poolside Party Decor", "price": "22000", "description": "Floating Pool Flowers, Bamboo Gazebo, String Lights, Floral Mandap"}
            ]),
            "is_approved": True
        },
        {
            "name": "Greenwoods Country Club & Resort",
            "description": "Lush manicured green lawns, swimming pool, luxury banquet spaces, and calm nature retreat situated on S.P. Ring Road near Vaishno Devi Circle, Ahmedabad.",
            "location": "Sardar Patel Ring Road, Off S.G. Highway, Near Vaishno Devi Circle, Ahmedabad, Gujarat 382481",
            "category": "Resort / Farmhouse Lawn",
            "price_per_day": 55000.00,
            "facilities": ["Lush Green Lawns", "Swimming Pool", "Banquet Hall", "Catering", "Sound System", "Valet Parking"],
            "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 500.00,
            "catering_min_plates": 50,
            "catering_cuisine": "Multi-Cuisine Buffet",
            "catering_description": json.dumps([
                {"name": "Greenwoods Club Special Buffet", "price": "500", "description": "2 Starters, Paneer Lababdar, Dal Makhani, Veg Biryani, Butter Naan, Gulab Jamun"}
            ]),
            "has_dj": True,
            "dj_price": 12000.00,
            "dj_equipment": json.dumps([
                {"name": "Club Quality DJ Setup", "price": "12000", "equipment": "JBL Sound System, Mixer, Wireless Mics, Stage Lights"}
            ]),
            "has_decor": True,
            "decor_price": 25000.00,
            "decor_themes": json.dumps([
                {"name": "Garden Elegance & Flower Mandap", "price": "25000", "description": "Marigold & Rose Arches, Carpet Aisle, Gold Sofa Seating"}
            ]),
            "is_approved": True
        },
        {
            "name": "Bougainvillea Luxury Farmhouse & Club",
            "description": "Exclusive private farmhouse property with private swimming pool, lawn garden, outdoor barbecue area, and AC villa stay in Shilaj / Rancharda, Ahmedabad.",
            "location": "Rancharda - Thaltej Road, Near Shilaj, Ahmedabad, Gujarat 380058",
            "category": "Resort / Farmhouse Lawn",
            "price_per_day": 40000.00,
            "facilities": ["Private Swimming Pool", "Villa Stay", "Open Barbecue Area", "Catering", "DJ", "Changing Rooms"],
            "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 400.00,
            "catering_min_plates": 40,
            "catering_cuisine": "Farmhouse Special Thali",
            "catering_description": json.dumps([
                {"name": "Farmhouse Special Thali", "price": "400", "description": "2 Sabzis, Dal/Kadhi, Rice, Roti, 2 Farsan, Sweet, Butter Milk"}
            ]),
            "has_dj": True,
            "dj_price": 8000.00,
            "dj_equipment": json.dumps([
                {"name": "Farmhouse Portable DJ Setup", "price": "8000", "equipment": "2x Speakers, DJ Controller, Wireless Mic, Party Lights"}
            ]),
            "has_decor": True,
            "decor_price": 20000.00,
            "decor_themes": json.dumps([
                {"name": "Boho Rustic Farmhouse Setup", "price": "20000", "description": "Fairy Light Canopy, Wood Backdrop, Vintage Cushions, Carpet Pathway"}
            ]),
            "is_approved": True
        }
    ]

    count = 0
    for r in resorts_data:
        venue, _ = Venue.objects.update_or_create(
            name=r["name"],
            owner=owner,
            defaults=r
        )
        count += 1
        print(f"[{count}/4] Created/Updated Resort/Farmhouse: '{venue.name}' (Rent: Rs.{venue.price_per_day}/day)")

    print(f"\nAll {count} Resorts & Farmhouses added successfully under account: {email}")

if __name__ == "__main__":
    add_resorts_and_farmhouses()
