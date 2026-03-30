import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { io } from 'socket.io-client';

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Main Course', description: '' });
  const [newRestaurant, setNewRestaurant] = useState({ name: '', address: '', cuisine: '', longitude: '', latitude: '', image: '' });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [newOrders, setNewOrders] = useState([]);

  useEffect(() => {
    loadData();
    const socket = io('http://localhost:5000');
    socket.on('new_order', (order) => {
      setNewOrders(prev => [order, ...prev]);
      setOrders(prev => [order, ...prev]);
    });
    return () => socket.disconnect();
  }, []);

  const loadData = async () => {
    try {
      const u = await api.auth.me();
      setUser(u);
      if (u?.role !== 'restaurant') {
        navigate(createPageUrl('Home'));
        return;
      }
      const allRestaurants = await api.restaurants.list();
      const myRestaurant = allRestaurants.find(r => r.owner === u._id || r.owner?._id === u._id);
      if (myRestaurant) {
        setRestaurant(myRestaurant);
        const [items, ords] = await Promise.all([
          api.menuItems.filter({ restaurant: myRestaurant._id }),
          api.orders.filter({ restaurant: myRestaurant._id })
        ]);
        setMenuItems(Array.isArray(items) ? items : []);
        setOrders(Array.isArray(ords) ? ords : []);
      } else {
        setShowAddRestaurant(true);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddRestaurant = async () => {
    setSaving(true);
    try {
      const r = await api.restaurants.create({
        ...newRestaurant,
        cuisine: newRestaurant.cuisine.split(',').map(c => c.trim()),
        longitude: parseFloat(newRestaurant.longitude),
        latitude: parseFloat(newRestaurant.latitude),
      });
      setRestaurant(r);
      setShowAddRestaurant(false);
      setSuccessMsg('Restaurant created!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleAddMenuItem = async () => {
    if (!newItem.name || !newItem.price) return;
    setSaving(true);
    try {
      const item = await api.menuItems.create({ ...newItem, price: parseFloat(newItem.price), restaurant: restaurant._id });
      setMenuItems(prev => [...prev, item]);
      setNewItem({ name: '', price: '', category: 'Main Course', description: '' });
      setShowAddMenu(false);
      setSuccessMsg('Menu item added!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleToggleAvailability = async (item) => {
    try {
      const updated = await api.menuItems.update(item._id, { isAvailable: !item.isAvailable });
      setMenuItems(prev => prev.map(m => m._id === item._id ? updated : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api.orders.update(orderId, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      setSuccessMsg(`Order ${status}!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const todayRevenue = orders
    .filter(o => o.status === 'DELIVERED' && new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter(o => o.status === 'PLACED').length;

  const statusColors = {
    PLACED: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-orange-100 text-orange-700',
    ORDER_PREPARING: 'bg-yellow-100 text-yellow-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showAddRestaurant) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-lg mx-auto px-4">
          <h1 className="text-2xl font-black text-gray-900 mb-6">🍽️ Create Your Restaurant</h1>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
            {[
              { label: 'Restaurant Name', key: 'name', placeholder: 'Spice Garden' },
              { label: 'Address', key: 'address', placeholder: 'MG Road, Bangalore' },
              { label: 'Cuisine (comma separated)', key: 'cuisine', placeholder: 'Indian, Chinese' },
              { label: 'Longitude', key: 'longitude', placeholder: '77.5946' },
              { label: 'Latitude', key: 'latitude', placeholder: '12.9716' },
              { label: 'Image URL (optional)', key: 'image', placeholder: 'https://...' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={newRestaurant[field.key]}
                  onChange={e => setNewRestaurant({ ...newRestaurant, [field.key]: e.target.value })}
                />
              </div>
            ))}
            <button onClick={handleAddRestaurant} disabled={saving} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Restaurant'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-2xl font-black">{restaurant?.name} Dashboard</h1>
          <p className="text-white/70 text-sm mt-1">{Array.isArray(restaurant?.cuisine) ? restaurant.cuisine.join(', ') : restaurant?.cuisine}</p>
        </div>

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl mb-4 text-sm font-semibold">✅ {successMsg}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Today's Revenue", value: `₹${todayRevenue}`, icon: '💰', color: 'from-green-500 to-emerald-500' },
            { label: 'Total Revenue', value: `₹${totalRevenue}`, icon: '📈', color: 'from-blue-500 to-indigo-500' },
            { label: 'Pending Orders', value: pendingOrders, icon: '🔔', color: 'from-orange-500 to-red-500' },
            { label: 'Menu Items', value: menuItems.length, icon: '🍽️', color: 'from-purple-500 to-pink-500' },
          ].map(stat => (
            <div key={stat.label} className={`bg-gradient-to-r ${stat.color} rounded-2xl p-4 text-white`}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-black">{stat.value}</div>
              <div className="text-white/70 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['orders', 'menu'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              {tab === 'orders' ? `📦 Orders ${pendingOrders > 0 ? `(${pendingOrders} new)` : ''}` : '🍽️ Menu'}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <div className="text-5xl mb-3">📦</div>
                <p className="text-gray-500">No orders yet</p>
              </div>
            ) : orders.map(order => (
              <div key={order._id} className={`bg-white rounded-2xl shadow-sm p-5 border ${order.status === 'PLACED' ? 'border-orange-300' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">Order #{order._id?.slice(-8)}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-1">📍 {order.deliveryAddress}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    <p className="font-black text-orange-500 mt-1">₹{order.totalAmount}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  {order.items?.map((item, i) => (
                    <p key={i} className="text-xs text-gray-600">{item.name} × {item.quantity} — ₹{item.price * item.quantity}</p>
                  ))}
                </div>

                {order.status === 'PLACED' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateOrderStatus(order._id, 'ACCEPTED')} className="flex-1 bg-green-500 text-white text-sm font-bold py-2 rounded-xl">
                      ✅ Accept
                    </button>
                    <button onClick={() => handleUpdateOrderStatus(order._id, 'CANCELLED')} className="flex-1 bg-red-500 text-white text-sm font-bold py-2 rounded-xl">
                      ✗ Reject
                    </button>
                  </div>
                )}
                {order.status === 'ACCEPTED' && (
                  <button onClick={() => handleUpdateOrderStatus(order._id, 'ORDER_PREPARING')} className="w-full bg-yellow-500 text-white text-sm font-bold py-2 rounded-xl">
                    👨‍🍳 Start Preparing
                  </button>
                )}
                {order.status === 'ORDER_PREPARING' && (
                  <button onClick={() => handleUpdateOrderStatus(order._id, 'DELIVERED')} className="w-full bg-green-500 text-white text-sm font-bold py-2 rounded-xl">
                    🎉 Mark as Delivered
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900">Menu Items ({menuItems.length})</h2>
              <button onClick={() => setShowAddMenu(!showAddMenu)} className="bg-orange-500 text-white font-bold px-4 py-2 rounded-xl text-sm">
                {showAddMenu ? '✕ Cancel' : '+ Add Item'}
              </button>
            </div>

            {showAddMenu && (
              <div className="bg-orange-50 rounded-2xl p-5 border border-orange-200 mb-4 space-y-3">
                <h3 className="font-bold text-gray-900">Add New Menu Item</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Name *', key: 'name', placeholder: 'Butter Chicken' },
                    { label: 'Price (₹) *', key: 'price', placeholder: '280' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{f.label}</label>
                      <input
                        type={f.key === 'price' ? 'number' : 'text'}
                        placeholder={f.placeholder}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        value={newItem[f.key]}
                        onChange={e => setNewItem({ ...newItem, [f.key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    value={newItem.category}
                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    {['Starter', 'Main Course', 'Bread', 'Rice', 'Dessert', 'Drinks'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    value={newItem.description}
                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  />
                </div>
                <button onClick={handleAddMenuItem} disabled={saving} className="w-full bg-orange-500 text-white font-bold py-2 rounded-xl disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Menu Item'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map(item => (
                <div key={item._id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-2xl flex-shrink-0">
                    🍽️
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.category}</p>
                    <p className="text-orange-500 font-black text-sm">₹{item.price}</p>
                  </div>
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {item.isAvailable ? '✓ Available' : '✗ Unavailable'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}