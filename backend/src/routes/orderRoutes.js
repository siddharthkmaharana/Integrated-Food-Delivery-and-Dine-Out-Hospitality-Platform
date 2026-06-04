import express from 'express';
import {
  createOrder,
  payOrder,
  updateOrderStatus,
  getMyOrders,
  getAllOrders,
  getOrderById,
  getOrdersByUser,
  updateOrder,
  acceptOrder,
  rejectOrder
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllOrders);
router.get('/myorders', protect, getMyOrders);
router.get('/user/:userId', protect, getOrdersByUser);
router.get('/:id', protect, getOrderById);
router.post('/', protect, createOrder);
router.post('/:id/pay', protect, payOrder);
router.put('/:id', protect, updateOrder);
router.put('/:id/status', protect, authorize('restaurant', 'courier', 'admin'), updateOrderStatus);
router.post('/:id/accept', protect, authorize('courier'), acceptOrder);
router.post('/:id/reject', protect, authorize('courier'), rejectOrder);

export default router;