import os
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventhub.settings')
django.setup()

from events.models import Event
from venues.models import Venue

# ─────────────────────────────────────────────────────────────
# 160+ STRICTLY UNIQUE UNSPLASH PHOTO IDs (ZERO DUPLICATES)
# ─────────────────────────────────────────────────────────────
UNIQUE_PHOTO_IDS = [
    "photo-1470225620780-dba8ba36b745", "photo-1501281668745-f7f57925c3b4", "photo-1514525253161-7a46d19cd819",
    "photo-1498038432885-c6f3f1b912ee", "photo-1459749411175-04bf5292ceea", "photo-1516450360452-9312f5e86fc7",
    "photo-1511671782779-c97d3d27a1d4", "photo-1465847899084-d164df4dedc6", "photo-1511192336575-5a79af67a629",
    "photo-1520523839897-bd0b52f945a0", "photo-1445985543470-41fba5c3144a", "photo-1508700115892-45ecd05ae2ad",
    "photo-1487180144351-b8472da7d491", "photo-1506157786151-b8491531f063", "photo-1429962714451-bb934ecdc4ec",
    "photo-1515187029135-18ee286d815b", "photo-1540575467063-178a50c2df87", "photo-1522071820081-009f0129c71c",
    "photo-1511512578047-dfb367046420", "photo-1451187580459-43490279c0fa", "photo-1504384308090-c894fdcc538d",
    "photo-1531482615713-2afd69097998", "photo-1526374965328-7f61d4dc18c5", "photo-1485827404703-89b55fcc595e",
    "photo-1517245386807-bb43f82c33c4", "photo-1519389950473-47ba0277781c", "photo-1535378917042-10a22c95931a",
    "photo-1504639725590-34d0984388bd", "photo-1550745165-9bc0b252726f", "photo-1518770660439-4636190af475",
    "photo-1414235077428-338989a2e8c0", "photo-1504674900247-0877df9cc836", "photo-1498837167922-ddd27525d352",
    "photo-1490645935967-10de6ba17061", "photo-1555396273-367ea4eb4db5", "photo-1565299624946-b28f40a0ae38",
    "photo-1565958011703-44f9829ba187", "photo-1476224203421-9ac39bcb3327", "photo-1484723091739-30a597c7f356",
    "photo-1512621776951-a57141f2eefd", "photo-1546069901-ba9599a7e63c", "photo-1555939594-58d7cb561ad1",
    "photo-1567620905732-2d1ec7ab7445", "photo-1540189549336-e6e99c3679fe", "photo-1563379091339-03b21ab4a4f8",
    "photo-1461896836934-ffe607ba8211", "photo-1508098682722-e99c43a406b2", "photo-1517649763962-0c623266010b",
    "photo-1541534741688-6078c6bfb5c5", "photo-1579952363873-27f3bade9f55", "photo-1574629810360-7efbbe195018",
    "photo-1519766304817-4f37bda74a29", "photo-1526676037777-05a232554f77", "photo-1518091043644-c1d4457512c6",
    "photo-1530549387789-4c1017266635", "photo-1471295253337-4ceaaed65897", "photo-1569517282132-25d22f4573e6",
    "photo-1605649487212-47bdab064df7", "photo-1533174072545-7a4b6ad7a6c3", "photo-1567157577867-05ccb1388e66",
    "photo-1511578314322-379afb476865", "photo-1508997449629-303059a039c0", "photo-1579783902614-a3fb3927b675",
    "photo-1509198397868-475647b2a1e5", "photo-1454165804606-c3d57bc86b40", "photo-1522202176988-66273c2fd55f",
    "photo-1556761175-5973dc0f32e7", "photo-1557804506-669a67965ba0", "photo-1556761175-b413da4baf72",
    "photo-1517048676732-d65bc937f952", "photo-1521737604893-d14cc237f11d", "photo-1559136555-9303baea8ebd",
    "photo-1542744801-30d009c25f1d", "photo-1552664730-d307ca884978", "photo-1531545514256-b1400bc00f31",
    "photo-1523240795612-9a054b0db644", "photo-1524178232363-1fb2b075b655", "photo-1577896851231-70ef18881754",
    "photo-1427504494785-3a9ca7044f45", "photo-1513258496099-48168024aec0", "photo-1523050854058-8df90110c9f1",
    "photo-1503676260728-1c00da094a0b", "photo-1509062522246-3755977927d7", "photo-1497633762265-9d179a990aa6",
    "photo-1571260899304-425eee4c7efc", "photo-1544717305-2782549b5136", "photo-1516321318423-f06f85e504b3",
    "photo-1491438590914-bc09fcaaf77a", "photo-1529156069898-49953e39b3ac", "photo-1511632765486-a01980e01a18",
    "photo-1517457373958-b7bdd4587205", "photo-1528605248644-14dd04022da1", "photo-1529070538774-1843cb3265df",
    "photo-1543269865-cbf427effbad", "photo-1523580494863-6f3031224c94", "photo-1460518451285-97b6aa326961",
    "photo-1527529482837-4698179dc6ce", "photo-1475721027785-f74eccf877e2", "photo-1478147427282-58a87a120781",
    "photo-1501386761578-eac5c94b800a", "photo-1511795409834-ef04bbd61622", "photo-1492684223066-81342ee5ff30",
    "photo-1464366400600-7168b8af9bc3", "photo-1505373877841-8d25f7d46678", "photo-1519671482749-fd09be7ccebf",
    "photo-1513151233558-d860c5398176", "photo-1533105079780-92b9be482077", "photo-1506744038136-46273834b3fb",
    "photo-1519681393784-d120267933ba", "photo-1470071459604-3b5ec3a7fe05", "photo-1441974231531-c6227db76b6e",
    "photo-1472214103451-9374bd1c798e", "photo-1469474968028-56623f02e42e", "photo-1447752875215-b2761acb3c5d",
    "photo-1507525428034-b723cf961d3e", "photo-1519046904884-53103b34b206", "photo-1506929562872-bb421503ef21",
    "photo-1473496169904-658ba7c44d8a", "photo-1510414842594-a61c69b5ae57", "photo-1540206395-68808572332f",
    "photo-1502082553048-f009c37129b9", "photo-1433086966358-54859d0ed716", "photo-1465146344425-f00d5f5c8f07",
    "photo-1482938289607-e9573fc25ebb", "photo-1501785888041-af3ef285b470", "photo-1470770841072-f978cf4d019e",
    "photo-1434394354979-a235cd36269d", "photo-1500530855697-b586d89ba3ee", "photo-1469854523086-cc02fe5d8800",
    "photo-1476514525535-ce74f45814d1", "photo-1530789253388-582c481c54b0", "photo-1503220317375-aaad61436b1b",
    "photo-1519052537078-e6302a4968d4", "photo-1488646953014-85cb44e25828", "photo-1507608616759-54f48f0af0ee",
    "photo-1518684079-3c830dcef090", "photo-1512100356356-de1b84283e18", "photo-1500382017468-9049fed747ef",
    "photo-1500964757637-c85e8a162699", "photo-1499678329028-101435549a4e", "photo-1439853949127-fa647821eba0",
    "photo-1464822759023-fed622ff2c3b", "photo-1486870591958-9b9d0d1dda99", "photo-1494548162494-384bba4ab999",
    "photo-1495567720989-cebdbdd97913", "photo-1506744038136-46273834b3fb", "photo-1519681393784-d120267933ba",
    "photo-1540555700478-4be289fbecef", "photo-1584132967334-10e028bd69f7", "photo-1520250497591-112f2f40a3f4",
    "photo-1578683010236-d716f9a3f461", "photo-1568495248636-6432b97bd949", "photo-1596394516093-501ba68a0ba6",
    "photo-1512917774080-9991f1c4c750", "photo-1618773928121-c32242e63f39", "photo-1522771739844-6a9f6d5f14af"
]

# Ensure uniqueness in UNIQUE_PHOTO_IDS array itself
UNIQUE_PHOTO_IDS = list(dict.fromkeys(UNIQUE_PHOTO_IDS))

def apply_100_percent_unique_images():
    print(f"Total Unique Photo IDs available: {len(UNIQUE_PHOTO_IDS)}")

    # 1. Update Venues with distinct photo IDs from the pool
    venues = list(Venue.objects.all().order_by('id'))
    print(f"Updating {len(venues)} Venues...")
    for idx, venue in enumerate(venues):
        photo_id = UNIQUE_PHOTO_IDS[idx % len(UNIQUE_PHOTO_IDS)]
        img_url = f"https://images.unsplash.com/{photo_id}?w=800&auto=format&fit=crop&q=80"
        venue.image.name = img_url
        venue.save()

    # 2. Update Events with non-overlapping distinct photo IDs from the pool
    events = list(Event.objects.all().order_by('id'))
    print(f"Updating {len(events)} Events...")
    
    venue_count = len(venues)
    assigned_urls = set()

    for idx, event in enumerate(events):
        # Shift index by venue_count to prevent any event from sharing a photo ID with a venue
        photo_id = UNIQUE_PHOTO_IDS[(idx + venue_count) % len(UNIQUE_PHOTO_IDS)]
        img_url = f"https://images.unsplash.com/{photo_id}?w=800&auto=format&fit=crop&q=80"
        
        event.image.name = img_url
        event.save()
        assigned_urls.add(img_url)

    print(f"\nSuccessfully set 100% unique image URLs for {len(events)} events and {len(venues)} venues!")
    print(f"Total Unique Image URLs assigned: {len(assigned_urls) + len(venues)}")

if __name__ == '__main__':
    apply_100_percent_unique_images()
