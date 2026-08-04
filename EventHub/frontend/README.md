# 🎪 EventHub - Frontend Module

> **React 19 + Vite + Tailwind CSS + Framer Motion + Three.js**

This directory contains the user interface and client-side web application for **EventHub**.

---

## ⚡ Features & Capabilities

- **Interactive 3D Visuals**: Animated 3D event tickets powered by Three.js and Framer Motion.
- **Role-Based Portals**:
  - Customer Portal (Browse events/venues, seat selection, AI chatbot, AI catering planner, Wishlist, PDF ticket generator).
  - Organizer Dashboard (Event creation, active coupon management, mobile/web QR code scanner for gate entry verification).
  - Plot Owner Dashboard (Venue listing, slot pricing, optional add-on packages, request approvals).
  - Admin Portal (System analytics, user role approvals, KYC event/venue approval, refund oversight).
- **Real-Time Communication**: Live chat widget via WebSockets (`ws://localhost:8000/ws`).
- **QR Scanner**: Built-in camera-based QR code entry validator powered by `html5-qrcode`.
- **Invoicing & E-Tickets**: Client-side PDF e-ticket and itemized receipt downloads (`jsPDF` & `html2canvas`).

---

## 🛠️ Scripts & Commands

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview

# Run Oxlint
npm run lint
```

---

© 2026 EventHub. Developed by **Jalp Patel** ([@jalp-patel-495](https://github.com/jalp-patel-495)).
