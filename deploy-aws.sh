#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=l

sudo rm -f /var/lib/apt/lists/lock
sudo rm -f /var/cache/apt/archives/lock
sudo rm -f /var/lib/dpkg/lock
sudo rm -f /var/lib/dpkg/lock-frontend

sudo apt-get update -yq
sudo apt-get install -yq curl git

curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -yq nodejs
sudo npm install -g pm2

rm -rf Integrated-Food-Delivery-and-Dine-Out-Hospitality-Platform

git clone https://github.com/siddharthkmaharana/Integrated-Food-Delivery-and-Dine-Out-Hospitality-Platform.git
cd Integrated-Food-Delivery-and-Dine-Out-Hospitality-Platform/backend
npm install

cat > .env << 'EOF'
MONGO_URI=mongodb+srv://siddharthkumarmaharana:siddharth_dineout@cluster0.kvmsgna.mongodb.net/?appName=Cluster0
JWT_SECRET=super_secret_jwt_key
PORT=5000
EOF

pm2 delete foodhub-backend || true
pm2 start src/server.js --name "foodhub-backend" --update-env
pm2 save
