import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './src/models/Restaurant.js';

dotenv.config();

async function clearDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB...');
    const result = await Restaurant.deleteMany({});
    console.log(`Deleted ${result.deletedCount} restaurants.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
clearDB();
