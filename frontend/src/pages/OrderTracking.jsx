import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { createPageUrl } from '@/utils';
import { io } from 'socket.io-client';

const STATUS_STEPS = [
  { key: 'PLACED', label: 'Order Placed', icon: '📋', desc: 'Your order has been placed' },
  { key: 'ACCEPTED', label: 'Accepted', icon: '✅', desc: 'Restaurant accepted your order' },
  { key: 'ORDER_PREPARING', label: 'Preparing', icon: '👨‍🍳', desc: 'Chef is preparing your food' },
  { key: 'COURIER_ASSIGNED', label: 'Courier Assigned', icon: '🚴', desc: 'A courier is assigned' },
  { key: 'IN_TRANSIT', label: 'On the Way', icon: '🛵', desc: 'Your order is on its way' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🎉', desc: 'Order delivered successfully!' },
];

export default function OrderTracking() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const orderId = params.get('id');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!orderId) {
      loadLatestOrder();
    } else {
      loadOrder(orderId);
    }

    // Socket connection
    const socket = io('http://localhost:5000');
    socket.on('order_update', (data) => {
      if (data.orderId === orderId) {
        setOrder(prev => prev ? { ...prev, status: data.status } : prev);
        updateStep(data.status);
      }
    });

    return () => socket.disconnect();
  }, [orderId]);

  const loadLatestOrder = async () => {
    try {
      const orders = await api.orders.list();
      if (orders && orders.length > 0) {
        setOrder(orders[0]);
        updateStep(orders[0].status);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadOrder = async (id) => {
    try {
      const orders = await api.orders.filter({ id });
      if (orders && orders.length > 0) {
        setOrder(orders[0]);
        updateStep(orders[0].status);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const updateStep = (status) => {
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    if (idx !== -1) setCurrentStepIndex(idx);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-700">No orders found</h2>
          <button onClick={() => navigate(createPageUrl('Home'))} className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-xl font-bold">
            Order Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">

        <h1 className="text-2xl font-black text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-500 text-sm mb-6">Order #{order._id?.slice(-8)}</p>

        {/* Live status card */}
        <div className={`rounded-2xl p-6 mb-6 text-white ${order.status === 'DELIVERED' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{STATUS_STEPS[currentStepIndex]?.icon}</span>
            <div>
              <p className="text-white/70 text-sm">Current Status</p>
              <h2 className="text-2xl font-black">{STATUS_STEPS[currentStepIndex]?.label}</h2>
              <p className="text-white/80 text-sm mt-1">{STATUS_STEPS[currentStepIndex]?.desc}</p>
            </div>
          </div>
          {order.status !== 'DELIVERED' && (
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white/80 text-sm">Live tracking active</span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Order Timeline</h3>
          <div className="space-y-4">
            {STATUS_STEPS.map((step, i) => {
              const isDone = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step.key} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${isDone ? 'bg-orange-500 border-orange-500' : 'bg-gray-50 border-gray-200'}`}>
                      {isDone ? step.icon : <span className="text-gray-300 text-sm">{i + 1}</span>}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 ${isDone ? 'bg-orange-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pt-2">
                    <p className={`font-bold text-sm ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                    {isCurrent && <p className="text-xs text-orange-500 mt-0.5">{step.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">{item.name} × {item.quantity}</span>
              <span className="font-semibold">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-black">
            <span>Total Paid</span>
            <span className="text-orange-500">₹{order.totalAmount}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">📍 {order.deliveryAddress}</p>
        </div>

        {/* Review button after delivery */}
        {order.status === 'DELIVERED' && (
          <button
            onClick={() => navigate(`${createPageUrl('Profile')}?tab=orders`)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl"
          >
            ⭐ Leave a Review & Earn Points
          </button>
        )}
      </div>
    </div>
  );
}