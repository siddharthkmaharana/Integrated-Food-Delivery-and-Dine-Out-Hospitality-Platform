import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './src/models/Restaurant.js';
import MenuItem from './src/models/MenuItem.js';

dotenv.config();

const ITEM_TEMPLATES = [
  { name: 'Margherita Pizza', price: 12.99, category: 'Main Course', desc: 'Classic cheese and tomato pizza.', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80' },
  { name: 'Cheeseburger', price: 9.99, category: 'Main Course', desc: 'Juicy beef patty with cheese.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80' },
  { name: 'Caesar Salad', price: 8.99, category: 'Appetizers', desc: 'Fresh romaine with croutons and dressing.', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&q=80' },
  { name: 'Spicy Noodles', price: 11.99, category: 'Main Course', desc: 'Wok-tossed noodles with chili oil.', image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb431?w=500&q=80' },
  { name: 'Chocolate Lava Cake', price: 6.99, category: 'Dessert', desc: 'Warm chocolate cake with gooey center.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80' },
  { name: 'Garlic Bread', price: 4.99, category: 'Appetizers', desc: 'Toasted bread with garlic butter.', image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&q=80' }
];

async function seedMenus() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB...');
    
    // Clear old items to avoid duplicates
    await MenuItem.deleteMany({});
    console.log('Cleared existing menus.');

    const restaurants = await Restaurant.find();
    console.log(`Found ${restaurants.length} restaurants to seed.`);

    let count = 0;
    for (const r of restaurants) {
      // Pick 3-5 random templates for each restaurant
      const numItems = Math.floor(Math.random() * 3) + 3;
      const shuffled = [...ITEM_TEMPLATES].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numItems);

      const itemsToInsert = selected.map(item => ({
        restaurant: r._id,
        name: item.name,
        price: item.price,
        description: item.desc,
        category: item.category,
        image: item.image,
        isAvailable: true
      }));

      await MenuItem.insertMany(itemsToInsert);
      count += itemsToInsert.length;
    }

    console.log(`Successfully seeded ${count} menu items!`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seedMenus();
