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
  is_open: { type: Boolean, default: true },
  is_approved: { type: Boolean, default: false },
  address: { type: String, required: true },
  image: { type: String, default: '' },
  delivery_time: { type: Number, default: 30 },
  delivery_fee: { type: Number, default: 0 },
  price_range: { type: String, default: '$$' },
  location: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true }
  }
}, { timestamps: true });

restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ owner: 1 });

export default mongoose.model('Restaurant', restaurantSchema);