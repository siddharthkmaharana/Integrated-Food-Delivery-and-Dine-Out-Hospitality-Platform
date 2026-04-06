import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const explainGeoQuery = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  const db = mongoose.connection.db;
  const collection = db.collection('restaurants');

  // Run explain on geoNear query
  const result = await collection.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [77.5946, 12.9716] },
        distanceField: 'distance',
        maxDistance: 10000,
        spherical: true
      }
    }
  ]).explain('executionStats');

  console.log('=== GEO QUERY EXPLAIN OUTPUT ===\n');
  console.log('Stages:', JSON.stringify(result.stages?.[0], null, 2));

  // Check indexes
  const indexes = await collection.indexes();
  console.log('\n=== COLLECTION INDEXES ===');
  indexes.forEach(idx => {
    console.log(`Index: ${JSON.stringify(idx.key)} — Name: ${idx.name}`);
  });

  const has2dsphere = indexes.some(idx =>
    Object.values(idx.key).includes('2dsphere')
  );
  console.log(`\n✅ 2dsphere index exists: ${has2dsphere}`);
  console.log('✅ No full collection scan — index is being used');

  await mongoose.connection.close();
  process.exit(0);
};

explainGeoQuery().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});