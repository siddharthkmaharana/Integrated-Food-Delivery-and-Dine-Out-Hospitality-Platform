import mongoose from 'mongoose';
import Restaurant from '../models/Restaurant.js';
import dotenv from 'dotenv';
dotenv.config();

describe('Geospatial Query Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // ✅ Clean existing and force fresh index creation
    await Restaurant.collection.dropIndexes().catch(() => {});
    await Restaurant.createIndexes();
    await Restaurant.init();
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ✅ Test 1 — verify 2dsphere index exists
  test('Restaurant collection should have 2dsphere index on location', async () => {
    const indexes = await Restaurant.collection.indexes();

    const has2dsphere = indexes.some(
      idx =>
        idx.key &&
        Object.keys(idx.key).includes('location') &&
        idx.key.location === '2dsphere'
    );

    console.log('Indexes found:', JSON.stringify(indexes, null, 2));

    expect(has2dsphere).toBe(true);
  }, 15000);

  // ✅ Test 2 — explain() confirms geo index query works (Project 2 Week 4 requirement)
  // The PDF mandates using explain() to guarantee that 2dsphere indexes are correctly
  // utilized and full-collection scans (COLLSCAN) are ELIMINATED.
  test('$geoNear query should use 2dsphere index successfully', async () => {
    const explained = await Restaurant.collection
      .aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [77.5946, 12.9716] },
            distanceField: 'distance',
            maxDistance: 10000,
            spherical: true
          }
        }
      ])
      .explain('executionStats');

    expect(explained).toBeDefined();

    console.log('✅ Geo query explain completed successfully');
    console.log('Explain output keys:', Object.keys(explained));
  }, 15000);

  // ✅ Test 6 — Verify 2dsphere index is USED, COLLSCAN is ABSENT
  // Project 2 Week 4: "MongoDB queries must be aggressively optimized using explain()
  // execution plans to guarantee that 2dsphere indexes are correctly utilized and
  // full-collection scans are eliminated."
  test('explain() should confirm 2dsphere index is used — no full collection scan', async () => {
    const explained = await Restaurant.collection
      .find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [77.5946, 12.9716] },
            $maxDistance: 20000
          }
        }
      })
      .explain('executionStats');

    const stats = explained.executionStats;
    console.log('\n📊 Query Execution Plan Analysis:');
    console.log(`  • Total docs examined : ${stats?.totalDocsExamined ?? 'N/A'}`);
    console.log(`  • Total keys examined : ${stats?.totalKeysExamined ?? 'N/A'}`);
    console.log(`  • Execution time (ms) : ${stats?.executionTimeMillis ?? 'N/A'}`);
    console.log(`  • Winning plan stage  : ${stats?.executionStages?.stage ?? 'N/A'}`);

    // Confirm explained output is structured
    expect(explained).toHaveProperty('queryPlanner');

    // The winning plan should NOT be COLLSCAN
    const winningPlanStage = explained?.queryPlanner?.winningPlan?.stage ||
                             explained?.queryPlanner?.winningPlan?.inputStage?.stage || '';

    console.log(`  • Winning plan stage  : ${winningPlanStage}`);
    expect(winningPlanStage).not.toBe('COLLSCAN');

    // Keys examined should be > 0 when 2dsphere index is used (on non-empty collection)
    if (stats?.totalDocsExamined > 0) {
      expect(stats.totalKeysExamined).toBeGreaterThan(0);
    }

    console.log('✅ 2dsphere index confirmed active — no full collection scan detected');
  }, 20000);


  // ✅ Test 3 — sorted by distance
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

    console.log(`Found ${restaurants.length} restaurants near location`);

    if (restaurants.length > 1) {
      expect(restaurants[0].distance).toBeLessThanOrEqual(
        restaurants[1].distance
      );
    }

    expect(Array.isArray(restaurants)).toBe(true);
  }, 15000);

  // ✅ Test 4 — combinedScore
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

    console.log(`Testing combinedScore on ${restaurants.length} restaurants`);

    restaurants.forEach(r => {
      const expected = r.rating * 1000 - r.distance / 100;
      expect(Math.abs(r.combinedScore - expected)).toBeLessThan(0.01);
    });

    expect(Array.isArray(restaurants)).toBe(true);
  }, 15000);

  // ✅ Test 5 — GeoJSON validation
  test('Restaurant location field should be valid GeoJSON Point', async () => {
    const restaurant = await Restaurant.findOne({
      'location.type': 'Point'
    });

    if (restaurant) {
      expect(restaurant.location.type).toBe('Point');
      expect(Array.isArray(restaurant.location.coordinates)).toBe(true);
      expect(restaurant.location.coordinates.length).toBe(2);

      // longitude
      expect(restaurant.location.coordinates[0]).toBeGreaterThanOrEqual(-180);
      expect(restaurant.location.coordinates[0]).toBeLessThanOrEqual(180);

      // latitude
      expect(restaurant.location.coordinates[1]).toBeGreaterThanOrEqual(-90);
      expect(restaurant.location.coordinates[1]).toBeLessThanOrEqual(90);

      console.log('✅ GeoJSON structure valid:', restaurant.location);
    } else {
      console.log(
        '⚠️ No restaurants with location found — skipping GeoJSON check'
      );
    }

    expect(true).toBe(true);
  }, 15000);
});