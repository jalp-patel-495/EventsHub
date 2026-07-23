import json
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def broadcast_ticket_purchase(booking):
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            buyer_name = f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.email.split('@')[0]
            # Obfuscate email if name is not set
            if "@" in buyer_name or len(buyer_name) > 15:
                buyer_name = buyer_name[:3] + "***" + (buyer_name[buyer_name.find("@"):] if "@" in buyer_name else "")
                
            async_to_sync(channel_layer.group_send)(
                "live_tickets",
                {
                    "type": "ticket_purchased",
                    "data": {
                        "booking_id": booking.id,
                        "event_id": booking.event.id,
                        "event_title": booking.event.title,
                        "buyer_name": buyer_name,
                        "tickets_count": booking.tickets_count,
                        "price": float(booking.total_price),
                        "timestamp": booking.created_at.isoformat() if booking.created_at else None,
                    }
                }
            )
    except Exception as e:
        print(f"Error broadcasting ticket purchase: {e}")
