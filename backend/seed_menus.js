import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './src/models/Restaurant.js';
import MenuItem from './src/models/MenuItem.js';

dotenv.config();

const ITEM_TEMPLATES = [
  { name: 'Margherita Pizza', price: 299, category: 'Main Course', desc: 'Classic cheese and tomato pizza.', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80' },
  { name: 'Cheeseburger', price: 199, category: 'Main Course', desc: 'Juicy beef patty with cheese.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80' },
  { name: 'Caesar Salad', price: 249, category: 'Appetizers', desc: 'Fresh romaine with croutons and dressing.', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&q=80' },
  { name: 'Spicy Noodles', price: 189, category: 'Main Course', desc: 'Wok-tossed noodles with chili oil.', image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb431?w=500&q=80' },
  { name: 'Chocolate Lava Cake', price: 149, category: 'Dessert', desc: 'Warm chocolate cake with gooey center.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80' },
  { name: 'Garlic Bread', price: 129, category: 'Appetizers', desc: 'Toasted bread with garlic butter.', image: 'https://images.unsplash.com/photo-1619535814782-b3d0042d65dc?w=500&q=80' },
  { name: 'Peri Peri Fries', price: 119, category: 'Appetizers', desc: 'Crispy fries with spicy peri peri seasoning.', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80' },
  { name: 'Paneer Tikka', price: 279, category: 'Appetizers', desc: 'Grilled cottage cheese with spices.', image: 'https://images.unsplash.com/photo-1567184109191-37d4f90117b3?w=500&q=80' },
  { name: 'Butter Chicken', price: 349, category: 'Main Course', desc: 'Creamy tomato-based chicken curry.', image: 'https://images.unsplash.com/photo-1603894584115-f73f2ec04af3?w=500&q=80' },
  { name: 'Ice Cream Scoop', price: 89, category: 'Dessert', desc: 'Choice of vanilla, chocolate or strawberry.', image: 'https://images.unsplash.com/photo-1560008511-11c63416e52d?w=500&q=80' },
  { name: 'Coke / Sprite', price: 59, category: 'Beverages', desc: '300ml cold drink.', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80' },
  { name: 'Fresh Lime Soda', price: 79, category: 'Beverages', desc: 'Sweet or salted refreshing lime drink.', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80' }
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
      // Pick 8-12 random templates for each restaurant for a fuller menu
      const numItems = Math.floor(Math.random() * 5) + 8;
      const shuffled = [...ITEM_TEMPLATES].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(numItems, ITEM_TEMPLATES.length));

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
