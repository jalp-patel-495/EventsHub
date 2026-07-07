from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import date, timedelta
from decimal import Decimal

from .models import Venue, VenueBooking

User = get_user_model()

class VenueTests(APITestCase):
    def setUp(self):
        # Create users
        self.owner = User.objects.create_user(
            email='owner@example.com', password='Password123!', 
            first_name='Owner', last_name='User', role='plot_owner'
        )
        self.owner.is_active = True
        self.owner.save()

        self.organizer = User.objects.create_user(
            email='org@example.com', password='Password123!', 
            first_name='Org', last_name='User', role='organizer'
        )
        self.organizer.is_active = True
        self.organizer.save()

        # Create Venue
        self.venue = Venue.objects.create(
            name='Green Lawn',
            description='Perfect garden venue',
            location='SG Highway',
            price_per_day=Decimal('5000.00'),
            facilities=["Parking", "Stage"],
            owner=self.owner,
            is_approved=True
        )

        self.venue_list_url = reverse('venue-list')
        self.booking_list_url = reverse('venue_booking_list')

    def test_list_venues(self):
        response = self.client.get(self.venue_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_venue_permissions(self):
        url = self.venue_list_url
        data = {
            'name': 'Royal Hall',
            'description': 'Luxurious indoor hall',
            'location': 'Sindhu Bhavan',
            'price_per_day': '8000.00',
            'facilities': ["AC", "Restrooms"]
        }

        # Anonymous cannot create
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Organizer cannot create
        self.client.force_authenticate(user=self.organizer)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Plot owner can create
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_venue_booking_flow(self):
        self.client.force_authenticate(user=self.organizer)
        
        # 1. Request venue booking
        start = date.today() + timedelta(days=5)
        end = start + timedelta(days=2) # 3 days total
        
        booking_data = {
            'venue': self.venue.id,
            'start_date': str(start),
            'end_date': str(end)
        }
        
        response = self.client.post(self.booking_list_url, booking_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['total_price'], '15000.00') # 5000 * 3
        self.assertEqual(response.data['status'], 'pending')
        
        booking_id = response.data['id']

        # 2. Owner approves
        self.client.force_authenticate(user=self.owner)
        action_url = reverse('venue_booking_action', args=[booking_id, 'approve'])
        response = self.client.post(action_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'approved')

        # 3. Verify duplicate approved booking fails
        self.client.force_authenticate(user=self.organizer)
        response = self.client.post(self.booking_list_url, booking_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
