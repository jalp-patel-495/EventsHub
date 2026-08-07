# 🎪 EVENTHUB

> **Connecting Experiences & Venues to Everyone.**

EventHub is a modern, enterprise-grade full-stack event hosting, ticketing, catering, and venue-booking marketplace. Designed specifically for Ahmedabad and beyond, EventHub connects customers with live events (concerts, tech summits, comedy shows, workshops) and premium venues (party plots, auditoriums, banquets, resorts, exhibition grounds).

The platform delivers a seamless end-to-end experience featuring AI-powered event recommendations, smart catering planners, real-time WebSocket messaging, live ticket QR scanner verification, automated PDF invoice generation, role-based executive dashboards, and secure online payment workflows.

---

# 🏆 GitHub Badges & Achievements

[![Top Language](https://img.shields.io/github/languages/top/jalp-patel-495/EventsHub?style=for-the-badge)](https://github.com/jalp-patel-495/EventsHub)
[![Repo Size](https://img.shields.io/github/repo-size/jalp-patel-495/EventsHub?style=for-the-badge)](https://github.com/jalp-patel-495/EventsHub)
[![Stars](https://img.shields.io/github/stars/jalp-patel-495/EventsHub?style=for-the-badge)](https://github.com/jalp-patel-495/EventsHub)


---

# ✨ Features

## 👤 Customer

- **Secure Authentication**: Email & Password registration with OTP Verification, JWT Auth, and Password Reset.
- **Event Exploration & Booking**: Filter by categories (Music, Tech, Comedy, Sports, Cultural), search live events, interactive seat selection, and instant ticket reservations.
- **Venue Rental**: Browse and book auditoriums, party plots, resorts, and exhibition grounds with dynamic date slot selection.
- **Add-on Services**: Select optional catering packages, DJ setups, and decoration options when renting venues.
- **Interactive 3D Cards & Tickets**: View animated 3D event tickets rendered using Three.js and Framer Motion.
- **QR Code Verification**: Receive unique QR codes on e-tickets for swift entry gate validation.
- **PDF Ticket & Invoice Download**: Download professional itemized PDF tickets and receipts generated directly in-browser.
- **AI Chatbot Assistant**: Intelligent AI assistant for instant event discovery and platform assistance.
- **AI Event Recommendations**: Personalized event suggestions powered by machine learning algorithms.
- **AI Catering Planner**: Smart budget calculation, guest estimation, and menu selector (Veg, Jain, Non-Veg).
- **Direct Messaging**: Chat directly with Venue Owners and Event Organizers in real-time.
- **Wishlist & Reviews**: Save favorite events and submit ratings and reviews.
- **Complaint & Query Tracking**: Submit support tickets and track resolution status from the admin team.

---

## 🎭 Organizer

- **Organizer Portal**: Dedicated dashboard to track event performance, total ticket sales, and total revenue.
- **Event Creation & Management**: Create, update, publish, or modify live event listings with custom pricing and capacity.
- **Coupon Management**: Create, edit, and deactivate custom discount coupons for events.
- **Ticket Scanner**: Built-in mobile & web camera QR Code ticket scanner for instant entry gate check-ins.
- **Refund Request Approvals**: Review and approve customer refund requests.
- **Customer Communication**: Direct real-time chat with registered event attendees.
- **Analytics & Reports**: Visual charts for daily ticket sales, attendee demographics, and booking trends.

---

## 🏰 Plot / Venue Owner

- **Venue Owner Portal**: Executive dashboard for managing listed venues and incoming slot booking requests.
- **Venue Management**: Add party plots, auditoriums, resorts, banquets, and exhibition grounds with detailed amenities and photos.
- **Slot & Pricing Control**: Define custom pricing per day/slot and manage availability calendars.
- **Service Customization**: Offer custom catering, DJ, sound, lighting, and decoration add-on packages.
- **Booking Approvals**: Accept or reject venue rental requests from customers and event organizers.
- **Payment Verification**: Poll and confirm online/cash booking payments.
- **Direct Messaging**: Real-time communication channel with customers booking the venue.

---

## 🛠 System Admin

- **Platform Executive Dashboard**: High-level system overview including total revenue, active users, total events, and venue bookings.
- **User Management**: Approve specialized role requests (Organizer / Plot Owner), toggle active/inactive user accounts.
- **Event & Venue KYC Approvals**: Review and approve/reject event listings and venue submissions with custom decision reasons.
- **Transaction & Refund Oversight**: Monitor all platform payment transactions and execute system refunds.
- **Broadcast System**: Send platform-wide notifications and announcements to all connected users via WebSockets.
- **Support & Complaint Desk**: Review, manage, and respond directly to user complaints and query tickets.
- **System Audit Logs**: Comprehensive security audit trail recording all administrative actions.

---

# ⚡ Real-Time Features

- **WebSocket Integration**: Powered by Django Channels & Daphne ASGI server.
- **Live Event Feed**: Real-time updates on remaining ticket availability and newly published events.
- **Recent Sales Ticker**: Live notification ticker showcasing recent ticket purchases across the platform.
- **Real-Time Direct Chat**: Instant messaging between Customers, Organizers, and Plot Owners.
- **Instant Admin Alerts**: Live notifications for new venue requests, event submissions, and user registrations.
- **Live Weather Feed**: Live weather updates for outdoor party plots and venue event planning.

---

# 🤖 AI & Smart Features

- **AI Chatbot Widget**: Interactive assistant leveraging OpenAI GPT & Google Gemini models to answer user queries and recommend events.
- **AI Recommendation Engine**: ML-based recommendation pipeline (Scikit-Learn & NumPy) offering tailored event suggestions.
- **AI Catering Planner**: Automated catering cost calculator estimating per-plate pricing based on guest counts, dietary filters (Veg/Non-Veg/Jain), and meal courses.
- **AI Description Generator**: Auto-generates captivating event and venue descriptions for Organizers and Plot Owners.

---

# 💳 Payment Integration

- **Razorpay Test Mode**: Integrated payment gateway for secure credit card, debit card, and UPI transactions.
- **PaySimulate Gateway**: Built-in payment simulator for rapid offline/local testing and demonstration.
- **Payment Status Polling**: Automatic payment state verification and backend webhooks.
- **Receipt & Invoice Engine**: Instant receipt generation with unique payment transaction IDs.

---

# 📧 Email System

Django SMTP & Anymail Integration supporting:

- Email Verification via OTP
- Password Reset via Secure Token & OTP
- Booking Confirmation & E-Ticket Email Delivery
- Refund Status Notifications
- Administrative Direct Messaging to Users

---

# 🎟️ Ticket & Invoice System

- **Itemized Breakdown**: Base Ticket Price, Add-on Services (Catering, DJ, Decor), Applied Coupons, and Taxes.
- **QR Code Embed**: Unique encrypted payload embedded into each ticket for one-time entry validation.
- **PDF Generation**: Downloadable client-side PDF tickets formatted using `jsPDF` and `html2canvas`.
- **In-App QR Verification**: Camera-based scanner using `html5-qrcode` to mark tickets as used upon entry.

---

# 🔐 Authentication & Security

- **JWT Authentication**: Access and Refresh Token rotation via SimpleJWT.
- **Role-Based Access Control (RBAC)**: Custom permissions for Customer, Organizer, Plot Owner, and System Admin.
- **OTP Verification**: Two-factor email OTP validation for registration and password resets.
- **Security Protections**: CORS policy enforcement, password hashing, SQL injection prevention, and CSRF protection.

---

# 📊 Tech Stack

## Frontend

- **Core**: React 19, JavaScript (ES6+), HTML5, CSS3
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **UI Components & Icons**: Lucide React, Custom Glassmorphism UI
- **Animations & 3D**: Framer Motion, Three.js (`@react-three/fiber`)
- **Routing**: React Router DOM v7
- **Utilities**: Axios, jsPDF, html2canvas, html5-qrcode, qrcode.react

---

## Backend

- **Framework**: Python 3.11+, Django 5.0+
- **API**: Django REST Framework (DRF)
- **Real-Time / WebSockets**: Django Channels, Daphne, Redis
- **Authentication**: djangorestframework-simplejwt, OTP engine
- **AI & Machine Learning**: OpenAI API, Google Generative AI SDK, Scikit-Learn, NumPy
- **Image Processing**: Pillow

---

## Database & Storage

- **Database**: SQLite (Development) / PostgreSQL (Production ready)
- **Media Storage**: Django Local Media / Cloudinary

---

## Payments & Notifications

- **Payments**: Razorpay SDK, PaySimulate Engine
- **Email**: Django SMTP, Anymail (Resend)
- **Notifications**: WebSocket Broadcasting, Django Signals

---

# 📦 Project Structure

```
EventHub-main/
├── EventHub/
│   ├── backend/
│   │   ├── accounts/           # Auth, JWT, OTP, User Profiles, RBAC
│   │   ├── events/             # Event Listings, Bookings, Coupons, QR Scanner API
│   │   ├── venues/             # Venue Listings, Slot Reservations, Add-on Services
│   │   ├── catering/           # Catering Services, Packages, Custom Orders
│   │   ├── chat/               # Real-Time WebSocket Chat & Message History
│   │   ├── ai/                 # AI Chatbot, AI Recommendations, Catering Planner
│   │   ├── notifications/      # Notification Engine & Broadcast System
│   │   ├── system_admin/       # Admin Dashboard, Approvals, Refunds, Audit Logs
│   │   ├── eventhub/           # Django settings, ASGI/WSGI, Root URLs
│   │   ├── manage.py           # Django CLI script
│   │   ├── populate_events.py  # Sample Data Seeder
│   │   └── requirements.txt    # Python Dependencies
│   │
│   └── frontend/
│       ├── public/             # Static Assets & Icons
│       ├── src/
│       │   ├── api/            # Axios instance & API service modules
│       │   ├── assets/         # Images, Logos, Graphic Assets
│       │   ├── components/     # 3D Ticket, Modals, Chatbot, Recommendation Widgets
│       │   ├── context/        # AuthContext, ThemeContext
│       │   ├── pages/          # Dashboards, Explore pages, Live Events, Ticket Scanner
│       │   ├── routes/         # Protected & Role-Based Routes
│       │   ├── App.jsx         # Root React Component & Router Setup
│       │   └── main.jsx        # React DOM Entrypoint
│       ├── package.json        # Frontend Dependencies & Scripts
│       ├── tailwind.config.js  # Tailwind CSS Configuration
│       └── vite.config.js      # Vite Configuration
│
├── Master.md                   # Master Architectural Document
├── README.md                   # Project Documentation
└── run_project.bat             # One-Click Full-Stack Startup Script
```

---

# 🔄 Booking Workflows

## 🎟️ Event Ticket Booking Workflow

```
Customer Browses Events
        │
        ▼
Select Event & Seats
        │
        ▼
Apply Discount Coupon (Optional)
        │
        ▼
Choose Payment Method
 ┌─────────────┬─────────────┐
 │                           │
 ▼                           ▼
Online (Razorpay)     PaySimulate (Test)
 └─────────────┬─────────────┘
        │
        ▼
Backend Verifies Payment
        │
        ▼
QR Ticket Generated & Email Sent
        │
        ▼
Download PDF Ticket & Receipt
        │
        ▼
Gate Check-In: Organizer Scans QR Code
        │
        ▼
Attendance Verified & Completed
```

---

## 🏰 Venue Rental Booking Workflow

```
Customer / Organizer Browses Venues
        │
        ▼
Select Date Slot & Guests Count
        │
        ▼
Select Add-ons (Catering / DJ / Decor)
        │
        ▼
Submit Booking Request
        │
        ▼
Venue Owner Notified via WebSockets
        │
        ▼
Owner Accepts or Rejects Request
 ┌─────────────┴─────────────┐
 │                           │
 ▼                           ▼
[Rejected]              [Accepted]
Notified                 Proceed to Payment
                             │
                             ▼
                    Customer Pays Online / Cash
                             │
                             ▼
                    Owner Approves Payment
                             │
                             ▼
                    Venue Slot Booked & Confirmed
```

---

# 🚀 Installation & Setup

## Prerequisites

- **Node.js** (v18.0 or higher)
- **Python** (v3.10 or higher)
- **Git**

---

## Clone Repository

```bash
git clone https://github.com/jalp-patel-495/EventsHub.git
cd EventsHub
```

---

## Quick Start (Windows One-Click Launch)

Simply double-click `run_project.bat` in the root folder, or run in terminal:

```bash
.\run_project.bat
```

---

## Manual Step-by-Step Setup

### 1. Backend Setup

```bash
cd EventHub/backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows)
.venv\Scripts\activate

# Activate virtual environment (macOS/Linux)
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Seed initial sample data (Optional)
python populate_events.py

# Start Django Development Server
python manage.py runserver
```

The backend server will start at: `http://localhost:8000`

---

### 2. Frontend Setup

Open a new terminal:

```bash
cd EventHub/frontend

# Install npm dependencies
npm install

# Start Vite Development Server
npm run dev
```

The frontend application will start at: `http://localhost:5173`

---

## Environment Variables

### Backend `.env` (`EventHub/backend/.env`)

```env
SECRET_KEY=django-insecure-your-secret-key-here
DEBUG=True

# Database Settings
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# Email SMTP Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Razorpay Credentials (Test Mode)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# AI APIs (Optional)
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

# JWT Settings
JWT_SECRET=your_jwt_secret_key
```

### Frontend `.env` (`EventHub/frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000/ws
```

---

# 🎯 Future Roadmap

- [ ] **Google Maps Live Navigation**: Map-based venue exploration and directions.
- [ ] **Push Notifications**: Browser PWA push alerts for live event reminders.
- [ ] **AI Voice Booking Assistant**: Voice-controlled search and ticket booking.
- [ ] **Seating Layout Builder**: Visual seat picker for auditoriums and stadium events.
- [ ] **Referral & Reward Points**: Customer loyalty reward points and referral discounts.
- [ ] **Multi-Language Support**: Support for Gujarati, Hindi, and English languages.
- [ ] **Mobile App**: Native Flutter mobile apps for iOS and Android.

---

## Lead Developer & Author

**Jalp Patel**
- GitHub: [@jalp-patel-495](https://github.com/jalp-patel-495)
  
**Gohel Sumit**
- GitHub: [@Sumitgohel07](https://github.com/Sumitgohel07)

---

# 📄 License

This project is licensed under the MIT License - developed for educational purposes and startup prototyping.

---

# ⭐ Support

If you find this project helpful or inspiring, please give it a **⭐ Star** on GitHub!

---

## EventHub

**Connecting Experiences & Venues to Everyone.**

---

## 👥 Contributors

- **Jalp Patel** ([@jalp-patel-495](https://github.com/jalp-patel-495))
