#!/bin/bash
sudo apt-get update
sudo apt-get install -y curl git
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
git clone -b week4/siddharth https://github.com/siddharthkmaharana/Integrated-Food-Delivery-and-Dine-Out-Hospitality-Platform.git
cd Integrated-Food-Delivery-and-Dine-Out-Hospitality-Platform/backend
npm install
cat > .env << 'EOF'
MONGO_URI=mongodb+srv://siddharthkumarmaharana:siddharth_dineout@cluster0.kvmsgna.mongodb.net/?appName=Cluster0
JWT_SECRET=super_secret_jwt_key
PORT=5000
EOF
pm2 start src/server.js --name foodhub-backend
