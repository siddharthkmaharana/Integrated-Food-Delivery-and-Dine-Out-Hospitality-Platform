import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './src/models/Restaurant.js';

dotenv.config();

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80'
];

async function updateRestaurants() {
  await mongoose.connect(process.env.MONGO_URI);
  const restaurants = await Restaurant.find();
  for (let i = 0; i < restaurants.length; i++) {
    restaurants[i].image = DEFAULT_IMAGES[i % DEFAULT_IMAGES.length];
    restaurants[i].is_open = true;
    await restaurants[i].save();
  }
  console.log('Fixed images and status!');
  process.exit();
}
updateRestaurants();
