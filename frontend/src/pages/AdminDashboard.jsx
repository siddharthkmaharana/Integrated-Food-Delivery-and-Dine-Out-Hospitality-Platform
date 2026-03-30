import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const u = await api.auth.me();
      setUser(u);
      if (u?.role !== 'admin' && u?.role !== 'restaurant') {
        navigate(createPageUrl('Home'));
        return;
      }
      const [us, rs, os] = await Promise.all([
        api.users.list(),
        api.restaurants.list(),
        api.orders.list()
      ]);
      setUsers(Array.isArray(us) ? us : []);
      setRestaurants(Array.isArray(rs) ? rs : []);
      setOrders(Array.isArray(os) ? os : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.totalAmount, 0);
  const activeUsers = users.filter(u => u.role === 'customer').length;
  const restaurantCount = restaurants.length;
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">

        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-2xl font-black">⚙️ Admin Dashboard</h1>
          <p className="text-white/70 text-sm mt-1">Platform overview and management</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Revenue', value: `₹${totalRevenue}`, icon: '💰', color: 'from-green-500 to-emerald-500' },
            { label: 'Total Users', value: users.length, icon: '👥', color: 'from-blue-500 to-indigo-500' },
            { label: 'Restaurants', value: restaurantCount, icon: '🍽️', color: 'from-orange-500 to-red-500' },
            { label: 'Orders Delivered', value: deliveredOrders, icon: '📦', color: 'from-purple-500 to-pink-500' },
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
          {['overview', 'users', 'restaurants', 'orders'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">Users by Role</h3>
              {['customer', 'restaurant', 'courier'].map(role => (
                <div key={role} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm capitalize text-gray-600">{role}</span>
                  <span className="font-bold text-gray-900">{users.filter(u => u.role === role).length}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">Order Status</h3>
              {['PLACED', 'DELIVERED', 'CANCELLED'].map(status => (
                <div key={status} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{status}</span>
                  <span className="font-bold text-gray-900">{orders.filter(o => o.status === status).length}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">Top Restaurants</h3>
              {restaurants.slice(0, 5).map(r => (
                <div key={r._id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600 truncate">{r.name}</span>
                  <span className="font-bold text-orange-500">★{r.rating?.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'Email', 'Role', 'Loyalty Points'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.role === 'restaurant' ? 'bg-orange-100 text-orange-700' : u.role === 'courier' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-purple-500">{u.loyaltyPoints || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Restaurants */}
        {activeTab === 'restaurants' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurants.map(r => (
              <div key={r._id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-red-100 flex-shrink-0">
                  {r.image ? <img src={r.image} alt={r.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{Array.isArray(r.cuisine) ? r.cuisine.join(', ') : r.cuisine}</p>
                  <p className="text-xs text-gray-400">{r.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-500">★{r.rating?.toFixed(1)}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.slice(0, 20).map(order => (
              <div key={order._id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">#{order._id?.slice(-8)}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-gray-600">{order.restaurant?.name || 'Restaurant'}</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                  {order.status}
                </span>
                <p className="font-black text-orange-500">₹{order.totalAmount}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}