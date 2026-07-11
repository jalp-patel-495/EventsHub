import os
import django
import random
from datetime import date, timedelta, time

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')
django.setup()

from django.contrib.auth import get_user_model
from events.models import Category, Event
from venues.models import Venue

User = get_user_model()

def clear_db():
    print("Clearing existing events, categories, and venues to prevent duplicates...")
    Event.objects.all().delete()
    Category.objects.all().delete()
    Venue.objects.all().delete()
    print("Database cleared!")

def setup_users():
    print("Checking default users...")
    organizer, _ = User.objects.get_or_create(
        email='organizer@example.com',
        defaults={
            'first_name': 'Event',
            'last_name': 'Organizer',
            'role': 'organizer',
            'is_approved': True,
            'is_active': True
        }
    )
    if not organizer.check_password('Password123!'):
        organizer.set_password('Password123!')
        organizer.save()

    owner, _ = User.objects.get_or_create(
        email='owner@example.com',
        defaults={
            'first_name': 'Venue',
            'last_name': 'Owner',
            'role': 'plot_owner',
            'is_approved': True,
            'is_active': True
        }
    )
    if not owner.check_password('Password123!'):
        owner.set_password('Password123!')
        owner.save()

    return organizer, owner

def setup_categories():
    print("Setting up event categories...")
    categories_data = [
        {"name": "Music & Concerts", "slug": "music-concerts"},
        {"name": "Sports & Fitness", "slug": "sports-fitness"},
        {"name": "Food & Drinks", "slug": "food-drinks"},
        {"name": "Tech & Conferences", "slug": "tech-conferences"},
        {"name": "Art & Theater", "slug": "art-theater"},
        {"name": "Festivals & Garba", "slug": "festivals-garba"},
        {"name": "Comedy Shows", "slug": "comedy-shows"},
    ]
    
    categories = {}
    for cat in categories_data:
        category, _ = Category.objects.get_or_create(
            name=cat["name"],
            defaults={"slug": cat["slug"]}
        )
        categories[cat["name"]] = category
    return categories

def setup_venues(owner):
    print("Setting up dummy venues...")
    venues_data = [
        {
            "name": "Karnavati Event Plot",
            "description": "Premium open-air lawns with state-of-the-art staging and lighting support.",
            "location": "S.G. Highway, Ahmedabad",
            "price_per_day": 75000.00,
            "facilities": ["Ample Parking", "Green Rooms", "Catering Service", "DJ Setup"],
            "has_catering": True,
            "catering_price_per_plate": 450.00,
            "has_dj": True,
            "dj_price": 15000.00,
            "has_decor": True,
            "decor_price": 25000.00,
        },
        {
            "name": "YMCA Event Ground",
            "description": "Massive sports and exhibition ground suitable for large-scale festivals and garba nights.",
            "location": "S.G. Highway, Vastrapur, Ahmedabad",
            "price_per_day": 120000.00,
            "facilities": ["Huge Parking", "Security Guards", "Restrooms", "CCTV", "VIP Lounge"],
            "has_catering": True,
            "catering_price_per_plate": 550.00,
            "has_dj": True,
            "dj_price": 25000.00,
            "has_decor": True,
            "decor_price": 40000.00,
        },
        {
            "name": "Science City Auditorium",
            "description": "Modern air-conditioned indoor auditorium perfect for technical summits and stage plays.",
            "location": "Sola, Ahmedabad",
            "price_per_day": 50000.00,
            "facilities": ["AC Hall", "Sound System", "Projector Screen", "Stage Lighting"],
            "has_catering": False,
            "has_dj": False,
            "has_decor": False,
        },
        {
            "name": "Royal Palace Lawn",
            "description": "Luxurious wedding and social gathering lawn with traditional decorations.",
            "location": "Sindhu Bhavan Road, Ahmedabad",
            "price_per_day": 95000.00,
            "facilities": ["Valet Parking", "Catering", "Luxurious Mandap", "AC Rooms"],
            "has_catering": True,
            "catering_price_per_plate": 600.00,
            "has_dj": True,
            "dj_price": 20000.00,
            "has_decor": True,
            "decor_price": 35000.00,
        }
    ]
    
    venues = []
    for v_data in venues_data:
        venue, _ = Venue.objects.get_or_create(
            name=v_data["name"],
            owner=owner,
            defaults={
                "description": v_data["description"],
                "location": v_data["location"],
                "price_per_day": v_data["price_per_day"],
                "facilities": v_data["facilities"],
                "is_approved": True,
                "has_catering": v_data["has_catering"],
                "catering_price_per_plate": v_data.get("catering_price_per_plate", 0.00),
                "has_dj": v_data["has_dj"],
                "dj_price": v_data.get("dj_price", 0.00),
                "has_decor": v_data["has_decor"],
                "decor_price": v_data.get("decor_price", 0.00),
            }
        )
        venues.append(venue)
    return venues

def generate_events(organizer, categories, venues):
    print("Generating events data...")
    
    # Event data mapping per category
    data_map = {
        "Music & Concerts": {
            "images": [
                "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
                "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500",
                "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500",
                "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500",
                "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500",
            ],
            "titles": [
                "Sunburn Club Night", "Arijit Singh Symphony", "Retro Bollywood Beats", 
                "Indie Rock Showcase", "Jazz under the Stars", "Electronic Music Festival", 
                "Sufi Night Live", "Metal Mania Concert", "Acoustic Pop Session", 
                "Hip Hop Block Party", "EDM Dance Arena", "Ghazal & Classical Evening", 
                "DJ Remix Festival", "Local Band Face-off", "Folk Fusion Evening"
            ],
            "desc": "Enjoy a spectacular evening of soul-stirring music, high energy, and amazing performances from local and international stars. Grab your tickets before they sell out!",
            "prices": [399.00, 599.00, 999.00, 1499.00, 2499.00],
            "capacity": [500, 1000, 2000, 5000]
        },
        "Sports & Fitness": {
            "images": [
                "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500",
                "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500",
                "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=500",
                "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500",
                "https://images.unsplash.com/photo-1552667466-07fdd0a48104?w=500",
            ],
            "titles": [
                "Ahmedabad Half Marathon", "Night Cricket Championship", "Cyclothon 2026", 
                "Yoga & Mindfulness Workshop", "CrossFit Open Challenge", "Badminton League", 
                "Futsal Cup Tournament", "Powerlifting Championship", "Zumba Dance Marathon", 
                "Self Defense Camp", "Skating Championship", "Table Tennis Open", 
                "Chess Grandmasters Meet", "Swimming Relay Gala", "Aerobics Fitness Festival"
            ],
            "desc": "Bring your energy and athletic spirit to the arena. Challenge your limits, keep fit, and compete with the best athletes in the city. Goodies and certificates for all participants!",
            "prices": [0.00, 199.00, 299.00, 499.00],
            "capacity": [100, 200, 500, 1000]
        },
        "Food & Drinks": {
            "images": [
                "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500",
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500",
                "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500",
                "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500",
                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500",
            ],
            "titles": [
                "Gujarati Thali Festival", "Street Food Carnival", "Chocolate Making Masterclass", 
                "Organic Food & Farm Expo", "Biryani & Kabab Fest", "Baking and Pastry Workshop", 
                "Mocktail Crafting Class", "Keto Diet Seminar", "Ice Cream & Waffle Fiesta", 
                "Pan-Asian Food Pop-Up", "Coffee Brewing Masterclass", "Dessert & Sweet Fair", 
                "Spicy Chili Challenge", "Italian Pizza Fest", "Healthy Vegan Feast"
            ],
            "desc": "A paradise for food lovers! Indulge in an exquisite culinary journey, taste delectable cuisines, and learn from top executive chefs. Includes unlimited food tasting sessions.",
            "prices": [299.00, 499.00, 799.00, 1299.00],
            "capacity": [150, 300, 500, 800]
        },
        "Tech & Conferences": {
            "images": [
                "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500",
                "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500",
                "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500",
                "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500",
                "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500",
            ],
            "titles": [
                "Gujarat Tech Summit 2026", "AI & Robotics Seminar", "Web Development Boot Camp", 
                "Startup Pitch Fest", "Cloud Computing Workshop", "Cybersecurity Bootcamp", 
                "Blockchain and Web3 Meetup", "UX/UI Design Conference", "Data Science Conference", 
                "Product Management Summit", "Digital Marketing Expo", "DevOps & SRE Meet", 
                "Mobile App Dev Forum", "IoT & Smart Devices Exhibition", "Tech Career Fair"
            ],
            "desc": "Join industry experts, top developers, and tech visionaries to explore emerging trends and hands-on developer workshops. Perfect for networking and career growth.",
            "prices": [0.00, 499.00, 999.00, 1999.00],
            "capacity": [100, 250, 400, 1000]
        },
        "Art & Theater": {
            "images": [
                "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500",
                "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500",
                "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=500",
                "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500",
                "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500",
            ],
            "titles": [
                "Acrylic Canvas Workshop", "Classical Drama Performance", "Pottery & Clay Art Session", 
                "Photography Exhibition", "Poetry Slam Evening", "Modern Art Showcase", 
                "Street Play Festival", "Calligraphy & Ink Workshop", "Handicraft & Origami Workshop", 
                "Sufi Dance & Sufism Art", "Puppet Theater Show", "Musical Drama Play", 
                "Solo Monologue Evening", "Graffiti Art Exhibition", "Abstract Art Gallery"
            ],
            "desc": "Unleash your creativity and immerse yourself in beautiful artistic expressions, live theatre acts, and dynamic art creation classes. All materials will be provided on-site.",
            "prices": [199.00, 399.00, 599.00, 899.00],
            "capacity": [50, 100, 150, 300]
        },
        "Festivals & Garba": {
            "images": [
                "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=500",
                "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=500",
                "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=500",
                "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500",
                "https://images.unsplash.com/photo-1496024840928-4c417adf211d?w=500",
            ],
            "titles": [
                "Pre-Navratri Garba Night", "Diwali Mela 2026", "Uttarayan Kite Festival", 
                "Holi Color Fest", "Janmashtami Utsav", "Traditional Garba Workshop", 
                "Rath Yatra Heritage Tour", "Garba Queens Championship", "Dussehra Dandiya Night", 
                "Navratri Sheri Garba", "Fusion Garba Night", "Sharad Poornima Garba", 
                "Kite Making Exhibition", "Diwali Diya Decoration", "Ganesh Chaturthi Utsav"
            ],
            "desc": "Celebrate our culture, colors, and heritage. Dust off your traditional wear and dance to the rhythm of live dhol and dakar. An unforgettable evening of joy and community celebration!",
            "prices": [200.00, 350.00, 500.00, 800.00],
            "capacity": [1000, 2000, 3000, 5000]
        },
        "Comedy Shows": {
            "images": [
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
                "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=500",
                "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=500",
                "https://images.unsplash.com/photo-1543584756-8f40a802e14f?w=500",
                "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=500",
            ],
            "titles": [
                "Standup Comedy Open Mic", "Best of Ahmedabad Standup", "Clean Family Comedy Show", 
                "Improv Comedy Night", "Sarcasm Unlimited Show", "Gujarati Standup Comedy", 
                "Relatable College Jokes", "Corporate Comedy Evening", "Laughter Club Special", 
                "Late Night Standup Hour", "Political Satire Special", "Double Trouble Improv", 
                "Silent Comedy Show", "Comedy Face-off Tour", "Storytelling & Comedy Combo"
            ],
            "desc": "Prepare for a night of non-stop laughter and humor as top national and local stand-up comedians perform their best observational jokes and hilarious crowd work.",
            "prices": [199.00, 299.00, 399.00, 499.00, 799.00],
            "capacity": [80, 150, 250, 500]
        }
    }
    
    locations = [
        "S.G. Highway, Ahmedabad",
        "Navrangpura, Ahmedabad",
        "Vastrapur, Ahmedabad",
        "Satellite, Ahmedabad",
        "Prahlad Nagar, Ahmedabad",
        "Sindhu Bhavan Road, Ahmedabad",
        "Nikol, Ahmedabad",
        "Maninagar, Ahmedabad",
        "Ghatlodia, Ahmedabad",
        "Chandkheda, Ahmedabad",
        "Bopal, Ahmedabad",
        "Riverfront Road, Ahmedabad",
        "C.G. Road, Ahmedabad",
        "Naranpura, Ahmedabad"
    ]
    
    times = [
        time(9, 0), time(10, 0), time(11, 0), time(14, 0),
        time(16, 0), time(17, 30), time(18, 0), time(19, 0),
        time(20, 0), time(20, 30)
    ]
    
    events_created = 0
    today = date.today()
    
    # Loop over categories
    for cat_name, info in data_map.items():
        category = categories[cat_name]
        
        # We need at least 15 events for this category
        for idx, title in enumerate(info["titles"]):
            # Generate random future date
            days_ahead = random.randint(3, 365)
            evt_date = today + timedelta(days=days_ahead)
            
            # Select random elements
            evt_time = random.choice(times)
            evt_price = random.choice(info["prices"])
            evt_total_tickets = random.choice(info["capacity"])
            
            # Generous tickets sold
            evt_tickets_sold = random.randint(0, min(evt_total_tickets // 3, 200))
            
            evt_desc = f"Welcome to {title}! {info['desc']}"
            evt_image = info["images"][idx % len(info["images"])]
            
            # Match random venue and use its location, or default to general location
            venue = random.choice(venues) if venues else None
            evt_location = venue.location if (venue and random.choice([True, False])) else random.choice(locations)
            
            Event.objects.create(
                title=title,
                description=evt_desc,
                date=evt_date,
                time=evt_time,
                location=evt_location,
                category=category,
                price=evt_price,
                tickets_total=evt_total_tickets,
                tickets_sold=evt_tickets_sold,
                image=evt_image,
                organizer=organizer,
                venue=venue,
                is_approved=True
            )
            events_created += 1
            
    print(f"Successfully generated {events_created} events across {len(categories)} categories!")

if __name__ == "__main__":
    clear_db()
    organizer, owner = setup_users()
    categories = setup_categories()
    venues = setup_venues(owner)
    generate_events(organizer, categories, venues)
    print("\nAll tasks completed! Database is fully populated with 100+ events.")
