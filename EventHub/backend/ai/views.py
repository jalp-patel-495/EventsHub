import json
from decimal import Decimal
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count
from django.utils import timezone

from events.models import Event, Booking, Category, Wishlist
from venues.models import Venue
from .services import call_ai_api

class AIChatbotView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        user_message = request.data.get("message", "").strip()
        if not user_message:
            return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Gather system context
        user = request.user
        context_parts = []
        
        # 1. Add User context if authenticated
        if user and user.is_authenticated:
            context_parts.append(f"User email: {user.email}")
            context_parts.append(f"User name: {user.first_name} {user.last_name}")
            context_parts.append(f"User role: {user.role}")
            
            # Fetch active bookings
            bookings = Booking.objects.filter(user=user).select_related('event')
            if bookings.exists():
                context_parts.append("User's Bookings:")
                for b in bookings:
                    context_parts.append(
                        f"- {user.email} booked {b.tickets_count} tickets for event '{b.event.title}' "
                        f"on date {b.event.date}. Booking status is {b.status} and payment status is {b.payment_status}."
                    )
            else:
                context_parts.append("User has no current bookings.")
        else:
            context_parts.append("User is a non-authenticated Guest.")

        # 2. Add Event context (up to 5 upcoming listings)
        upcoming_events = Event.objects.filter(date__gte=timezone.now().date()).order_by('date')[:5]
        if upcoming_events.exists():
            context_parts.append("Upcoming Events available in Ahmedabad:")
            for e in upcoming_events:
                context_parts.append(
                    f"- '{e.title}' under category '{e.category.name}' on {e.date} at {e.location}. "
                    f"Price is ₹{e.price}. Remaining tickets: {e.tickets_total - e.tickets_sold}."
                )
        
        # 3. Add Venue context (up to 3 plots)
        venues = Venue.objects.all()[:3]
        if venues.exists():
            context_parts.append("Available Party Plots and Venues:")
            for v in venues:
                context_parts.append(
                    f"- '{v.name}' located in {v.location}. Price per day: ₹{v.price_per_day}. Facilities: {', '.join(v.facilities)}."
                )

        # Assemble full system prompt
        context_str = "\n".join(context_parts)
        system_instruction = (
            "You are the senior AI support assistant for 'Ahmedabad Event Hub' portal.\n"
            "You must assist users with FAQs, venue discovery, booking checks, and directions.\n"
            "Keep answers concise, professional, and formatted in clean GitHub-style Markdown.\n"
            "Use the provided database context to give accurate answers. Do not reveal raw user ids."
        )
        
        prompt = (
            f"Database Context:\n{context_str}\n\n"
            f"User Question: {user_message}\n\n"
            f"Assistant Response:"
        )

        ai_response = call_ai_api(prompt, system_instruction)
        return Response({"reply": ai_response}, status=status.HTTP_200_OK)


class AIRecommendationsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        
        # 1. Fetch user categories of interest based on past bookings and wishlists
        booked_categories = Booking.objects.filter(user=user).values_list('event__category_id', flat=True)
        wishlisted_categories = Wishlist.objects.filter(user=user).values_list('event__category_id', flat=True)
        
        category_ids = list(set(list(booked_categories) + list(wishlisted_categories)))
        
        # If no explicit category interest, load top categories
        if not category_ids:
            category_ids = list(Category.objects.all().values_list('id', flat=True)[:2])

        # 2. Query recommended events (excluding already booked ones)
        booked_event_ids = Booking.objects.filter(user=user).values_list('event_id', flat=True)
        recommended_events = Event.objects.filter(
            category_id__in=category_ids,
            date__gte=timezone.now().date()
        ).exclude(id__in=booked_event_ids).order_by('date')[:3]

        # If empty, fallback to general upcoming events
        if not recommended_events.exists():
            recommended_events = Event.objects.filter(date__gte=timezone.now().date()).order_by('date')[:3]

        # 3. Query recommended venues
        recommended_venues = Venue.objects.all().order_by('?')[:2]

        # 4. Generate reasoning text using AI service
        events_str = ", ".join([f"'{e.title}' ({e.category.name})" for e in recommended_events])
        venues_str = ", ".join([f"'{v.name}' in {v.location}" for v in recommended_venues])
        
        prompt = (
            f"Generate a friendly, brief personalized recommendation reasoning paragraph (max 3 sentences) "
            f"for a customer named {user.first_name}. "
            f"We are suggesting the following events: {events_str}; and venues: {venues_str}."
        )
        system_instruction = "You are a personalized recommendation agent. Generate a concise, engaging reasoning summary."
        
        reasoning = call_ai_api(prompt, system_instruction)

        # 5. Format response data
        from events.serializers import EventSerializer
        from venues.serializers import VenueSerializer
        
        # We need simple serialization. If full serializers fail due to missing context, we can manual serialize.
        # Let's import serializers safely.
        try:
            from events.serializers import EventSerializer
            events_data = EventSerializer(recommended_events, many=True, context={'request': request}).data
        except Exception:
            events_data = [{"id": e.id, "title": e.title, "price": str(e.price), "location": e.location, "date": str(e.date)} for e in recommended_events]
            
        try:
            from venues.serializers import VenueSerializer
            venues_data = VenueSerializer(recommended_venues, many=True, context={'request': request}).data
        except Exception:
            venues_data = [{"id": v.id, "name": v.name, "location": v.location, "price_per_day": str(v.price_per_day)} for v in recommended_venues]

        return Response({
            "events": events_data,
            "venues": venues_data,
            "reasoning": reasoning
        }, status=status.HTTP_200_OK)


class AIEventDescriptionView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        if request.user.role != 'organizer' and request.user.role != 'admin':
            return Response({"error": "Only organizers can access description generator."}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get("title", "").strip()
        category = request.data.get("category", "").strip()
        keywords = request.data.get("keywords", "").strip()

        if not title or not category:
            return Response({"error": "Title and Category are required parameters."}, status=status.HTTP_400_BAD_REQUEST)

        prompt = (
            f"Generate a professional, exciting, and markdown-formatted description for an event titled '{title}' "
            f"in the category '{category}' with keywords '{keywords}'. "
            f"Also generate a string of SEO meta tags and a list of keywords. "
            f"Format the response strictly as a JSON object with keys: 'description', 'seo_tags', and 'keywords'."
        )
        system_instruction = "You are a marketing AI. Output JSON containing event description, SEO tags, and list of keywords."
        
        raw_reply = call_ai_api(prompt, system_instruction)
        
        # Parse JSON reply cleanly
        try:
            # Strip any markdown code wrapper blocks if present
            cleaned_reply = raw_reply.strip()
            if cleaned_reply.startswith("```json"):
                cleaned_reply = cleaned_reply[7:]
            if cleaned_reply.endswith("```"):
                cleaned_reply = cleaned_reply[:-3]
            cleaned_reply = cleaned_reply.strip()
            
            data = json.loads(cleaned_reply)
        except Exception:
            # Fallback if raw parse failed
            data = {
                "description": raw_reply,
                "seo_tags": f"<meta name=\"description\" content=\"{title}\" />",
                "keywords": [keywords, "Ahmedabad", category]
            }

        return Response(data, status=status.HTTP_200_OK)


class AIAnalyticsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        
        # Organizer or Admin check
        if user.role not in ['organizer', 'admin']:
            return Response({"error": "Unauthorized access."}, status=status.HTTP_403_FORBIDDEN)

        # Gather base analytics metrics
        if user.role == 'organizer':
            events = Event.objects.filter(organizer=user)
        else:
            events = Event.objects.all()

        total_listings = events.count()
        
        if total_listings == 0:
            return Response({
                "revenue_prediction": "No event listings detected to run forecasts.",
                "attendance_prediction": "No listings to analyze attendance run rates.",
                "popular_categories": ["Music", "Exhibitions"],
                "insights": ["Heuristic Tip: Create your first event listing to unlock predictive revenue analytics!"]
            }, status=status.HTTP_200_OK)

        # Compute aggregates
        bookings = Booking.objects.filter(event__in=events, status='confirmed')
        total_revenue = bookings.aggregate(Sum('total_price'))['total_price__sum'] or Decimal('0.00')
        tickets_sold = bookings.aggregate(Sum('tickets_count'))['tickets_count__sum'] or 0
        total_capacity = events.aggregate(Sum('tickets_total'))['tickets_total__sum'] or 0
        
        # 1. Heuristic Revenue Projection
        # Multiply current revenue by capacity factor with a modest decay weight
        sellout_rate = tickets_sold / total_capacity if total_capacity > 0 else 0
        predicted_revenue = total_revenue * Decimal('1.25') if sellout_rate > 0.5 else total_revenue * Decimal('1.1')
        
        # 2. Heuristic Attendance Projection
        predicted_attendance_rate = min(100, int(sellout_rate * 100 * 1.15)) if sellout_rate > 0 else 50
        
        # Fetch categories
        trending_categories = list(events.values('category__name').annotate(count=Count('id')).order_by('-count')[:3].values_list('category__name', flat=True))

        # Generate insights dynamically with AI
        prompt = (
            f"Analyze these metrics for Ahmedabad Event Hub listings:\n"
            f"- Total listings: {total_listings}\n"
            f"- Current Confirmed Revenue: ₹{total_revenue}\n"
            f"- Tickets Sold: {tickets_sold}/{total_capacity} (Sellout rate: {sellout_rate:.2f})\n"
            f"Generate a JSON object containing:\n"
            f"1. 'revenue_prediction': A text description of revenue forecast.\n"
            f"2. 'attendance_prediction': A text description of attendance run rates.\n"
            f"3. 'insights': A list of 2 actionable tips/insights to boost bookings."
        )
        system_instruction = "You are a business analytics advisor. Output strictly JSON with keys: 'revenue_prediction', 'attendance_prediction', 'insights'."
        
        raw_reply = call_ai_api(prompt, system_instruction)
        
        try:
            cleaned_reply = raw_reply.strip()
            if cleaned_reply.startswith("```json"):
                cleaned_reply = cleaned_reply[7:]
            if cleaned_reply.endswith("```"):
                cleaned_reply = cleaned_reply[:-3]
            cleaned_reply = cleaned_reply.strip()
            
            data = json.loads(cleaned_reply)
        except Exception:
            data = {
                "revenue_prediction": f"Forecasted revenue is ₹{predicted_revenue:.2f} based on current sell-out speed.",
                "attendance_prediction": f"Attendance run rate is estimated at {predicted_attendance_rate}% capacity.",
                "insights": [
                    "Promotional Heuristic: Tickets are selling at a stable pace. Implement early bird pricing on your next listing.",
                    "Review insight: Food and cultural festivals have the fastest sell-out velocity."
                ]
            }

        response_payload = {
            "total_revenue": float(total_revenue),
            "tickets_sold": tickets_sold,
            "total_capacity": total_capacity,
            "predicted_revenue": float(predicted_revenue),
            "predicted_attendance_rate": predicted_attendance_rate,
            "popular_categories": trending_categories if trending_categories else ["Entertainment"],
            "revenue_prediction": data.get("revenue_prediction"),
            "attendance_prediction": data.get("attendance_prediction"),
            "insights": data.get("insights")
        }

        return Response(response_payload, status=status.HTTP_200_OK)


class AICateringPlannerView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        action_type = request.data.get("action", "menu_recommendation").strip()
        event_type = request.data.get("event_type", "Wedding").strip()
        guest_count = int(request.data.get("guest_count", 100))
        budget = float(request.data.get("budget", 50000))
        cuisine_type = request.data.get("cuisine_type", "Gujarati").strip()

        if action_type == "menu_recommendation":
            prompt = (
                f"Suggest a personalized catering menu for a {event_type} event with {guest_count} guests "
                f"and a budget of ₹{budget}. The preferred cuisine is {cuisine_type}. "
                f"Recommend standard appetizers, main courses, desserts, and beverage choices. "
                f"Format the output strictly as a JSON object with keys: 'appetizers', 'mains', 'desserts', 'beverages', 'reason'."
            )
            system_instruction = "You are an expert catering chef advisor. Output strictly JSON containing list of food suggestions and reasoning."
            raw_reply = call_ai_api(prompt, system_instruction)
            try:
                data = json.loads(self.clean_json(raw_reply))
            except Exception:
                data = {
                    "appetizers": ["Paneer Tikka", "Hara Bhara Kabab", "Spring Rolls"],
                    "mains": ["Paneer Butter Masala", "Dal Makhani", "Veg Pulao", "Butter Naan", "Gujarati Kadhi-Khichdi"],
                    "desserts": ["Gulab Jamun", "Sizzling Brownie", "Kesar Pista Ice Cream"],
                    "beverages": ["Masala Chaas", "Mint Mojito", "Fruit Punch"],
                    "reason": f"A rich selection of premium {cuisine_type} items tailored for a budget-friendly {event_type}."
                }
            return Response(data, status=status.HTTP_200_OK)

        elif action_type == "quantity_estimation":
            prompt = (
                f"Estimate the food quantity needed to serve {guest_count} guests at a {event_type} event. "
                f"Provide details on raw ingredients needed (e.g. rice in kg, flour in kg, vegetables, milk/dairy, sweets) "
                f"and portion sizes to ensure zero wastage. "
                f"Format the output strictly as a JSON object with keys: 'raw_ingredients' (list of items with quantities), 'portion_sizes' (list of guidelines), 'tips' (list of wastage reduction tips)."
            )
            system_instruction = "You are a professional catering quantity planner. Output strictly JSON with keys 'raw_ingredients', 'portion_sizes', and 'tips'."
            raw_reply = call_ai_api(prompt, system_instruction)
            try:
                data = json.loads(self.clean_json(raw_reply))
            except Exception:
                rice_kg = round(guest_count * 0.15, 1)
                paneer_kg = round(guest_count * 0.08, 1)
                roti_count = guest_count * 3
                dessert_pieces = int(guest_count * 1.5)
                data = {
                    "raw_ingredients": [
                        {"item": "Basmati Rice", "quantity": f"{rice_kg} kg"},
                        {"item": "Paneer (Cottage Cheese)", "quantity": f"{paneer_kg} kg"},
                        {"item": "Wheat Flour (for Rotis)", "quantity": f"{round(guest_count * 0.1, 1)} kg"},
                        {"item": "Mixed Vegetables", "quantity": f"{round(guest_count * 0.12, 1)} kg"},
                        {"item": "Dal/Lentils", "quantity": f"{round(guest_count * 0.05, 1)} kg"},
                        {"item": "Cooking Oil / Ghee", "quantity": f"{round(guest_count * 0.03, 1)} kg"},
                        {"item": "Sweet Items (Gulab Jamun, etc.)", "quantity": f"{dessert_pieces} pieces"}
                    ],
                    "portion_sizes": [
                        "Rice: 150g per guest",
                        "Paneer Main Curry: 100g per guest",
                        "Bread/Roti: 3 pieces per guest",
                        "Appetizers: 2.5 pieces per guest"
                    ],
                    "tips": [
                        "Keep starters light to prevent heavy wastage of main course items.",
                        "If hosting a buffet, use smaller plate sizes to discourage guests from over-portioning."
                    ]
                }
            return Response(data, status=status.HTTP_200_OK)

        elif action_type == "budget_planner":
            prompt = (
                f"Create a detailed catering budget plan for a {event_type} event with {guest_count} guests "
                f"and an allocated catering budget of ₹{budget}. "
                f"Suggest a cost breakdown for Plate Costs, Staff & Service, Decoration, Beverage/Mocktail stalls, and Contingency. "
                f"Format the output strictly as a JSON object with keys: 'breakdown' (list of objects containing item, percentage, cost), 'summary'."
            )
            system_instruction = "You are a professional wedding and event catering budget planner. Output strictly JSON with keys 'breakdown' and 'summary'."
            raw_reply = call_ai_api(prompt, system_instruction)
            try:
                data = json.loads(self.clean_json(raw_reply))
            except Exception:
                data = {
                    "breakdown": [
                        {"item": "Catering Plate Cost (Food)", "percentage": "60%", "cost": f"₹{int(budget * 0.6)}"},
                        {"item": "Service Staff & Waiters", "percentage": "15%", "cost": f"₹{int(budget * 0.15)}"},
                        {"item": "Catering Decor & Stall Layouts", "percentage": "10%", "cost": f"₹{int(budget * 0.1)}"},
                        {"item": "Mocktails & Live Stalls", "percentage": "8%", "cost": f"₹{int(budget * 0.08)}"},
                        {"item": "Contingency / Emergency buffer", "percentage": "7%", "cost": f"₹{int(budget * 0.07)}"}
                    ],
                    "summary": f"This plan allocates ₹{int(budget * 0.6)} to food plates, offering roughly ₹{int((budget * 0.6) / guest_count)} per plate budget for {guest_count} guests."
                }
            return Response(data, status=status.HTTP_200_OK)

        return Response({"error": "Invalid action parameter."}, status=status.HTTP_400_BAD_REQUEST)

    def clean_json(self, raw):
        cleaned = raw.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return cleaned.strip()
