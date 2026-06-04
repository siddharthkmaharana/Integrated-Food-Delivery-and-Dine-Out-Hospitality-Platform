import * as dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Restaurant from './src/models/Restaurant.js';

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const restaurants = await Restaurant.find({});
        console.log(`Found ${restaurants.length} restaurants`);

        for (let r of restaurants) {
            // Mongoose might have stripped isOpen if not in schema, 
            // so we use r._doc to access raw data if needed
            const raw = r._doc;
            const isOpen = raw.isOpen !== undefined ? raw.isOpen : raw.is_open;
            
            r.is_open = isOpen !== undefined ? isOpen : true;
            r.is_approved = raw.is_approved !== undefined ? raw.is_approved : true;
            
            // Clean up old field if it exists
            r.set('isOpen', undefined);
            
            await r.save();
            console.log(`Updated ${r.name}`);
        }

        console.log('Migration complete');
        process.exit();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
