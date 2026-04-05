# Deployment Guide

This guide provides instructions for deploying the Integrated Food Delivery and Dine-Out Hospitality Platform to cloud infrastructure. The application consists of a Node.js/Express backend and a Vite+React frontend, utilizing MongoDB and potentially AWS S3 for storage.

## Target Architecture
*   **Frontend**: Vercel or Netlify (Static Hosting/Serverless)
*   **Backend**: AWS EC2, Render, or Railway (Node.js runtime + WebSockets)
*   **Database**: MongoDB Atlas
*   **Media Storage** (Optional): AWS S3

---

## 1. Database (MongoDB Atlas)
1. Log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Cluster.
3. Under Database Access, create a database user and copy the credentials.
4. Under Network Access, allow access from anywhere (`0.0.0.0/0`) or specific IP blocks where your backend is hosted.
5. Get the connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>`.

## 2. Backend Deployment (AWS EC2 / Render)

### Option A: Render (Easiest)
1. Push your repository to GitHub.
2. Sign in to Render and create a new **Web Service**.
3. Connect your repository.
4. Settings:
    *   **Build Command**: `cd backend && npm install`
    *   **Start Command**: `cd backend && node server.js`
5. Environment Variables:
    *   `MONGO_URI`: (Your MongoDB connection string)
    *   `JWT_SECRET`: (A strong random string)
    *   `PORT`: `5000` (or leave default for Render)
    *   `GOOGLE_PLACES_API_KEY`: (If you generated one for local tests)
6. Once deployed, note down the provided backend URL (e.g., `https://backend-api.onrender.com`).

### Option B: AWS EC2 (More Control)
1. Launch an Ubuntu EC2 instance.
2. Open ports `80` (HTTP), `443` (HTTPS), `22` (SSH), and your backend port (e.g. `5000`) in the Security Group.
3. SSH into the instance:
   ```bash
   ssh -i key.pem ubuntu@<ec2-ip-address>
   ```
4. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
5. Clone the repository and install dependencies:
   ```bash
   git clone <repo-url>
   cd Integrated-Food-Delivery-and-Dine-Out-Hospitality-Platform/backend
   npm install
   ```
6. Set up `.env` file with `MONGO_URI` and `JWT_SECRET`.
7. Install `pm2` to keep the app running in the background:
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name "foodhub-backend"
   ```
8. Note down the public IP or DNS of the EC2 instance.

## 3. Frontend Deployment (Vercel)

1. Make sure your frontend code connects to the production backend by modifying the API endpoint base path (or ensure Vite reads it from an environment variable in `client.js`). 
   *Example*: Replace `http://localhost:5000` with the Render/EC2 URL you got from the previous step.
2. Log into [Vercel](https://vercel.com/) and click "Add New Project".
3. Import your GitHub repository.
4. Set the Root Directory to `frontend`.
5. Framework Preset: **Vite**.
6. Build Command: `npm run build`
7. Output Directory: `dist`
8. Deploy!
9. Vercel will provide a live URL (e.g., `https://foodhub-platform.vercel.app`).

---

## 4. CI/CD Operations
The repository is configured with a GitHub Actions workflow (`.github/workflows/ci.yml`). Whenever code is pushed to `main` or a Pull Request is opened:
*   Frontend files are built and checked.
*   Backend dependencies are installed.
This confirms the build won't break before pushing to production. (Vercel and Render will also automatically build/test per their commit hooks).
