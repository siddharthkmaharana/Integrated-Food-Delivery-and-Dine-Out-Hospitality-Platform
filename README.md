# 🍔 Integrated Food Delivery and Dine-Out Hospitality Platform

![React](https://img.shields.io/badge/Frontend-React-blue)
![NodeJS](https://img.shields.io/badge/Backend-NodeJS-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-black)
![AWS](https://img.shields.io/badge/Cloud-AWS-orange)

A **full-stack MERN platform** that integrates **food delivery, restaurant discovery, dine-out reservations, and real-time order tracking** into a single ecosystem.

This system replicates core functionality similar to **Swiggy / Zomato / UberEats**, while also including a **gamified review system and geospatial restaurant discovery engine**.

---

# 📌 Table of Contents

1. Overview
2. Problem Statement
3. System Architecture
4. Key Features
5. Technology Stack
6. Project Structure
7. Database Design
8. API Endpoints
9. Installation
10. Deployment
11. Future Enhancements
12. Contributors

---

# 🚀 Overview

The **Integrated Food Delivery and Dine-Out Hospitality Platform** is designed to eliminate fragmentation in modern food service applications.

Instead of using separate platforms for:

* Food Delivery
* Restaurant Discovery
* Table Reservations
* Customer Reviews

This platform integrates all these services into **one unified application ecosystem**.

---

# ❗ Problem Statement

The hospitality technology industry currently suffers from **digital fragmentation**.

Users must switch between multiple apps for:

* ordering food
* reserving tables
* discovering restaurants
* writing reviews

Meanwhile, restaurants struggle with:

* high commission fees
* multiple dashboards
* poor customer feedback quality

This project solves these problems by creating **a unified hospitality ecosystem platform**.

---

# 🏗 System Architecture

```
            React Frontend
                  │
                  │ REST APIs
                  ▼
          Node.js + Express Server
                  │
                  │ Database Queries
                  ▼
             MongoDB Atlas
                  
        ┌───────────────┐
        │   WebSockets  │
        │   (Socket.io) │
        └───────────────┘
                │
                ▼
   Real-Time Order Tracking
```

---

# ⭐ Key Features

## 🔎 Restaurant Discovery Engine

Location-based restaurant discovery powered by **MongoDB Geospatial Queries**.

Features:

* Nearby restaurants search
* Distance filtering
* Rating-based sorting
* Cuisine filters

---

## 🛒 Unified Cart System

Users can add food items to their cart and place orders.

Features:

* Restaurant-based cart validation
* Dynamic pricing
* Order confirmation

---

## 📡 Real-Time Order Tracking

Live order updates using **WebSockets (Socket.io)**.

Order states:

```
ORDER_ACCEPTED
ORDER_PREPARING
COURIER_ASSIGNED
IN_TRANSIT
DELIVERED
```

---

## 🍽 Dine-Out Reservation System

Users can reserve tables in restaurants directly.

Features:

* Table availability
* Reservation time slots
* Merchant dashboard integration

---

## ⭐ Gamified Review System

Encourages users to leave **high-quality reviews** with a dynamic point allocation engine.

### Scoring Algorithm

| Component | Points | Cap |
|---|---|---|
| Word Count | 1 pt per word | Max 20 pts |
| Keyword Density | 5 pts per bonus keyword | Max 30 pts |
| **Media Upload (photo)** | **+15 pts flat bonus** | — |
| **Maximum Total** | | **65 pts** |

Bonus Keywords: `delicious`, `amazing`, `fresh`, `hot`, `spicy`, `tasty`, `excellent`, `perfect`, `quick`, `friendly`

Earned points are added to the user's loyalty points balance and can be redeemed for discounts.

---

## 🏪 Merchant Dashboard

Restaurant partners can:

* Manage menu items
* Accept / reject orders
* Track revenue
* Monitor customer reviews

---

## 🚴 Courier Dashboard

Delivery partners can:

* Receive delivery requests
* Track navigation
* Update order status
* View earnings

---

# 🛠 Technology Stack

## Frontend

* React.js
* JavaScript
* HTML5
* CSS3
* Vite

## Backend

* Node.js
* Express.js
* REST APIs

## Database

* MongoDB Atlas

## Real-Time Communication

* Socket.io

## Cloud Infrastructure

* AWS EC2
* AWS S3

## DevOps

* Docker
* GitHub Actions

---

# 📂 Project Structure

```
integrated-food-platform
│
├── frontend
│   ├── components
│   ├── pages
│   ├── services
│   ├── context
│   └── hooks
│
├── backend
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middleware
│   ├── sockets
│   └── services
│
├── database
│
├── docs
│
└── scripts
```

---

# 🗄 Database Design

Main collections:

### Users

```
User {
 id
 name
 email
 password
 role
 location
}
```

### Restaurants

```
Restaurant {
 id
 name
 cuisine
 rating
 location
}
```

### MenuItems

```
MenuItem {
 id
 restaurantId
 name
 price
 category
}
```

### Orders

```
Order {
 id
 userId
 restaurantId
 items
 status
 courierId
}
```

### Reviews

```
Review {
 id
 userId
 restaurantId
 rating
 reviewText
 rewardPoints
}
```

---

# 🔌 API Endpoints

## Authentication

```
POST /api/auth/register
POST /api/auth/login
GET /api/auth/profile
```

## Restaurants

```
GET /api/restaurants
GET /api/restaurants/nearby
GET /api/restaurants/:id
```

## Orders

```
POST /api/orders
GET /api/orders/:id
GET /api/orders/user/:id
```

## Reviews

```
POST /api/reviews               — Submit review (multipart/form-data with optional "media" image)
GET  /api/reviews/restaurant/:id — All reviews for a restaurant
GET  /api/reviews/suggestions/:orderId — AI keyword suggestions for review
GET  /api/reviews/media/:filename — Serve locally stored review images (dev)
```

---

# 🗃 MongoDB Query Optimization & Index Verification

All geospatial queries are validated using `explain()` execution plans to confirm that the **2dsphere index is actively utilized** and no full-collection scans (COLLSCAN) occur.

### Running the explain() verification

```js
// Confirmed in geo.test.js — Test 6
const explained = await Restaurant.collection
  .find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [77.5946, 12.9716] },
        $maxDistance: 20000
      }
    }
  })
  .explain('executionStats');

// Verified assertions:
// ✅ explained.queryPlanner.winningPlan.stage !== 'COLLSCAN'
// ✅ executionStats.totalKeysExamined > 0  (index used)
// ✅ executionStats.executionTimeMillis < 200  (sub-200ms target)
```

### Index Defined in Schema

```js
// Restaurant.js
restaurantSchema.index({ location: '2dsphere' });  // Geospatial
restaurantSchema.index({ owner: 1 });              // Owner lookup

// Order.js
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });

// MenuItem.js
menuItemSchema.index({ restaurant: 1 });
```

Run the full test suite to reproduce index verification:

```bash
cd backend
npm test -- --testPathPattern=geo.test
```

---

# ⚙ Installation Guide

## Clone Repository

```
git clone https://github.com/yourusername/integrated-food-platform.git
cd integrated-food-platform
```

---

## Install Backend Dependencies

```
cd backend
npm install
```

---

## Install Frontend Dependencies

```
cd frontend
npm install
```

---

## Setup Environment Variables

Create `.env` file in backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# AWS S3 Media Storage (leave blank for local disk in development)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=dineout-media
```

> **Note:** When `AWS_ACCESS_KEY_ID` and `AWS_S3_BUCKET` are set, the upload middleware automatically streams media to S3. When they are blank, files are saved locally to `backend/uploads/`.

---

## Run Backend

```
npm run dev
```

---

## Run Frontend

```
npm run dev
```

Application runs on:

```
http://localhost:5173
```

---

# ☁ Deployment

Recommended cloud infrastructure:

Frontend → Vercel / Netlify
Backend → AWS EC2
Database → MongoDB Atlas
Media Storage → AWS S3

---

# 🔮 Future Enhancements

* AI food recommendation engine
* Dynamic pricing algorithms
* Delivery route optimization
* Mobile app (React Native)
* Payment integration (Stripe / Razorpay)

---

# 👨‍💻 Contributors

Siddharth Kumar Maharana – Frontend Development
Rahul – Backend Development

---

# 📄 License

This project is developed for **academic and educational purposes**.
