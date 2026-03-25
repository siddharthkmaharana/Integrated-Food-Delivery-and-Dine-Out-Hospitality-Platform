import express from 'express';
import {
    getRestaurants,
    getRestaurantById,
    createRestaurant,
    updateRestaurant
} from '../controllers/restaurantController.js';

import {
    getMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem
} from '../controllers/menuController.js';

const router = express.Router();

//Restaurant routes
router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);
router.post('/', Protect, authorize('restaurant'), createRestaurant);
router.put('/:id', protect,authorize('restaurant'), updateRestaurant);

//Menu routes
router.get('/', getMenuItems);
router.post('/:id/menu', protect,authorize('restaurant'), addMenuItem);
router.put('/:id/menu/:itemId', protect, authorize('restaurant'), updateMenuItem);
router.delete('/:id/menu/:itemId', protect ,authorize('restaurant'), deleteMenuItem);

export default router;
