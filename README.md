# Integrated Food Delivery and Dine-Out Hospitality Platform

A full-stack hospitality ecosystem that integrates **food delivery, dine-out reservations, and event discovery** into a single unified platform.

This system enables users to discover restaurants using **geospatial search**, place food delivery orders, reserve dine-out tables, and track delivery in **real-time**.

The platform also features a **Gamified Review Engine** that incentivizes detailed user feedback through a dynamic reward scoring system.

---

## 🚀 Key Features

### Geospatial Restaurant Discovery

* Locate nearby restaurants using MongoDB **2dsphere indexing**
* Filter by cuisine, rating, and distance
* Fast geospatial queries using `$geoNear`

### Unified Cart and Checkout

* Order food delivery
* Reserve restaurant tables
* Seamless transition between services

### Real-Time Order Tracking

* WebSocket powered live order status updates
* Courier GPS tracking
* Instant notifications

### Gamified Review System

* Reward points for high-quality reviews
* Keyword density analysis
* AI-assisted review prompts

### Merchant Dashboard

* Manage menu availability
* Accept or reject delivery orders
* Monitor revenue metrics

---

# 🏗 System Architecture

Frontend
React.js

Backend
Node.js + Express.js

Database
MongoDB Atlas

Real-Time Communication
Socket.io (WebSockets)

Cloud Infrastructure
AWS (EC2 + S3)

Containerization
Docker

---

# 📂 Project Structure

```
integrated-food-delivery-platform
│
├── frontend
├── backend
├── database
├── docs
├── deployment
├── tests
│
├── README.md
├── CONTRIBUTING.md
├── .env.example
└── docker-compose.yml
```

---

# ⚙️ Installation

### Clone the repository

```
git clone https://github.com/siddharthkmaharana/Integrated-Food-Delivery-and-Dine-Out-Hospitality-Platform.git
```

```
cd integrated-food-delivery-dineout-platform
```

---

### Install Backend Dependencies

```
cd backend
npm install
```

---

### Install Frontend Dependencies

```
cd frontend
npm install
```

---

# 🔐 Environment Variables

Create `.env` file inside backend folder.

Example configuration:

```
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret
AWS_ACCESS_KEY=your_key
AWS_SECRET_KEY=your_secret
```

---

# ▶ Running the Application

Backend

```
cd backend
npm run dev
```

Frontend

```
cd frontend
npm start
```

---

# 👥 Contributors

Internship Team (4 Members)

Frontend Developer - Siddharth Kumar Maharana
Backend Developer
Realtime Systems Engineer
Database & DevOps Engineer

---

# 📜 License

This project is licensed under the MIT License.
