"""
================================================================================
AI-POWERED EVENT RECOMMENDATION SERVICE (Content-Based Filtering)
================================================================================
File: backend/events/recommendation_service.py

Description:
This module provides an AI-driven Content-Based Filtering recommendation engine
for EventsHub. It uses TF-IDF Vectorization and Cosine Similarity (via Scikit-Learn)
to analyze event attributes (title, description, category, location, venue details)
and matches them against a user's interaction history (confirmed bookings & wishlist items).

Key Features:
1. TF-IDF Feature Extraction: Converts event text (title, description, category, venue, location) into numerical feature vectors.
2. Cosine Similarity Calculation: Measures content similarity between events.
3. User Profile Weighting: Assigns higher weights to booked events (2.0) vs wishlist items (1.5).
4. Cold-Start Fallback: Automatically recommends top-rated & trending events if a user has no prior interaction history or is a guest visitor.
"""

import numpy as np
from django.db.models import Count, Avg, F, FloatField, ExpressionWrapper
from django.contrib.auth import get_user_model

# Import models
from events.models import Event, Booking, Wishlist

User = get_user_model()

def build_event_content_string(event):
    """
    Constructs a rich combined textual representation of an event.
    Combines: Title, Description, Category Name, Location, and Venue Name.
    """
    category_name = event.category.name if event.category else ""
    venue_name = event.venue.name if event.venue else ""
    venue_category = event.venue.category if event.venue else ""
    
    content = f"{event.title} {event.title} {category_name} {category_name} {event.location} {venue_name} {venue_category} {event.description}"
    return content.lower().strip()


def get_trending_or_popular_events(limit=5, exclude_ids=None):
    """
    Fallback function for Cold-Start problem (new users or guests).
    Ranks events based on ticket sales, rating average, and creation recency.
    """
    if exclude_ids is None:
        exclude_ids = []

    queryset = Event.objects.all()
    if exclude_ids:
        queryset = queryset.exclude(id__in=exclude_ids)

    # Sort by tickets_sold descending, rating_avg descending, and ID
    popular_events = list(queryset.order_by('-tickets_sold', '-created_at')[:limit])
    
    # If not enough events, return remaining available events
    if len(popular_events) < limit:
        remaining = list(Event.objects.exclude(id__in=[e.id for e in popular_events] + list(exclude_ids))[:limit - len(popular_events)])
        popular_events.extend(remaining)

    return popular_events[:limit]


def get_user_event_recommendations(user=None, limit=5):
    """
    Main entry point for generating AI event recommendations.
    
    Algorithm:
    1. Fetch all active events in the database.
    2. Check user interaction history (Bookings & Wishlist).
    3. If no history or user is unauthenticated, fallback to trending/popular events.
    4. Build TF-IDF matrix over event text features using Scikit-Learn.
    5. Calculate Cosine Similarity matrix between all events.
    6. Aggregate weighted similarity scores for events similar to user's history.
    7. Exclude already booked events and return the top `limit` recommendations.
    """
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
    except ImportError:
        # Fallback if scikit-learn is not installed in the runtime environment
        return get_trending_or_popular_events(limit=limit)

    all_events = list(Event.objects.filter(is_approved=True).select_related('category', 'venue'))
    total_events_count = len(all_events)

    # If database has very few events, return available events directly
    if total_events_count <= 2:
        return all_events[:limit]

    # Map event ID to matrix index
    event_id_to_idx = {event.id: idx for idx, event in enumerate(all_events)}

    # Step 1: Check user history if user is authenticated
    user_booked_event_ids = set()
    user_wishlist_event_ids = set()

    if user and user.is_authenticated:
        # User confirmed bookings
        user_booked_event_ids = set(
            Booking.objects.filter(user=user, status='confirmed')
            .values_list('event_id', flat=True)
        )
        # User wishlist items
        user_wishlist_event_ids = set(
            Wishlist.objects.filter(user=user)
            .values_list('event_id', flat=True)
        )

    # COLD-START: If user has no interaction history, return trending events
    has_history = len(user_booked_event_ids) > 0 or len(user_wishlist_event_ids) > 0
    if not has_history:
        return get_trending_or_popular_events(limit=limit)

    # Step 2: Extract text features and construct TF-IDF Matrix
    corpus = [build_event_content_string(event) for event in all_events]
    
    # Initialize TF-IDF Vectorizer with English stop words removal
    vectorizer = TfidfVectorizer(stop_words='english', min_df=1, ngram_range=(1, 2))
    tfidf_matrix = vectorizer.fit_transform(corpus)

    # Step 3: Calculate Pairwise Cosine Similarity Matrix
    # Shape: (total_events_count, total_events_count)
    cosine_sim_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

    # Step 4: Calculate aggregated recommendation scores for each event
    event_scores = np.zeros(total_events_count)

    # Weight factors: Booked events = 2.0 (strong intent), Wishlist = 1.5 (medium intent)
    BOOKING_WEIGHT = 2.0
    WISHLIST_WEIGHT = 1.5

    for event_id in user_booked_event_ids:
        if event_id in event_id_to_idx:
            idx = event_id_to_idx[event_id]
            event_scores += cosine_sim_matrix[idx] * BOOKING_WEIGHT

    for event_id in user_wishlist_event_ids:
        if event_id in event_id_to_idx:
            idx = event_id_to_idx[event_id]
            event_scores += cosine_sim_matrix[idx] * WISHLIST_WEIGHT

    # Step 5: Rank candidate events
    # Sort indices by score in descending order
    ranked_indices = np.argsort(event_scores)[::-1]

    recommended_events = []
    seen_ids = set()

    for idx in ranked_indices:
        # Only recommend highly relevant events (similarity score >= 1.0)
        if event_scores[idx] < 1.0:
            continue

        event = all_events[idx]
        
        # Skip events user has already booked (avoid recommending already purchased tickets)
        if event.id in user_booked_event_ids:
            continue

        # Avoid duplicates
        if event.id not in seen_ids:
            seen_ids.add(event.id)
            recommended_events.append(event)

        if len(recommended_events) >= limit:
            break

    # Step 6: If similarity results are fewer than limit, backfill with top popular events
    if len(recommended_events) < limit:
        backfill = get_trending_or_popular_events(
            limit=limit - len(recommended_events),
            exclude_ids=list(user_booked_event_ids | seen_ids)
        )
        recommended_events.extend(backfill)

    return recommended_events[:limit]
