import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getRestaurants,
    getRestaurantById,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getRecommendations
} from '../controllers/restaurantController.js';
import {
    getMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem
} from '../controllers/menuController.js';

const router = express.Router();

// Restaurant routes
router.get('/', getRestaurants);
router.get('/recommendations', protect, getRecommendations);
router.get('/:id', getRestaurantById);
router.post('/', protect, authorize('restaurant', 'admin'), createRestaurant);
router.put('/:id', protect, authorize('restaurant', 'admin'), updateRestaurant);
router.delete('/:id', protect, authorize('admin'), deleteRestaurant);

// Menu routes
router.get('/:id/menu', getMenuItems);  
router.post('/:id/menu', protect, authorize('restaurant', 'admin'), addMenuItem);
router.put('/:id/menu/:itemId', protect, authorize('restaurant', 'admin'), updateMenuItem);
router.delete('/:id/menu/:itemId', protect, authorize('restaurant', 'admin'), deleteMenuItem);

export default router;