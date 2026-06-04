import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, default: '' },
  comment: { type: String },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  // ── Media Upload (Project 2 Requirement) ─────────────────────────────────
  // Presence of uploaded media contributes bonus points to the reward score.
  hasMedia: { type: Boolean, default: false },
  mediaUrl: { type: String, default: '' },  // S3 URL or local path
  // ─────────────────────────────────────────────────────────────────────────
  rewardPoints: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);