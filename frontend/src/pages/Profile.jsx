import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const defaultTab = params.get('tab') || 'profile';

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [reviewForm, setReviewForm] = useState({ orderId: '', restaurantId: '', rating: 5, reviewText: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const u = await api.auth.me();
      setUser(u);
      setEditForm({ name: u?.name || '' });
      if (u?._id) {
        const [o, r] = await Promise.all([
          api.orders.filter({ userId: u._id }),
          api.reservations.filter({ user: u._id })
        ]);
        setOrders(Array.isArray(o) ? o : []);
        setReservations(Array.isArray(r) ? r : []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.auth.updateMe(editForm);
      setUser(updated);
      setEditMode(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleSubmitReview = async () => {
    setSaving(true);
    try {
      await api.reviews.create({
        restaurant: reviewForm.restaurantId,
        order: reviewForm.orderId,
        rating: reviewForm.rating,
        reviewText: reviewForm.reviewText
      });
      setSuccessMsg('Review submitted! Loyalty points awarded!');
      setShowReviewForm(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadData();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const statusColors = {
    PLACED: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-orange-100 text-orange-700',
    ORDER_PREPARING: 'bg-yellow-100 text-yellow-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    IN_TRANSIT: 'bg-purple-100 text-purple-700',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-700">Please login first</h2>
          <button onClick={() => navigate(createPageUrl('Login'))} className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-xl font-bold">
            Login
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'profile', label: '👤 Profile' },
    { key: 'orders', label: '📦 My Orders' },
    { key: 'reservations', label: '🪑 Reservations' },
    { key: 'reviews', label: '⭐ Reviews' },
    { key: 'loyalty', label: '🎁 Loyalty Points' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black">{user.name}</h1>
              <p className="text-white/80 text-sm">{user.email}</p>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full capitalize font-semibold mt-1 inline-block">{user.role}</span>
            </div>
            <div className="ml-auto text-right">
              <p className="text-white/70 text-xs">Loyalty Points</p>
              <p className="text-3xl font-black">{user.loyaltyPoints || 0}</p>
              <p className="text-white/70 text-xs">🏆 points earned</p>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl mb-4 text-sm font-semibold">
            ✅ {successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">My Profile</h2>
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-orange-500 text-sm font-bold border border-orange-200 px-3 py-1.5 rounded-xl"
              >
                {editMode ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-orange-500 text-white font-bold px-6 py-2 rounded-xl disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'Full Name', value: user.name, icon: '👤' },
                  { label: 'Email', value: user.email, icon: '📧' },
                  { label: 'Role', value: user.role, icon: '🏷️' },
                  { label: 'Loyalty Points', value: `${user.loyaltyPoints || 0} points`, icon: '🏆' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                      <p className="font-semibold text-gray-800 capitalize">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-gray-900">My Orders ({orders.length})</h2>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <div className="text-5xl mb-3">📦</div>
                <p className="text-gray-500">No orders yet</p>
                <button onClick={() => navigate(createPageUrl('Home'))} className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold">Order Now</button>
              </div>
            ) : orders.map(order => (
              <div key={order._id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{order.restaurant?.name || 'Restaurant'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">#{order._id?.slice(-8)} · {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    <p className="font-black text-orange-500 mt-1">₹{order.totalAmount}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {order.items?.map(i => `${i.name} ×${i.quantity}`).join(', ')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`${createPageUrl('OrderTracking')}?id=${order._id}`)}
                    className="flex-1 border border-orange-200 text-orange-500 text-xs font-bold py-2 rounded-xl"
                  >
                    Track Order
                  </button>
                  {order.status === 'DELIVERED' && (
                    <button
                      onClick={() => {
                        setReviewForm({ orderId: order._id, restaurantId: order.restaurant?._id, rating: 5, reviewText: '' });
                        setShowReviewForm(true);
                        setActiveTab('reviews');
                      }}
                      className="flex-1 bg-purple-500 text-white text-xs font-bold py-2 rounded-xl"
                    >
                      ⭐ Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-gray-900">My Reservations ({reservations.length})</h2>
            {reservations.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <div className="text-5xl mb-3">🪑</div>
                <p className="text-gray-500">No reservations yet</p>
                <button onClick={() => navigate(createPageUrl('TableBooking'))} className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold">Book a Table</button>
              </div>
            ) : reservations.map(res => (
              <div key={res._id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">{res.restaurant?.name || 'Restaurant'}</p>
                    <p className="text-sm text-gray-500 mt-1">📅 {res.date} at {res.time}</p>
                    <p className="text-sm text-gray-500">👥 {res.guests} guests</p>
                    {res.specialRequests && <p className="text-xs text-gray-400 mt-1">"{res.specialRequests}"</p>}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${res.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : res.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {res.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-gray-900">My Reviews</h2>

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-orange-200">
                <h3 className="font-bold text-gray-900 mb-4">⭐ Write a Review</h3>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className={`text-2xl transition-transform hover:scale-110 ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Review (10+ words = bonus points!)</label>
                  <textarea
                    rows={3}
                    placeholder="Write your review... use keywords like 'delicious', 'fresh', 'quick' for bonus loyalty points!"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    value={reviewForm.reviewText}
                    onChange={e => setReviewForm({ ...reviewForm, reviewText: e.target.value })}
                  />
                  <p className="text-xs text-gray-400 mt-1">Words: {reviewForm.reviewText.trim().split(/\s+/).filter(Boolean).length}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSubmitReview} disabled={saving} className="flex-1 bg-orange-500 text-white font-bold py-2 rounded-xl disabled:opacity-50">
                    {saving ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button onClick={() => setShowReviewForm(false)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-2 rounded-xl">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {reviews.length === 0 && !showReviewForm && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <div className="text-5xl mb-3">⭐</div>
                <p className="text-gray-500">No reviews yet</p>
                <p className="text-xs text-gray-400 mt-1">Complete an order to leave a review</p>
              </div>
            )}
          </div>
        )}

        {/* Loyalty Tab */}
        {activeTab === 'loyalty' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
              <h2 className="text-xl font-black mb-1">🏆 Loyalty Points</h2>
              <p className="text-white/80 text-sm mb-4">Earn points by writing reviews!</p>
              <div className="text-5xl font-black">{user.loyaltyPoints || 0}</div>
              <p className="text-white/70 text-sm">Total Points Earned</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">How to Earn Points</h3>
              <div className="space-y-3">
                {[
                  { icon: '✍️', title: 'Write a Review', points: 'Up to 45 points', desc: 'More words + keywords = more points' },
                  { icon: '🔑', title: 'Use Bonus Keywords', points: '+5 per keyword', desc: 'delicious, fresh, quick, amazing...' },
                  { icon: '📝', title: 'Write 10+ Words', points: 'Base points', desc: 'Minimum 10 words to earn any points' },
                ].map(item => (
                  <div key={item.title} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    <span className="text-orange-500 font-bold text-sm">{item.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}