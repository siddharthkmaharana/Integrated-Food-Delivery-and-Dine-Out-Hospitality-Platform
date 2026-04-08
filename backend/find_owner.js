import mongoose from 'mongoose';
import Restaurant from './src/models/Restaurant.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to:", mongoose.connection.name);
        const count = await Restaurant.countDocuments();
        console.log("Restaurant count:", count);
        const r = await Restaurant.findOne();
        if (r) {
            console.log("First restaurant:", JSON.stringify(r));
            const u = await User.findById(r.owner);
            if (u) {
                console.log("Owner found:", u.email);
            } else {
                console.log("Owner NOT found for ID:", r.owner);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
