import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { assignRestaurantOwner, getAllUsers } from '../controllers/adminController.js';

const router = express.Router();

// All routes here are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.post('/assign-owner', assignRestaurantOwner);

export default router;
