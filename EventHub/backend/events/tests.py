from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import date, time, timedelta
from decimal import Decimal

from .models import Category, Event, Booking, Wishlist, Review, Coupon

User = get_user_model()

class EventTests(APITestCase):
    def setUp(self):
        # Create users
        self.organizer = User.objects.create_user(
            email='org@example.com', password='Password123!', 
            first_name='Org', last_name='User', role='organizer'
        )
        self.organizer.is_active = True
        self.organizer.save()

        self.customer = User.objects.create_user(
            email='cust@example.com', password='Password123!', 
            first_name='Cust', last_name='User', role='customer'
        )
        self.customer.is_active = True
        self.customer.save()

        # Create Category
        self.category = Category.objects.create(name='Tech', slug='tech')

        # Create Event
        self.event = Event.objects.create(
            title='Tech Talk',
            description='Let\'s discuss AI',
            date=date.today(),
            time=time(18, 0),
            location='Ahmedabad',
            category=self.category,
            price=Decimal('100.00'),
            tickets_total=50,
            organizer=self.organizer,
            is_approved=True
        )

        # Create Coupon
        self.coupon = Coupon.objects.create(
            code='SAVE20',
            discount_percent=20,
            active=True,
            valid_until=date.today() + timedelta(days=1)
        )

        self.event_list_url = reverse('event-list')
        self.booking_list_url = reverse('booking_list')

    def test_list_events(self):
        response = self.client.get(self.event_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_search_and_filter_events(self):
        response = self.client.get(f"{self.event_list_url}?search=Tech")
        self.assertEqual(response.data['count'], 1)

        response = self.client.get(f"{self.event_list_url}?search=Music")
        self.assertEqual(response.data['count'], 0)

    def test_create_event_permissions(self):
        url = self.event_list_url
        data = {
            'title': 'Hackathon',
            'description': 'Coding code code',
            'date': '2026-10-10',
            'time': '10:00:00',
            'location': 'Ahmedabad',
            'category': self.category.id,
            'price': '10.00',
            'tickets_total': 100
        }

        # Anonymous cannot create
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Customer cannot create
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Organizer can create
        self.client.force_authenticate(user=self.organizer)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_booking_order_flow(self):
        self.client.force_authenticate(user=self.customer)
        book_url = reverse('event_book', args=[self.event.id])
        
        # Book 5 tickets (Base Price: 100 each -> Total: 500)
        # Without coupon
        response = self.client.post(book_url, {'tickets_count': 5})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['booking']['total_price'], '500.00')
        self.assertEqual(response.data['booking']['status'], 'pending')
        self.assertIn('razorpay_order_id', response.data)

        # Try applying Coupon
        response2 = self.client.post(book_url, {'tickets_count': 5, 'coupon_code': 'SAVE20'})
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        # Price should be 500 - 20% = 400
        self.assertEqual(response2.data['booking']['total_price'], '400.00')

    def test_payment_verification_flow(self):
        self.client.force_authenticate(user=self.customer)
        book_url = reverse('event_book', args=[self.event.id])
        
        # Create order
        res = self.client.post(book_url, {'tickets_count': 2})
        order_id = res.data['razorpay_order_id']
        
        # Verify payment signature callback (mock signature verification)
        verify_url = reverse('booking_verify')
        verify_data = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': 'pay_mock123',
            'razorpay_signature': 'sig_mock123'
        }
        
        response = self.client.post(verify_url, verify_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'confirmed')
        self.assertEqual(response.data['payment_status'], 'paid')
        self.assertIsNotNone(response.data['qr_code_hash'])

    def test_wishlist_toggle(self):
        self.client.force_authenticate(user=self.customer)
        url = reverse('event_wishlist', args=[self.event.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_wishlisted'])

        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_wishlisted'])

    def test_live_feed_endpoints(self):
        # Live events feed
        url_feed = reverse('live_events_feed')
        response = self.client.get(url_feed)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)

        # Weather feed
        url_weather = reverse('live_weather_feed')
        response2 = self.client.get(url_weather)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertIn('temp', response2.data)
