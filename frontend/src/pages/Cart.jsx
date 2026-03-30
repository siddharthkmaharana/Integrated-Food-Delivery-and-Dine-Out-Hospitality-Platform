import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [restaurantName, setRestaurantName] = useState('');

  useEffect(() => {
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('foodhub_cart') || '[]');
    const savedName = localStorage.getItem('foodhub_restaurant_name') || '';
    setCart(savedCart);
    setRestaurantName(savedName);
  };

  const updateQuantity = (itemId, delta) => {
    const newCart = cart.map(item => {
      if (item._id === itemId) return { ...item, quantity: item.quantity + delta };
      return item;
    }).filter(item => item.quantity > 0);

    setCart(newCart);
    localStorage.setItem('foodhub_cart', JSON.stringify(newCart));
    if (newCart.length === 0) {
      localStorage.removeItem('foodhub_restaurant_id');
      localStorage.removeItem('foodhub_restaurant_name');
    }
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (itemId) => {
    const newCart = cart.filter(item => item._id !== itemId);
    setCart(newCart);
    localStorage.setItem('foodhub_cart', JSON.stringify(newCart));
    if (newCart.length === 0) {
      localStorage.removeItem('foodhub_restaurant_id');
      localStorage.removeItem('foodhub_restaurant_name');
    }
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('foodhub_cart');
    localStorage.removeItem('foodhub_restaurant_id');
    localStorage.removeItem('foodhub_restaurant_name');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee = total > 500 ? 0 : 40;
  const grandTotal = total + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-12 h-12 text-orange-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-400 mb-6">Add items from a restaurant to get started</p>
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-8 py-3 rounded-xl"
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Your Cart</h1>
            <p className="text-gray-500 text-sm">{restaurantName} · {totalItems} items</p>
          </div>
          <button onClick={clearCart} className="text-red-400 text-sm font-bold flex items-center gap-1">
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>

        {/* Cart Items */}
        <div className="space-y-3 mb-6">
          {cart.map(item => (
            <div key={item._id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-red-100 flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                <p className="text-orange-500 font-black">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item._id, -1)} className="w-8 h-8 bg-orange-100 text-orange-500 rounded-lg flex items-center justify-center">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-black text-gray-900 w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item._id, 1)} className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="text-right">
                <p className="font-black text-gray-900">₹{item.price * item.quantity}</p>
                <button onClick={() => removeItem(item._id)} className="text-red-400 mt-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
          <h3 className="font-black text-gray-900 mb-4">Bill Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Item Total ({totalItems} items)</span>
              <span>₹{total}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span className={deliveryFee === 0 ? 'text-green-500 font-bold' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
            </div>
            {deliveryFee > 0 && (
              <p className="text-xs text-green-500">Add ₹{500 - total} more for free delivery!</p>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-gray-900 text-base">
              <span>Grand Total</span>
              <span className="text-orange-500">₹{grandTotal}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate(createPageUrl('Checkout'))}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-200 text-lg"
        >
          Proceed to Checkout → ₹{grandTotal}
        </button>
      </div>
    </div>
  );
}