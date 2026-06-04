import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    date: { type: Date, required: true },
    startTime: { type: String },
    endTime: { type: String },
    type: { 
        type: String, 
        enum: ['Food Festival', 'Happy Hour', 'Live Music', 'Chef Special', 'Holiday Event', 'Other'],
        default: 'Other'
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' }
    },
    is_active: { type: Boolean, default: true },
    capacity: { type: Number },
    rsvp_count: { type: Number, default: 0 },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
