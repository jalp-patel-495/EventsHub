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

def add_auditoriums_and_exhibitions():
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

    # 2. 5 Auditoriums & Convention Centers in Ahmedabad
    auditoriums_data = [
        {
            "name": "Tagore Memorial Hall & Convention Auditorium",
            "description": "Iconic architectural auditorium in Paldi designed by B.V. Doshi, featuring acoustic cushioned seating for 700+ attendees, proscenium stage, central AC, audio-visual suite, and green rooms.",
            "location": "Paldi, Near Ellisbridge, Ahmedabad, Gujarat 380007",
            "category": "Auditorium & Convention Center",
            "price_per_day": 35000.00,
            "facilities": ["Proscenium Stage", "Acoustic Seating", "Central AC", "Green Rooms", "Audio System", "Parking"],
            "image": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 350.00,
            "catering_min_plates": 50,
            "catering_cuisine": "Corporate High-Tea & Snacks",
            "catering_description": json.dumps([
                {"name": "Corporate High-Tea & Lunch", "price": "350", "description": "Tea/Coffee, 2 Snacks, Veg Sandwich, Main Course Thali, Dessert"}
            ]),
            "has_dj": True,
            "dj_price": 8000.00,
            "dj_equipment": json.dumps([
                {"name": "Auditorium Sound & Mic Setup", "price": "8000", "equipment": "4x Stage Monitor Speakers, Mixer, 4 Wireless Podium Mics"}
            ]),
            "has_decor": True,
            "decor_price": 15000.00,
            "decor_themes": json.dumps([
                {"name": "Stage Floral & Banner Decor", "price": "15000", "description": "Stage Backdrop Flowers, Podium Branding, Carpeted Walkway"}
            ]),
            "is_approved": True
        },
        {
            "name": "Mahatma Mandir World Convention Centre",
            "description": "India's premier world-class convention center and auditorium facility featuring plenary halls with 5,000 seating capacity, central AC, VIP suites, multi-lingual interpretation, and high security.",
            "location": "Sector 13, Near Railway Station, Gandhinagar - Ahmedabad Region, Gujarat 382016",
            "category": "Auditorium & Convention Center",
            "price_per_day": 120000.00,
            "facilities": ["Plenary Auditorium", "Central AC", "VIP Lounge", "Multi-Level Parking", "Digital Sound", "Security Guards"],
            "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 700.00,
            "catering_min_plates": 100,
            "catering_cuisine": "Global Executive Buffet",
            "catering_description": json.dumps([
                {"name": "Global Executive Buffet", "price": "700", "description": "Welcome Mocktails, 4 Starters, Live Mexican & Italian, Indian Main Course, 3 Desserts"}
            ]),
            "has_dj": True,
            "dj_price": 20000.00,
            "dj_equipment": json.dumps([
                {"name": "Concert Production Sound", "price": "20000", "equipment": "JBL Line Array, digital audio desk, truss lighting, lapel mics"}
            ]),
            "has_decor": True,
            "decor_price": 40000.00,
            "decor_themes": json.dumps([
                {"name": "International Summit Theme Decor", "price": "40000", "description": "P2.5 LED Screen Backdrop, Stage Floral Arch, VIP Leather Seating"}
            ]),
            "is_approved": True
        },
        {
            "name": "Pandit Dindayal Upadhyay Auditorium",
            "description": "Modern air-conditioned auditorium with 1,000+ plush pushback seats, surround sound speakers, projection screens, and green rooms located behind Rajpath Club, Bodakdev.",
            "location": "Behind Rajpath Club, Off S.G. Highway, Bodakdev, Ahmedabad, Gujarat 380054",
            "category": "Auditorium & Convention Center",
            "price_per_day": 45000.00,
            "facilities": ["1000+ Pushback Seats", "Stage Projection", "Central AC", "Valet Parking", "Audio Mixer", "Green Rooms"],
            "image": "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 450.00,
            "catering_min_plates": 50,
            "catering_cuisine": "Punjabi & Gujarati Buffet",
            "catering_description": json.dumps([
                {"name": "Auditorium Event Buffet", "price": "450", "description": "2 Starters, Paneer Curry, Dal Makhani, Pulao, Naan, Gulab Jamun"}
            ]),
            "has_dj": True,
            "dj_price": 10000.00,
            "dj_equipment": json.dumps([
                {"name": "Stage Sound & Lighting", "price": "10000", "equipment": "Yamaha Sound Console, Stage Spotlights, Wireless Microphones"}
            ]),
            "has_decor": True,
            "decor_price": 20000.00,
            "decor_themes": json.dumps([
                {"name": "Executive Conference Decor", "price": "20000", "description": "Stage Flower Garland, Standee Frames, Red Carpet Aisle"}
            ]),
            "is_approved": True
        },
        {
            "name": "AMA Convention Auditorium (ATIRA Campus)",
            "description": "State-of-the-art corporate auditorium in Vastrapur equipped with acoustic wall panels, high-definition video projectors, stage lighting, and executive dining halls.",
            "location": "AMA Complex, ATIRA Campus, Dr. Vikram Sarabhai Marg, Vastrapur, Ahmedabad, Gujarat 380015",
            "category": "Auditorium & Convention Center",
            "price_per_day": 30000.00,
            "facilities": ["Seminar Seating", "HD Projectors", "Central AC", "Executive Dining", "High Speed WiFi", "Parking"],
            "image": "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 400.00,
            "catering_min_plates": 40,
            "catering_cuisine": "Corporate Seminar Lunch",
            "catering_description": json.dumps([
                {"name": "Corporate Seminar Lunch", "price": "400", "description": "Tea/Coffee, Soup, 2 Main Course Dishes, Roti/Naan, Rice, Sweet"}
            ]),
            "has_dj": True,
            "dj_price": 7500.00,
            "dj_equipment": json.dumps([
                {"name": "Seminar Sound System", "price": "7500", "equipment": "2x Bose Speakers, Audio Mixer, Collar Mics, Wireless Mics"}
            ]),
            "has_decor": True,
            "decor_price": 12000.00,
            "decor_themes": json.dumps([
                {"name": "Clean Corporate Stage Setup", "price": "12000", "description": "Podium Flowers, Backdrop Banner Framing, Blue Lighting"}
            ]),
            "is_approved": True
        },
        {
            "name": "Town Hall Auditorium & Cultural Center",
            "description": "Historic cultural hall in Ellisbridge near Ashram Road featuring traditional balcony seating, large stage, central air-conditioning, and green room suites.",
            "location": "Near Ashram Road, Ellisbridge, Ahmedabad, Gujarat 380006",
            "category": "Auditorium & Convention Center",
            "price_per_day": 25000.00,
            "facilities": ["Balcony & Ground Seating", "Large Stage", "AC", "Changing Rooms", "Parking Space", "Security"],
            "image": "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 300.00,
            "catering_min_plates": 40,
            "catering_cuisine": "Traditional Gujarati Thali",
            "catering_description": json.dumps([
                {"name": "Traditional Gujarati Thali", "price": "300", "description": "2 Sabzis, Dal/Kadhi, Rice, Puri/Roti, 2 Farsan, Sweet"}
            ]),
            "has_dj": True,
            "dj_price": 6000.00,
            "dj_equipment": json.dumps([
                {"name": "Stage Audio System", "price": "6000", "equipment": "2x Sound Speakers, Audio Console, 2 Microphones"}
            ]),
            "has_decor": True,
            "decor_price": 10000.00,
            "decor_themes": json.dumps([
                {"name": "Cultural Floral Stage Decor", "price": "10000", "description": "Stage Marigold Garland, Entrance Lamp Decor"}
            ]),
            "is_approved": True
        }
    ]

    # 3. 5 Exhibition Grounds in Ahmedabad
    exhibitions_data = [
        {
            "name": "Helipad Exhibition Centre (HEC Grounds)",
            "description": "Gujarat's largest mega exhibition venue featuring air-conditioned exhibition halls, heavy machinery entry gates, 10,000+ vehicle parking, power backup, and food courts.",
            "location": "Swarnim Park, Sector 17, Gandhinagar - Ahmedabad Region, Gujarat 382016",
            "category": "Exhibition Ground",
            "price_per_day": 150000.00,
            "facilities": ["AC Hangar Halls", "Heavy Vehicle Access", "10,000+ Parking", "Power Gensets", "Food Court", "Security"],
            "image": "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 600.00,
            "catering_min_plates": 100,
            "catering_cuisine": "Expo Multi-Cuisine Buffet",
            "catering_description": json.dumps([
                {"name": "Expo Multi-Cuisine Buffet", "price": "600", "description": "Welcome Drinks, 3 Starters, Italian & Indian Main Course, 2 Sweets"}
            ]),
            "has_dj": True,
            "dj_price": 25000.00,
            "dj_equipment": json.dumps([
                {"name": "Expo Line Array PA System", "price": "25000", "equipment": "JBL Line Array, Truss Lighting, Wireless Announcement System"}
            ]),
            "has_decor": True,
            "decor_price": 50000.00,
            "decor_themes": json.dumps([
                {"name": "Grand Trade Fair Gate & Dome Decor", "price": "50000", "description": "Custom Truss Entrance Arch, LED Screen Pillars, Carpeted Hangar Aisles"}
            ]),
            "is_approved": True
        },
        {
            "name": "AES Exhibition Ground (Helmet Circle)",
            "description": "Massive open exhibition ground on Drive-In Road near Helmet Circle, ideal for consumer expos, book fairs, auto shows, and food festivals.",
            "location": "Near Helmet Cross Road, Drive-In Road, Memnagar, Ahmedabad, Gujarat 380052",
            "category": "Exhibition Ground",
            "price_per_day": 80000.00,
            "facilities": ["Open Expo Lawn", "Stall Structure Truss", "Power Gensets", "Multiple Entrance Gates", "Ample Parking"],
            "image": "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 450.00,
            "catering_min_plates": 80,
            "catering_cuisine": "Fast Food & Thali Buffet",
            "catering_description": json.dumps([
                {"name": "Expo Food Court Buffet", "price": "450", "description": "Live Stalls, Paneer Curry, Dal Makhani, Naan, Rice, Sweet"}
            ]),
            "has_dj": True,
            "dj_price": 15000.00,
            "dj_equipment": json.dumps([
                {"name": "Open Ground DJ & Sound", "price": "15000", "equipment": "4x High Output Speakers, Wireless Mics, Stage Lights"}
            ]),
            "has_decor": True,
            "decor_price": 30000.00,
            "decor_themes": json.dumps([
                {"name": "Consumer Expo Arch & Lights", "price": "30000", "description": "Entrance Arch, Stall Drapery, Flood Lighting"}
            ]),
            "is_approved": True
        },
        {
            "name": "Gujarat University Convention & Exhibition Ground",
            "description": "Spacious exhibition dome and outdoor grounds on 132 Feet Ring Road equipped with air-conditioned pavilions, food courts, and high capacity parking.",
            "location": "132 Feet Ring Road, Near Helmet Circle, Navrangpura, Ahmedabad, Gujarat 380009",
            "category": "Exhibition Ground",
            "price_per_day": 90000.00,
            "facilities": ["AC Exhibition Dome", "Food Court Area", "VIP Entrance", "Ample Parking", "Security Guards"],
            "image": "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 500.00,
            "catering_min_plates": 75,
            "catering_cuisine": "Multi-Cuisine Buffet",
            "catering_description": json.dumps([
                {"name": "University Convention Buffet", "price": "500", "description": "Paneer Tikka, Dal Fry, Kashmiri Pulao, Butter Roti, Gulab Jamun, Ice Cream"}
            ]),
            "has_dj": True,
            "dj_price": 18000.00,
            "dj_equipment": json.dumps([
                {"name": "Exhibition PA & DJ Console", "price": "18000", "equipment": "4x Speakers, Pioneer DJ Mixer, Announcement Mics"}
            ]),
            "has_decor": True,
            "decor_price": 35000.00,
            "decor_themes": json.dumps([
                {"name": "Trade Pavilion Entrance Decor", "price": "35000", "description": "Glass Door Entrance Arch, Carpet Aisles, Spotlight Framing"}
            ]),
            "is_approved": True
        },
        {
            "name": "Sabarmati Riverfront Exhibition Ground",
            "description": "Scenic riverfront open plaza and exhibition grounds behind NID Paldi, featuring river views, wide promenade walkways, and open stalls space.",
            "location": "Behind NID, Paldi, Sabarmati Riverfront West, Ahmedabad, Gujarat 380007",
            "category": "Exhibition Ground",
            "price_per_day": 100000.00,
            "facilities": ["Riverfront Plaza", "Promenade Walkway", "Exhibition Stalls Area", "Generator Backup", "Parking"],
            "image": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 550.00,
            "catering_min_plates": 80,
            "catering_cuisine": "Riverfront Gourmet Feast",
            "catering_description": json.dumps([
                {"name": "Riverfront Gourmet Feast", "price": "550", "description": "Welcome Mocktails, Starters, Live Counters, North Indian Main Course, Sweets"}
            ]),
            "has_dj": True,
            "dj_price": 20000.00,
            "dj_equipment": json.dumps([
                {"name": "Riverfront Concert Sound", "price": "20000", "equipment": "JBL Speakers, DJ Setup, Stage Lights, Wireless Microphones"}
            ]),
            "has_decor": True,
            "decor_price": 40000.00,
            "decor_themes": json.dumps([
                {"name": "Riverfront Promenade Lights & Arch", "price": "40000", "description": "Promenade String Lights, Waterfront Arch, Red Carpet Staging"}
            ]),
            "is_approved": True
        },
        {
            "name": "Science City Trade & Exhibition Ground",
            "description": "Modern open-air exhibition ground near Science City, featuring high capacity electrical power transformers, wide paved roads, and VIP lounges.",
            "location": "Science City Road, Off S.G. Highway, Thaltej, Ahmedabad, Gujarat 380060",
            "category": "Exhibition Ground",
            "price_per_day": 70000.00,
            "facilities": ["Open Expo Lawn", "High Power Infrastructure", "Security Guards", "VIP Lounges", "Food Plaza Area"],
            "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
            "has_catering": True,
            "catering_price_per_plate": 400.00,
            "catering_min_plates": 60,
            "catering_cuisine": "Gujarati & Punjabi Buffet",
            "catering_description": json.dumps([
                {"name": "Science City Expo Thali", "price": "400", "description": "2 Sabzis, Dal/Kadhi, Rice, Roti, 2 Farsan, Sweet, Ice Cream"}
            ]),
            "has_dj": True,
            "dj_price": 12000.00,
            "dj_equipment": json.dumps([
                {"name": "Expo DJ Sound", "price": "12000", "equipment": "2x Sound Systems, Audio Console, Mics, Spotlights"}
            ]),
            "has_decor": True,
            "decor_price": 25000.00,
            "decor_themes": json.dumps([
                {"name": "Tech Expo Truss Arch & Banners", "price": "25000", "description": "Aluminum Truss Arch, LED Stage Lights, Carpeted Walkways"}
            ]),
            "is_approved": True
        }
    ]

    # Insert Auditoriums
    count_aud = 0
    for a in auditoriums_data:
        venue, _ = Venue.objects.update_or_create(
            name=a["name"],
            owner=owner,
            defaults=a
        )
        count_aud += 1
        print(f"[{count_aud}/5] Added Auditorium: '{venue.name}' (Rent: Rs.{venue.price_per_day}/day)")

    # Insert Exhibition Grounds
    count_exh = 0
    for e in exhibitions_data:
        venue, _ = Venue.objects.update_or_create(
            name=e["name"],
            owner=owner,
            defaults=e
        )
        count_exh += 1
        print(f"[{count_exh}/5] Added Exhibition Ground: '{venue.name}' (Rent: Rs.{venue.price_per_day}/day)")

    print(f"\nAll {count_aud} Auditoriums & {count_exh} Exhibition Grounds added successfully under account: {email}")

if __name__ == "__main__":
    add_auditoriums_and_exhibitions()
