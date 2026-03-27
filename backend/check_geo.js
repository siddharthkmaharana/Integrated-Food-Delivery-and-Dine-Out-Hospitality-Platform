import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './src/models/Restaurant.js';

dotenv.config();

async function checkGeo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB...');

    // 1. Force creating the index if it was missing 
    await Restaurant.init();
    console.log('Mongoose initialized indexes');

    // 2. Check indexes on the collection
    const indexes = await Restaurant.collection.getIndexes();
    console.log('Current Indexes:', Object.keys(indexes));

    // 3. Perform a geo search
    const lng = 77.5946; // Bangalore
    const lat = 12.9716;

    const results = await Restaurant.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: 15000,
          spherical: true
        }
      },
      { $limit: 3 }
    ]);

    console.log(`\nFound ${results.length} restaurants via 2dsphere $geoNear!`);
    results.forEach(r => {
      console.log(`- ${r.name}: ${(r.distance / 1000).toFixed(2)} km away`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Geo Search Failed:', err.message);
    process.exit(1);
  }
}

checkGeo();
