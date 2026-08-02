import os
# Add parent directory to sys.path to resolve django settings and apps
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')
django.setup()

from venues.models import Venue

# ─────────────────────────────────────────────────────────────
# CATEGORY-MATCHED HIGH-DEFINITION UNSPLASH IMAGES FOR VENUES
# ─────────────────────────────────────────────────────────────
CATEGORY_VENUE_IMAGES = {
    # 🏰 Party Plot / Lawn (Open-air, gardens, wedding illuminations)
    "Party Plot / Lawn": [
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80"
    ],
    
    # 🏛️ Banquet Hall & Luxury Villa (Indoor chandeliers, dining, stage)
    "Banquet Hall": [
        "https://images.unsplash.com/photo-1545232979-fbf34fe37b38?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop&q=80"
    ],
    "Luxury Villa & Lawn": [
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80"
    ],

    # 🎭 Auditorium & Convention Center (Stage lights, indoor seating, theater halls)
    "Auditorium & Convention Center": [
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1438283173091-5dbf5c5a3206?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80"
    ],

    # 🎪 Exhibition Ground (Trade pavilions, large outdoor domes, expos)
    "Exhibition Ground": [
        "https://images.unsplash.com/photo-1508997449629-303059a039c0?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80"
    ],
    "Exhibition Ground & Lawn": [
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80"
    ],

    # 🏊 Resort / Farmhouse Lawn (Pools, golf clubs, palm trees, farmhouses)
    "Resort / Farmhouse Lawn": [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80"
    ]
}

def update_venues_by_category():
    print("====================================================")
    print(" Updating Category-Specific Images for all Venues   ")
    print("====================================================")

    # First, fix Science City Auditorium category if needed
    sc_aud = Venue.objects.filter(name__icontains="Science City Auditorium").first()
    if sc_aud:
        sc_aud.category = "Auditorium & Convention Center"
        sc_aud.save()
        print("Updated Science City Auditorium category to 'Auditorium & Convention Center'.")

    venues = Venue.objects.all().order_by('category', 'id')
    category_counters = {}

    for idx, venue in enumerate(venues):
        cat = venue.category.strip()
        pool = CATEGORY_VENUE_IMAGES.get(cat, CATEGORY_VENUE_IMAGES["Party Plot / Lawn"])
        
        counter = category_counters.get(cat, 0)
        img_url = pool[counter % len(pool)]
        category_counters[cat] = counter + 1

        venue.image.name = img_url
        venue.save()
        print(f"[{idx+1}/{len(venues)}] Category: '{cat:32}' | Venue: '{venue.name}' -> Image Set!")

    print("\nSuccessfully updated all venue images matching their exact categories!")
    print("====================================================")

if __name__ == "__main__":
    update_venues_by_category()
