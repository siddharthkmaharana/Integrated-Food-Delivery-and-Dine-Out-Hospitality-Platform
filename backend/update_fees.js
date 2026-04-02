import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: 'c:/Users/sidsm/PROJECTS/Integrated-Food-Delivery-and-Dine-Out-Hospitality-Platform/backend/.env' });

async function update() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB...');

    const fees = [30, 40, 45, 50, 60];
    const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({}, { strict: false }));

    const restaurants = await Restaurant.find({});
    console.log(`Found ${restaurants.length} restaurants to update.`);

    for (const r of restaurants) {
      const randomFee = fees[Math.floor(Math.random() * fees.length)];
      await Restaurant.updateOne({ _id: r._id }, { $set: { delivery_fee: randomFee } });
    }

    console.log('✅ Successfully updated all delivery fees!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

update();
