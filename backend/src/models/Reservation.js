import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  guests: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], default: 'PENDING' },
  specialRequests: { type: String, default: '' }
}, { timestamps: true });

reservationSchema.index({ restaurant: 1, createdAt: -1 });
reservationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Reservation', reservationSchema);