import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from the backend directory
dotenv.config({ path: 'c:/Users/sidsm/PROJECTS/Integrated-Food-Delivery-and-Dine-Out-Hospitality-Platform/backend/.env' });

async function check() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('URI:', process.env.MONGO_URI ? 'Exists' : 'MISSING');
    
    if (!process.env.MONGO_URI) {
      console.error('Error: MONGO_URI is missing from .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected successfully!');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(c => console.log(` - ${c.name}`));
    
    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database Connection Failed!');
    console.error('Error details:', err.message);
    process.exit(1);
  }
}

check();
