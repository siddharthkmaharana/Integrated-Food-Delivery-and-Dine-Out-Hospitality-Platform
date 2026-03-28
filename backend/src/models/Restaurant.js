import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true, trim: true },
  cuisine: [{ type: String }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: true },
  address: { type: String, required: true },
  image: { type: String, default: '' },
  delivery_time: { type: Number, default: 30 },   // ← add this
  delivery_fee: { type: Number, default: 0 },      // ← add this
  price_range: { type: String, default: '$$' },    // ← add this
  location: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true }
  }
}, { timestamps: true });

restaurantSchema.index({ location: '2dsphere' });

export default mongoose.model('Restaurant', restaurantSchema);