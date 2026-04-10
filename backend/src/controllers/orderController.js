import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';

const createOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) return res.status(404).json({ message: `Menu item not found: ${item.menuItemId}` });
      if (!menuItem.isAvailable) return res.status(400).json({ message: `${menuItem.name} is not available` });

      totalAmount += menuItem.price * item.quantity;
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity
      });
    }

    const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryFee = restaurant.delivery_fee || 2.99;
    const tax = subtotal * 0.08;
    totalAmount = subtotal + deliveryFee + tax;

    const order = await Order.create({
      customer: req.user._id,
      restaurant: restaurantId,
      restaurantName: restaurant.name,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      deliveryAddress,
      status: 'PENDING',
      paymentStatus: 'PENDING'
    });

    const io = req.app.get('io');
    const newOrderEventData = {
      orderId: order._id,
      customerName: req.user.name,
      items: orderItems,
      totalAmount,
      deliveryAddress
    };
    
    // Emit specifically to the restaurant
    io.to(restaurantId).emit('new_order', newOrderEventData);
    
    // Also emit globally for admins
    io.emit('new_order', newOrderEventData);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const payOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const paymentSuccess = Math.random() < 0.9;

    if (paymentSuccess) {
      order.paymentStatus = 'PAID';
      order.status = 'ACCEPTED';
      await order.save();

      const io = req.app.get('io');
      io.emit('order_update', {
        orderId: order._id,
        status: 'ACCEPTED',
        paymentStatus: 'PAID',
        timestamp: new Date()
      });

      return res.json({ success: true, message: 'Payment successful!', data: order });
    } else {
      order.paymentStatus = 'FAILED';
      await order.save();
      return res.status(400).json({ success: false, message: 'Payment failed. Please try again.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const io = req.app.get('io');
    io.emit('order_update', {
      orderId: order._id,
      status,
      timestamp: new Date()
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('restaurant', 'name address')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name address')
      .populate('customer', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.params.userId })
      .populate('restaurant', 'name address')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const io = req.app.get('io');
    io.emit('order_update', { orderId: order._id, status: order.status });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createOrder, payOrder, updateOrderStatus, getMyOrders, getOrderById, getOrdersByUser, updateOrder };