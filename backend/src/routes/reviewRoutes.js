import express from 'express';
import Review from '../models/Review.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

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

// AI keyword suggestions based on ordered items
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
      tip: 'Use these keywords in your review to earn bonus loyalty points!'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { restaurant, order, rating, reviewText } = req.body;

    const words = reviewText?.trim().split(/\s+/) || [];
    const bonusKeywords = ['delicious', 'amazing', 'fresh', 'hot', 'spicy', 'tasty', 'excellent', 'perfect', 'quick', 'friendly'];
    const keywordMatches = words.filter(w => bonusKeywords.includes(w.toLowerCase())).length;
    const rewardPoints = words.length >= 10
      ? Math.min(words.length, 20) + Math.min(keywordMatches * 5, 25)
      : 0;

    const review = await Review.create({
      user: req.user._id,
      restaurant,
      order,
      rating,
      reviewText,
      rewardPoints
    });

    const allReviews = await Review.find({ restaurant });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Restaurant.findByIdAndUpdate(restaurant, {
      rating: parseFloat(avgRating.toFixed(1)),
      totalReviews: allReviews.length
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { loyaltyPoints: rewardPoints } });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;