import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { createPageUrl } from '@/utils';

export default function Checkout() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1=address, 2=payment, 3=success

  const cart = JSON.parse(localStorage.getItem('foodhub_cart') || '[]');
  const restaurantId = localStorage.getItem('foodhub_restaurant_id');
  const restaurantName = localStorage.getItem('foodhub_restaurant_name');

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!address.trim()) return setError('Please enter delivery address');
    setLoading(true);
    setError('');
    try {
      const items = cart.map(item => ({
        menuItemId: item._id,
        quantity: item.quantity
      }));
      const orderData = await api.orders.create({
        restaurantId,
        items,
        deliveryAddress: address
      });
      setOrder(orderData);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    setError('');
    try {
      await api.orders.update(order._id, { paymentStatus: 'PAID', status: 'ACCEPTED' });
      localStorage.removeItem('foodhub_cart');
      localStorage.removeItem('foodhub_restaurant_id');
      localStorage.removeItem('foodhub_restaurant_name');
      window.dispatchEvent(new Event('cartUpdated'));
      setStep(3);
    } catch (err) {
      setError('Payment failed. Please try again.');
    }
    setPaymentLoading(false);
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-700">Your cart is empty</h2>
          <button onClick={() => navigate(createPageUrl('Home'))} className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-xl font-bold">
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {['Delivery', 'Payment', 'Confirmed'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step > i ? 'bg-orange-500 text-white' : step === i + 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-semibold ${step === i + 1 ? 'text-orange-500' : 'text-gray-400'}`}>{s}</span>
              {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Address */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6">📍 Delivery Address</h2>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">⚠️ {error}</div>}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address</label>
              <textarea
                rows={3}
                placeholder="Enter your complete delivery address..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            {/* Order Summary */}
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-3">Order Summary — {restaurantName}</h3>
              {cart.map(item => (
                <div key={item._id} className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.name} × {item.quantity}</span>
                  <span className="font-semibold">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-orange-200 mt-3 pt-3 flex justify-between font-black text-gray-900">
                <span>Total</span>
                <span className="text-orange-500">₹{total}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
            >
              {loading ? 'Placing Order...' : 'Proceed to Payment →'}
            </button>
          </div>
        )}

        {/* Step 2 — Payment */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6">💳 Payment</h2>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">⚠️ {error}</div>}

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500 text-sm">Order ID</span>
                <span className="text-xs font-mono text-gray-600">{order?._id?.slice(-8)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500 text-sm">Delivery to</span>
                <span className="text-sm font-semibold text-gray-700 text-right max-w-[60%]">{address}</span>
              </div>
              <div className="flex justify-between font-black text-lg mt-3 pt-3 border-t border-gray-200">
                <span>Amount to Pay</span>
                <span className="text-orange-500">₹{total}</span>
              </div>
            </div>

            {/* Payment methods */}
            <div className="space-y-3 mb-6">
              {['💳 Credit / Debit Card', '📱 UPI / QR Code', '💰 Cash on Delivery'].map((method, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${i === 0 ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                  <span className="text-lg">{method.split(' ')[0]}</span>
                  <span className="text-sm font-semibold text-gray-700">{method.split(' ').slice(1).join(' ')}</span>
                  {i === 0 && <span className="ml-auto text-orange-500 text-xs font-bold">Selected</span>}
                </div>
              ))}
            </div>

            <button
              onClick={handlePayment}
              disabled={paymentLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
            >
              {paymentLoading ? 'Processing...' : `Pay ₹${total} Now`}
            </button>
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Order Placed!</h2>
            <p className="text-gray-500 mb-6">Your order has been placed successfully. Track it in real-time!</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(createPageUrl('OrderTracking'))}
                className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-xl"
              >
                Track Order 📍
              </button>
              <button
                onClick={() => navigate(createPageUrl('Home'))}
                className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}