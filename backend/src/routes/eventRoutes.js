import express from 'express';
import { createEvent, getEvents, getEventById, deleteEvent, rsvpEvent } from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/:id/rsvp', protect, rsvpEvent);
router.delete('/:id', protect, deleteEvent);

export default router;
