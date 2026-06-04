import { useState, useEffect } from "react";
import {
    LayoutDashboard, Store, Package, Users, Tag, TrendingUp,
    Check, X, Eye, Plus, Trash2, Edit3, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/client";

const STATUS_COLORS = {
    placed: "bg-blue-100 text-blue-600",
    confirmed: "bg-indigo-100 text-indigo-600",
    preparing: "bg-yellow-100 text-yellow-700",
    delivered: "bg-green-100 text-green-600",
    cancelled: "bg-red-100 text-red-600",
    out_for_delivery: "bg-purple-100 text-purple-600",
};

export default function AdminDashboard() {
    const [tab, setTab] = useState("overview");
    const [restaurants, setRestaurants] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCoupon, setNewCoupon] = useState({ code: "", discount_type: "percentage", discount_value: 10, min_order: 0, is_active: true });
    const [user, setUser] = useState(null);
    const [assigningId, setAssigningId] = useState(null);
    const [userRoleFilter, setUserRoleFilter] = useState("all");

    useEffect(() => {
        api.auth.me().then(u => {
            if (!u || u.role !== "admin") { api.auth.redirectToLogin(); return; }
            setUser(u);
            loadAll();
        }).catch(() => api.auth.redirectToLogin());
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [rests, ords, usrs, cops] = await Promise.all([
                api.restaurants.list({ all: "true", includeUnapproved: "true" }, "-createdAt", 1000).catch(() => []),
                api.orders.list("-created_date", 100).catch(() => []),
                api.admin.listUsers().catch(() => []),
                api.coupons.list("-created_date", 50).catch(() => []),
            ]);
            setRestaurants(rests.data || rests || []);
            setOrders(ords.data || ords || []);
            setUsers(usrs.data || usrs || []);
            setCoupons(cops.data || cops || []);
        } catch (err) {
            console.error("Load error:", err);
        }
        setLoading(false);
    };

    const approveRestaurant = async (id, val) => {
        await api.restaurants.update(id, { is_approved: val });
        setRestaurants(rs => rs.map(r => r._id === id ? { ...r, is_approved: val } : r));
    };

    const handleAssign = async (userId, restaurantId) => {
        if (!restaurantId || restaurantId.includes("Select")) return;
        try {
            await api.admin.assignOwner(userId, restaurantId);
            setAssigningId(null);
            loadAll();
        } catch (error) {
            alert(error.message || "Assignment failed");
        }
    };

    const createCoupon = async () => {
        const c = await api.coupons.create(newCoupon);
        setCoupons(cs => [c, ...cs]);
        setNewCoupon({ code: "", discount_type: "percentage", discount_value: 10, min_order: 0, is_active: true });
    };

    const deleteCoupon = async (id) => {
        await api.coupons.delete(id);
        setCoupons(cs => cs.filter(c => c._id !== id));
    };

    const totalRevenue = (orders || []).filter(o => o.status === "delivered").reduce((s, o) => s + (o.totalAmount || o.total || 0), 0);
    const pending = (restaurants || []).filter(r => r.is_approved === null || r.is_approved === undefined).length;

    const TABS = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "restaurants", label: "Restaurants", icon: Store },
        { id: "orders", label: "Orders", icon: Package },
        { id: "users", label: "Users", icon: Users },
        { id: "coupons", label: "Coupons", icon: Tag },
    ];

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-gray-950 text-white min-h-screen p-4 flex-shrink-0 fixed top-0 bottom-0 left-0 z-20">
                <div className="flex items-center gap-3 px-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="font-black text-xl tracking-tight">Admin<span className="text-orange-500">Hub</span></p>
                    </div>
                </div>
                
                <nav className="flex-1 space-y-1">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                tab === t.id 
                                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            <t.icon className="w-5 h-5" /> {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            <main className="flex-1 md:ml-64 p-8">
                {tab === "overview" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-black text-gray-900">Dashboard Overview</h1>
                            <Button variant="outline" onClick={loadAll} className="rounded-xl font-bold h-11 px-6">
                                <RefreshCw className="w-4 h-4 mr-2" /> Refresh Data
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: "Total Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "bg-green-500" },
                                { label: "Total Orders", value: orders.length, icon: Package, color: "bg-blue-500" },
                                { label: "Restaurants", value: restaurants.length, icon: Store, color: "bg-orange-500" },
                                { label: "Pending Approval", value: pending, icon: Eye, color: "bg-yellow-500" },
                            ].map(stat => (
                                <div key={stat.label} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all">
                                    <div className={`w-12 h-12 rounded-2xl ${stat.color} text-white flex items-center justify-center mb-4 shadow-lg shadow-inherit/20`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                                    <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                            <h3 className="text-xl font-black text-gray-900 mb-6">Recent Activity</h3>
                            <div className="space-y-4">
                                {orders.slice(0, 5).map(o => (
                                    <div key={o._id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-transparent hover:border-gray-100 transition-all">
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl">
                                            📦
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{o.restaurantName || o.restaurant?.name}</p>
                                            <p className="text-xs text-gray-500 font-medium">Order by {o.customer?.name || "Customer"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-gray-900">₹{o.totalAmount || o.total}</p>
                                            <Badge className={`text-[10px] font-black uppercase mt-1 ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"} border-none`}>
                                                {o.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {tab === "restaurants" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <h1 className="text-3xl font-black text-gray-900">Restaurant Directory</h1>
                        <div className="grid gap-4">
                            {restaurants.map(r => (
                                <div key={r._id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-xl transition-all">
                                    <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
                                        {r.image ? <img src={r.image} alt={r.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>}
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h4 className="text-xl font-black text-gray-900">{r.name}</h4>
                                        <p className="text-gray-500 font-medium">{Array.isArray(r.cuisine) ? r.cuisine.join(", ") : r.cuisine} · {r.address}</p>
                                        <p className="text-xs text-orange-500 font-bold mt-1 uppercase tracking-widest">Owner: {r.owner?.name || "Unassigned"}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={`text-xs font-black uppercase px-4 py-1.5 rounded-full border-none ${
                                            r.is_approved ? "bg-green-100 text-green-600" : 
                                            r.is_approved === false ? "bg-red-100 text-red-600" : 
                                            "bg-yellow-100 text-yellow-700"
                                        }`}>
                                            {r.is_approved ? "Approved" : r.is_approved === false ? "Rejected" : "Pending Approval"}
                                        </Badge>
                                        {r.is_approved === undefined || r.is_approved === null && (
                                            <div className="flex gap-2">
                                                <Button onClick={() => approveRestaurant(r._id, true)} className="bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/20">
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button onClick={() => approveRestaurant(r._id, false)} variant="outline" className="text-red-500 border-red-100 hover:bg-red-50 rounded-xl">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {tab === "orders" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <h1 className="text-3xl font-black text-gray-900">All Platform Orders</h1>
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Order ID</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Restaurant</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Customer</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Items</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Total</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {orders.map(o => (
                                            <tr key={o._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono font-bold text-xs text-gray-400">#{(o._id || o.id).slice(-6).toUpperCase()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">{o.restaurantName || o.restaurant?.name}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">{o.customer?.name || "Customer"}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{o.customer?.email}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex -space-x-2">
                                                        {o.items?.slice(0, 3).map((it, i) => (
                                                            <div key={i} title={it.name} className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-orange-600">
                                                                {it.name[0]}
                                                            </div>
                                                        ))}
                                                        {o.items?.length > 3 && (
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-gray-400">
                                                                +{o.items.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-black text-gray-900">₹{o.totalAmount || o.total}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Badge className={`text-[10px] font-black uppercase border-none ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}>
                                                        {o.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === "users" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h1 className="text-3xl font-black text-gray-900">User Management</h1>
                            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                                {["all", "customer", "restaurant", "courier"].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setUserRoleFilter(r)}
                                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                            userRoleFilter === r ? "bg-orange-500 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {users.filter(u => userRoleFilter === "all" || u.role === userRoleFilter).map(u => (
                                <div key={u._id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xl">
                                        {u.name[0]}
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2">
                                            <p className="text-lg font-black text-gray-900">{u.name}</p>
                                            <Badge className={`text-[10px] font-black uppercase border-none ${
                                                u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 
                                                u.role === 'restaurant' ? 'bg-orange-100 text-orange-600' : 
                                                u.role === 'courier' ? 'bg-blue-100 text-blue-600' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {u.role}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-500 font-medium text-sm">{u.email}</p>
                                        
                                        {u.role === "restaurant" && (
                                            <div className="mt-2">
                                                {(() => {
                                                    const assigned = restaurants.find(r => {
                                                        const ownerId = r.owner?._id || r.owner;
                                                        return String(ownerId) === String(u._id);
                                                    });
                                                    return assigned ? (
                                                        <div className="flex items-center justify-center md:justify-start gap-1.5 text-green-600">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                            <span className="text-xs font-black uppercase tracking-wider">Assigned: {assigned.name}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center md:justify-start gap-1.5 text-red-500">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                            <span className="text-xs font-black uppercase tracking-wider">Not Assigned</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        {u.role === "restaurant" ? (
                                            assigningId === u._id ? (
                                                <div className="space-y-2">
                                                    <select 
                                                        onChange={(e) => handleAssign(u._id, e.target.value)}
                                                        className="w-full text-xs font-bold border-2 border-orange-100 rounded-xl p-3 outline-none focus:border-orange-500 transition-all bg-white"
                                                    >
                                                        <option>Select Restaurant...</option>
                                                        {restaurants.map(r => (
                                                            <option key={r._id} value={r._id}>
                                                                {r.name} - {Array.isArray(r.cuisine) ? r.cuisine.join(', ') : r.cuisine} ({r.address || "No Address"})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <Button variant="ghost" size="sm" onClick={() => setAssigningId(null)} className="w-full text-[10px] font-black uppercase">Cancel</Button>
                                                </div>
                                            ) : (
                                                <Button 
                                                    onClick={() => setAssigningId(u._id)}
                                                    className="bg-gray-950 hover:bg-orange-500 text-white rounded-xl font-bold h-11 shadow-lg shadow-gray-200 transition-all"
                                                >
                                                    <Edit3 className="w-4 h-4 mr-2" /> Assign Ownership
                                                </Button>
                                            )
                                        ) : (
                                            <p className="text-[10px] text-gray-400 italic text-center">Only restaurant owners can be assigned to restaurants</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "coupons" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <h1 className="text-3xl font-black text-gray-900">Coupons & Rewards</h1>
                        
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black text-gray-900 mb-6">Create New Coupon</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Input
                                    placeholder="CODE (e.g. SAVE50)"
                                    value={newCoupon.code}
                                    onChange={e => setNewCoupon(c => ({ ...c, code: e.target.value.toUpperCase() }))}
                                    className="rounded-xl h-12 font-mono font-bold border-2 border-gray-50 focus:border-orange-500"
                                />
                                <select
                                    value={newCoupon.discount_type}
                                    onChange={e => setNewCoupon(c => ({ ...c, discount_type: e.target.value }))}
                                    className="h-12 border-2 border-gray-50 rounded-xl px-4 text-sm font-bold outline-none focus:border-orange-500"
                                >
                                    <option value="percentage">Percentage %</option>
                                    <option value="flat">Flat Amount ₹</option>
                                </select>
                                <Input
                                    type="number"
                                    placeholder="Value"
                                    value={newCoupon.discount_value}
                                    onChange={e => setNewCoupon(c => ({ ...c, discount_value: parseFloat(e.target.value) }))}
                                    className="rounded-xl h-12 font-bold border-2 border-gray-50 focus:border-orange-500"
                                />
                                <Button onClick={createCoupon} disabled={!newCoupon.code} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 font-black shadow-lg shadow-orange-500/20">
                                    <Plus className="w-5 h-5 mr-2" /> Generate Coupon
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {(coupons || []).map(c => (
                                <div key={c._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                                            <Tag className="w-6 h-6 text-orange-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-black text-gray-900 text-xl">{c.code}</span>
                                                <Badge className={`text-[9px] font-black uppercase border-none ${c.is_active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                                                    {c.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <p className="text-sm font-bold text-gray-500 mt-1">
                                                {c.discount_type === "percentage" ? `${c.discount_value}% Discount` : `₹${c.discount_value} Flat Off`}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" onClick={() => deleteCoupon(c._id)} className="h-10 w-10 p-0 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}