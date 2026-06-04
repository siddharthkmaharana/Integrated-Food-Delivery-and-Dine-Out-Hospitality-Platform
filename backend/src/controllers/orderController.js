import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';

const createOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, phoneNumber, addressComponents } = req.body;

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
      phoneNumber,
      status: 'PENDING',
      paymentStatus: 'PENDING'
    });

    // Update User persistent info
    if (phoneNumber || addressComponents) {
      await User.findByIdAndUpdate(req.user._id, {
        phoneNumber: phoneNumber,
        address: addressComponents
      });
    }

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
    const { status: rawStatus } = req.body;
    const status = rawStatus.toUpperCase();
    
    // We need to populate customer to get their location
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
        .populate('customer', 'name location');
        
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const io = req.app.get('io');
    io.emit('order_update', {
      orderId: order._id,
      status,
      timestamp: new Date()
    });

    // Notify couriers if PREPARING or READY_FOR_PICKUP
    if (status === 'PREPARING' || status === 'READY_FOR_PICKUP') {
      const restaurant = await Restaurant.findById(order.restaurant);
      const notificationData = {
        orderId: order._id,
        restaurantName: restaurant?.name || order.restaurantName || "FoodHub Restaurant",
        deliveryAddress: order.deliveryAddress,
        totalAmount: order.totalAmount,
        location: restaurant?.location,
        customerLocation: order.customer?.location,
        items: order.items,
        status: order.status,
        timestamp: new Date()
      };
      
      console.log("Emitting new_delivery_available:", notificationData.orderId);
      io.emit('new_delivery_available', notificationData);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('restaurant', 'name address location')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.restaurant_id) filter.restaurant = req.query.restaurant_id;
    if (req.query.status) filter.status = req.query.status;
    
    // If not admin/courier/restaurant, restrict to their own orders securely
    if (req.user.role === 'customer' && !req.query.restaurant_id) {
       filter.customer = req.user._id;
    }

    // Courier specific: can see their assigned orders OR unassigned READY_FOR_PICKUP/PREPARING orders
    if (req.user.role === 'courier') {
       filter.$or = [
         { courier: req.user._id },
         { 
           status: { $in: ['READY_FOR_PICKUP', 'PREPARING'] }, 
           $or: [
             { courier: { $exists: false } },
             { courier: null }
           ],
           rejectedBy: { $ne: req.user._id } 
         }
       ];
    }
    
    // Limits
    const limit = parseInt(req.query.limit) || 100;

    const orders = await Order.find(filter)
      .populate('restaurant', 'name address location')
      .populate('customer', 'name email location')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json({
      data: orders,
      debug: {
        filter,
        user: req.user._id,
        role: req.user.role,
        count: orders.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name address location')
      .populate('customer', 'name email location');
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

const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name location')
      .populate('customer', 'name location');
      
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.courier) return res.status(400).json({ message: 'Order already assigned' });
    if (order.status !== 'READY_FOR_PICKUP' && order.status !== 'PREPARING') {
       return res.status(400).json({ message: 'Order not ready' });
    }

    order.courier = req.user._id;
    // Don't override status if it's PREPARING, just assign courier. Wait, the frontend might expect COURIER_ASSIGNED or just leave it as PREPARING/PICKED_UP. Let's keep it PREPARING if it was PREPARING, so the map shows "PREPARING"
    // Actually, let's keep the existing status so the map logic in CourierDashboard triggers.
    // Wait, if we set it to COURIER_ASSIGNED, the map won't show! 
    // In CourierDashboard: `(o.status === "PREPARING" || o.status === "PICKED_UP" || o.status === "DELIVERING") && <DeliveryMap />`
    // So if we change it to COURIER_ASSIGNED, the map DISAPPEARS. 
    // We should just leave the status as is, and just set the courier.
    // No wait, the frontend does: `updateOrderStatus(o._id, "PICKED_UP")`. 
    // So if it stays PREPARING, it's perfect.
    
    // Save the original status to emit
    const emitStatus = order.status;
    await order.save();

    const io = req.app.get('io');
    io.emit('order_update', { orderId: order._id, status: emitStatus, courierId: req.user._id });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.rejectedBy.includes(req.user._id)) {
      order.rejectedBy.push(req.user._id);
      await order.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createOrder, payOrder, updateOrderStatus, getMyOrders, getAllOrders, getOrderById, getOrdersByUser, updateOrder, acceptOrder, rejectOrder };