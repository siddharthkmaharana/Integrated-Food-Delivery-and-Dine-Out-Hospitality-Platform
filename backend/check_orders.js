import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const orderSchema = new mongoose.Schema({ status: String, courier: mongoose.Schema.Types.ObjectId, restaurantName: String }, { strict: false });
const Order = mongoose.model('Order', orderSchema);

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const orders = await Order.find({ 
            $or: [
                { courier: null },
                { courier: { $exists: false } }
            ], 
            status: { $in: ['PREPARING', 'READY_FOR_PICKUP'] } 
        });
        console.log('Available Orders for Couriers Count:', orders.length);
        console.log(JSON.stringify(orders, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
