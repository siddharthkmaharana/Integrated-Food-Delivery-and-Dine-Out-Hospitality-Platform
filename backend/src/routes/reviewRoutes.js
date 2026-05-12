import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Review from '../models/Review.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import { protect } from '../middleware/authMiddleware.js';
import upload, { getFileUrl } from '../middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Serve locally stored media (development fallback)
// In production the S3 URL is returned directly — this route is not needed.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/media/:filename', (req, res) => {
  const filePath = path.join(__dirname, '..', '..', 'uploads', req.params.filename);
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).json({ message: 'Media file not found' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reviews/restaurant/:id  — all reviews for a restaurant
// ─────────────────────────────────────────────────────────────────────────────
router.get('/restaurant/:id', async (req, res) => {
  try {
    const reviews = await Review.find({ restaurant: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reviews  — filtered reviews
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.restaurant) filter.restaurant = req.query.restaurant;
    const reviews = await Review.find(filter).populate('user', 'name');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reviews/suggestions/:orderId
// AI keyword suggestions based on ordered items (Project 2 — Week 3 requirement)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/suggestions/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const itemNames = order.items.map(item => item.name.toLowerCase());
    const suggestions = [];

    if (itemNames.some(n => n.includes('chicken') || n.includes('mutton') || n.includes('fish'))) {
      suggestions.push('tender', 'juicy', 'well-cooked', 'spicy', 'flavorful');
    }
    if (itemNames.some(n => n.includes('pizza') || n.includes('burger') || n.includes('sandwich'))) {
      suggestions.push('crispy', 'fresh', 'cheesy', 'filling', 'delicious');
    }
    if (itemNames.some(n => n.includes('biryani') || n.includes('rice') || n.includes('curry'))) {
      suggestions.push('aromatic', 'authentic', 'rich', 'flavorful', 'generous');
    }

    const defaultSuggestions = ['quick delivery', 'hot food', 'good packaging', 'value for money', 'would order again'];
    const allSuggestions = [...new Set([...suggestions, ...defaultSuggestions])];

    res.json({
      suggestions: allSuggestions,
      tip: 'Use these keywords in your review to earn bonus loyalty points! Add a photo for +15 extra points!'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reviews  — create review with optional image upload
//
// Scoring Algorithm (Project 2 — Week 3 requirement):
//   • 1 point per word (max 20 pts)
//   • 5 points per bonus keyword match (max 30 pts)
//   • +15 points for uploading media (presence of image)
//   Total possible: 65 points
//
// Accepts multipart/form-data when an image is included, or JSON otherwise.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', protect, upload.single('media'), async (req, res) => {
  try {
    const { restaurant, order: orderId, rating, reviewText } = req.body;

    // ── 1. Validate and find the qualifying order ────────────────────────────
    let validOrder;
    if (orderId) {
      validOrder = await Order.findOne({
        _id: orderId,
        customer: req.user._id,
        restaurant,
        status: { $in: ['DELIVERED', 'delivered'] }
      });
      if (!validOrder) {
        return res.status(400).json({ message: 'Order not found, not delivered, or not yours.' });
      }
      if (validOrder.review?.submitted) {
        return res.status(400).json({ message: 'You have already reviewed this order.' });
      }
    } else {
      // Find latest unreviewed delivered order for this restaurant
      validOrder = await Order.findOne({
        customer: req.user._id,
        restaurant,
        status: { $in: ['DELIVERED', 'delivered'] },
        'review.submitted': { $ne: true }
      }).sort({ createdAt: -1 });

      if (!validOrder) {
        return res.status(403).json({ message: 'You can only review restaurants after receiving an order from them.' });
      }
    }

    // ── 2. Calculate Reward Points ────────────────────────────────────────────
    const words = reviewText?.trim().split(/\s+/).filter(Boolean) || [];
    const bonusKeywords = ['delicious', 'amazing', 'fresh', 'hot', 'spicy', 'tasty',
                           'excellent', 'perfect', 'quick', 'friendly'];
    const lowerWords = words.map(w => w.toLowerCase().replace(/[.,!?]/g, ''));
    const keywordMatches = lowerWords.filter(w => bonusKeywords.includes(w)).length;

    // Base points: 1 pt/word (max 20) + 5 pts/keyword (max 30)
    let rewardPoints = 0;
    if (words.length >= 5) { // Minimum 5 words to qualify for points
      rewardPoints = Math.min(words.length, 20) + Math.min(keywordMatches * 5, 30);
    }

    // ── Media bonus (Project 2 core requirement) ──────────────────────────────
    const hasMedia = !!req.file;
    const mediaUrl = hasMedia ? getFileUrl(req.file, req) : '';
    if (hasMedia) {
      rewardPoints += 15; // +15 points for uploading a photo
    }

    // ── 3. Sentiment Analysis ────────────────────────────────────────────────
    let sentiment = 'neutral';
    const lowerText = reviewText?.toLowerCase() || '';
    const posWords = ['good', 'great', 'excellent', 'amazing', 'delicious', 'fresh', 'hot', 'quick', 'friendly', 'tasty'];
    const negWords = ['bad', 'poor', 'cold', 'late', 'rude', 'unpleasant', 'wrong', 'oily', 'expensive', 'salty'];

    const posCount = posWords.filter(w => lowerText.includes(w)).length;
    const negCount = negWords.filter(w => lowerText.includes(w)).length;

    if (parseInt(rating) >= 4 || posCount > negCount) sentiment = 'positive';
    else if (parseInt(rating) <= 2 || negCount > posCount) sentiment = 'negative';

    // ── 4. Create Review ─────────────────────────────────────────────────────
    const review = await Review.create({
      user: req.user._id,
      restaurant,
      order: validOrder._id,
      rating: parseInt(rating),
      reviewText,
      rewardPoints,
      sentiment,
      hasMedia,
      mediaUrl
    });

    // ── 5. Update Restaurant Stats ────────────────────────────────────────────
    const allReviews = await Review.find({ restaurant });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Restaurant.findByIdAndUpdate(restaurant, {
      rating: parseFloat(avgRating.toFixed(1)),
      totalReviews: allReviews.length
    });

    // ── 6. Award Loyalty Points to User ──────────────────────────────────────
    await User.findByIdAndUpdate(req.user._id, { $inc: { loyaltyPoints: rewardPoints } });

    // ── 7. Mark Order as Reviewed ─────────────────────────────────────────────
    await Order.findByIdAndUpdate(validOrder._id, {
      'review.submitted': true,
      'review.points': rewardPoints,
      'review.Text': reviewText
    });

    // ── 8. Build response message ─────────────────────────────────────────────
    const pointBreakdown = [];
    if (words.length >= 5) pointBreakdown.push(`${Math.min(words.length, 20)} word pts`);
    if (keywordMatches > 0) pointBreakdown.push(`${Math.min(keywordMatches * 5, 30)} keyword pts`);
    if (hasMedia) pointBreakdown.push('15 photo pts');

    const message = rewardPoints > 0
      ? `You earned ${rewardPoints} loyalty points! (${pointBreakdown.join(' + ')})`
      : 'Review submitted successfully.';

    res.status(201).json({
      ...review.toObject(),
      message
    });
  } catch (error) {
    // Handle multer errors (file type / size)
    if (error.message?.includes('Only JPEG')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

export default router;