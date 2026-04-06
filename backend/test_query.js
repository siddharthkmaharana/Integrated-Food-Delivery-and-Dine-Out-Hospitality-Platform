import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Restaurant from './src/models/Restaurant.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function runQueryTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB. Running explain()...');

        // Verify the 2dsphere index exists
        const indexes = await Restaurant.collection.indexes();
        console.log("Current indexes on Restaurant collection:");
        console.log(JSON.stringify(indexes, null, 2));

        const longitude = 77.5946;
        const latitude = 12.9716;
        const maxDistance = 15000;

        const pipeline = [
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    distanceField: 'distance',
                    maxDistance: parseInt(maxDistance),
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
            { $sort: { combinedScore: -1 } },
            { $limit: 10 }
        ];

        console.log("\nRunning explain('executionStats')...");
        // Mongoose aggregate() doesn't officially support .explain('executionStats') gracefully sometimes.
        // The most robust way is to use the raw db command
        const db = mongoose.connection.db;
        const result = await db.command({
            explain: {
                aggregate: "restaurants",
                pipeline: pipeline,
                cursor: {}
            },
            verbosity: "executionStats"
        });

        console.log("\n--- EXPLAIN RESULT ---");
        // We want to verify that the initial query stage uses the 2dsphere index (IXSCAN)
        const queryPlanner = result.stages?.[0]?.$cursor?.queryPlanner || result.queryPlanner || result;
        const isUsingIndex = JSON.stringify(queryPlanner).includes("2dsphere") || JSON.stringify(result).includes("IXSCAN");
        
        console.log(`Uses 2dsphere index: ${isUsingIndex ? '✅ YES' : '❌ NO'}`);
        if (!isUsingIndex) {
             console.log("WARNING: Index is not being utilized properly!");
        }

        console.log("\nSnippet of execution stats:");
        // Print out a brief section to prove it works
        const statsStr = JSON.stringify(result, null, 2);
        console.log(statsStr.substring(0, 1000) + "\n...[truncated]");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runQueryTest();
