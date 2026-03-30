import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { createPageUrl } from '@/utils';
import { Star, Clock, MapPin, ShoppingCart, Plus, Minus } from 'lucide-react';

export default function RestaurantDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const restaurantId = params.get('id');

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartError, setCartError] = useState('');

  useEffect(() => {
    if (restaurantId) loadData();
  }, [restaurantId]);

  const loadData = async () => {
    try {
      const [r, m, rev] = await Promise.all([
        api.restaurants.getById(restaurantId),
        api.menuItems.filter({ restaurant: restaurantId }),
        api.reviews.filter({ restaurant_id: restaurantId })
      ]);
      setRestaurant(r);
      setMenuItems(Array.isArray(m) ? m : []);
      setReviews(Array.isArray(rev) ? rev : []);

      const savedCart = JSON.parse(localStorage.getItem('foodhub_cart') || '[]');
      const savedRestaurantId = localStorage.getItem('foodhub_restaurant_id');
      if (savedRestaurantId === restaurantId) {
        const cartObj = {};
        savedCart.forEach(item => { cartObj[item._id] = item.quantity; });
        setCart(cartObj);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];

  const filteredItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  const addToCart = (item) => {
    const savedRestaurantId = localStorage.getItem('foodhub_restaurant_id');
    if (savedRestaurantId && savedRestaurantId !== restaurantId) {
      setCartError('Clear your cart first! You can only order from one restaurant at a time.');
      setTimeout(() => setCartError(''), 3000);
      return;
    }

    const newCart = { ...cart, [item._id]: (cart[item._id] || 0) + 1 };
    setCart(newCart);
    saveCart(newCart, item);
  };

  const removeFromCart = (item) => {
    const newCart = { ...cart };
    if (newCart[item._id] > 1) {
      newCart[item._id]--;
    } else {
      delete newCart[item._id];
    }
    setCart(newCart);
    saveCart(newCart, item);
  };

  const saveCart = (cartObj, item) => {
    const items = menuItems
      .filter(m => cartObj[m._id])
      .map(m => ({ ...m, quantity: cartObj[m._id] }));

    localStorage.setItem('foodhub_cart', JSON.stringify(items));
    localStorage.setItem('foodhub_restaurant_id', restaurantId);
    localStorage.setItem('foodhub_restaurant_name', restaurant?.name || '');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const totalItems = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const totalPrice = menuItems
    .filter(m => cart[m._id])
    .reduce((sum, m) => sum + m.price * cart[m._id], 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-gray-700">Restaurant not found</h2>
          <button onClick={() => navigate(createPageUrl('Home'))} className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-xl font-bold">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="relative h-56 bg-gradient-to-br from-orange-400 to-red-500">
        {restaurant.image && (
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-4 left-4 text-white">
          <h1 className="text-3xl font-black">{restaurant.name}</h1>
          <p className="text-white/80 text-sm">{Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine}</p>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />{restaurant.rating?.toFixed(1) || 'New'}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{restaurant.delivery_time || 30} min</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${restaurant.isOpen ? 'bg-green-500' : 'bg-red-500'}`}>
              {restaurant.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {cartError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm">⚠️ {cartError}</div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-24">
          {filteredItems.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="text-gray-500">No items in this category</p>
            </div>
          ) : filteredItems.map(item => (
            <div key={item._id} className={`bg-white rounded-2xl shadow-sm p-4 border border-gray-100 flex gap-4 ${!item.isAvailable ? 'opacity-60' : ''}`}>
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-red-100 flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-black text-orange-500">₹{item.price}</span>
                  {item.isAvailable ? (
                    cart[item._id] ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeFromCart(item)} className="w-7 h-7 bg-orange-100 text-orange-500 rounded-lg flex items-center justify-center font-bold">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-sm w-4 text-center">{cart[item._id]}</span>
                        <button onClick={() => addToCart(item)} className="w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-red-500 font-bold">Unavailable</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-black text-gray-900 mb-4">Customer Reviews</h3>
            <div className="space-y-3">
              {reviews.slice(0, 5).map(review => (
                <div key={review._id} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-gray-800">{review.user?.name || 'Customer'}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.reviewText}</p>
                  {review.rewardPoints > 0 && (
                    <span className="text-xs text-purple-500 font-bold mt-1 block">+{review.rewardPoints} points earned</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating cart */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto">
          <button
            onClick={() => navigate(createPageUrl('Cart'))}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm">
                {totalItems}
              </div>
              <span className="font-bold">{totalItems} item{totalItems > 1 ? 's' : ''} in cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black">₹{totalPrice}</span>
              <ShoppingCart className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}