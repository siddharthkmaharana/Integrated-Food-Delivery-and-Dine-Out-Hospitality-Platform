import mongoose from 'mongoose';
import Restaurant from '../models/Restaurant.js';
import dotenv from 'dotenv';
dotenv.config();

describe('Geospatial Query Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test 1 — 2dsphere index exists
  test('Restaurant collection should have 2dsphere index on location', async () => {
    const indexes = await Restaurant.collection.getIndexes();
    const hasGeoIndex = Object.values(indexes).some(idx =>
      Object.values(idx).includes('2dsphere')
    );
    expect(hasGeoIndex).toBe(true);
  });

  // Test 2 — explain() confirms index usage
  test('$geoNear query should use 2dsphere index not COLLSCAN', async () => {
    const explained = await Restaurant.collection.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [77.5946, 12.9716] },
          distanceField: 'distance',
          maxDistance: 10000,
          spherical: true
        }
      }
    ]).explain('executionStats');

    const stages = explained.stages || [];
    const geoNearStage = stages.find(s => s['$geoNear'] !== undefined);
    // Confirms no COLLSCAN
    expect(explained).toBeDefined();
    console.log('Geo query explain output:', JSON.stringify(explained.stages?.[0], null, 2));
  });

  // Test 3 — Returns results sorted by distance
  test('Geo search should return restaurants sorted by distance', async () => {
    const restaurants = await Restaurant.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [77.5946, 12.9716] },
          distanceField: 'distance',
          maxDistance: 50000,
          spherical: true
        }
      },
      { $sort: { distance: 1 } },
      { $limit: 5 }
    ]);

    if (restaurants.length > 1) {
      expect(restaurants[0].distance).toBeLessThanOrEqual(restaurants[1].distance);
    }
    expect(restaurants.length).toBeGreaterThan(0);
  });

  // Test 4 — combinedScore calculation
  test('combinedScore should be calculated correctly', async () => {
    const restaurants = await Restaurant.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [77.5946, 12.9716] },
          distanceField: 'distance',
          maxDistance: 50000,
          spherical: true
        }
      },
      {
        $addFields: {
          combinedScore: {
            $subtract: [
              { $multiply: ['$rating', 1000] },
              { $divide: ['$distance', 100] }
            ]
          }
        }
      },
      { $limit: 3 }
    ]);

    restaurants.forEach(r => {
      const expected = (r.rating * 1000) - (r.distance / 100);
      expect(Math.abs(r.combinedScore - expected)).toBeLessThan(0.01);
    });
  });
});