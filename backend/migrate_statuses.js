import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const orderSchema = new mongoose.Schema({ status: String }, { strict: false });
const Order = mongoose.model('Order', orderSchema);

async function migrate() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        const orders = await Order.find({});
        console.log('Found', orders.length, 'orders total');

        let updatedCount = 0;
        for (const order of orders) {
            if (order.status) {
                const oldStatus = order.status;
                const newStatus = oldStatus.toUpperCase();
                
                if (oldStatus !== newStatus) {
                    await Order.updateOne({ _id: order._id }, { $set: { status: newStatus } });
                    updatedCount++;
                }
            }
        }

        console.log('Migration complete. Updated', updatedCount, 'orders.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
