import express from 'express';
import Reservation from '../models/Reservation.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.user) filter.user = req.query.user;
    if (req.query.restaurant) filter.restaurant = req.query.restaurant;
    const reservations = await Reservation.find(filter)
      .populate('restaurant', 'name address')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const reservation = await Reservation.create({ ...req.body, user: req.user._id });
    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;