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

Encourages users to leave **high-quality reviews**.

Review points are calculated using:

```
Reward Points =
Word Count × 2 + Keyword Score
```

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
POST /api/reviews
GET /api/reviews/restaurant/:id
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

Create `.env` file in backend folder.

Example:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=secret_key
AWS_ACCESS_KEY=your_key
AWS_SECRET_KEY=your_key
```

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
