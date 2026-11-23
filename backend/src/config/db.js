import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return;
    }
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 8000,
        });
        isConnected = conn.connection.readyState;
        console.log(`mongodb connected: ${conn.connection.host}`); 
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        throw error;
    }       
};

export default connectDB;

