import { useState, useEffect } from "react";
import {
    LayoutDashboard, Store, Package, Users, Tag, TrendingUp,
    Check, X, Eye, Plus, Trash2, Edit3, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

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

    useEffect(() => {
        api.auth.me().then(u => {
            if (!u || u.role !== "admin") { api.auth.redirectToLogin(); return; }
            setUser(u);
            loadAll();
        }).catch(() => api.auth.redirectToLogin());
    }, []);

    useEffect(() => {
        if (!user || user.role !== "admin") return;
        const unsub = api.orders.subscribeAdmin(
            (newOrder) => {
                // Refresh list on a new order to ensure we have all data
                api.orders.list("-created_date", 100).then(setOrders);
            },
            (update) => {
                setOrders(os => os.map(o => o._id === update.orderId ? { ...o, status: update.status } : o));
            }
        );
        return unsub;
    }, [user]);

    const loadAll = async () => {
        setLoading(true);
        const [rests, ords, usrs, cops] = await Promise.all([
            api.restaurants.list("-created_date", 100),
            api.orders.list("-created_date", 100),
            api.users.list("-created_date", 50),
            api.coupons.list("-created_date", 50),
        ]);
        setRestaurants(rests);
        setOrders(ords);
        setUsers(usrs);
        setCoupons(cops);
        setLoading(false);
    };

    const approveRestaurant = async (id, val) => {
        await api.restaurants.update(id, { is_approved: val });
        setRestaurants(rs => rs.map(r => r._id === id ? { ...r, is_approved: val } : r));
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

    const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total || 0), 0);
    const pending = restaurants.filter(r => r.is_approved === null || r.is_approved === undefined).length;

    const TABS = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "restaurants", label: "Restaurants", icon: Store },
        { id: "orders", label: "Orders", icon: Package },
        { id: "coupons", label: "Coupons", icon: Tag },
    ];

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-60 bg-gray-950 text-white min-h-screen p-4 flex-shrink-0 fixed top-16 bottom-0 left-0 z-20 overflow-y-auto">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-3">Admin Panel</p>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${tab === t.id ? "bg-orange-500 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            {/* Mobile tabs */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-semibold ${tab === t.id ? "text-orange-500" : "text-gray-400"}`}>
                        <t.icon className="w-5 h-5" />{t.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 md:ml-60 p-6 pb-24 md:pb-6">
                {tab === "overview" && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
                            <button onClick={loadAll} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium">
                                <RefreshCw className="w-4 h-4" /> Refresh
                            </button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: "Total Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "bg-green-50 text-green-600" },
                                { label: "Total Orders", value: orders.length, icon: Package, color: "bg-blue-50 text-blue-600" },
                                { label: "Restaurants", value: restaurants.length, icon: Store, color: "bg-orange-50 text-orange-600" },
                                { label: "Pending Approval", value: pending, icon: Eye, color: "bg-yellow-50 text-yellow-600" },
                            ].map(stat => (
                                <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} mb-3`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="font-black text-gray-900 mb-4">Recent Orders</h3>
                            <div className="space-y-3">
                                {orders.slice(0, 10).map(o => (
                                    <div key={o._id} className="flex items-center gap-4 text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{o.restaurant_name}</p>
                                            <p className="text-xs text-gray-400">{o.user_name || o.user_email}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}>{o.status?.replace(/_/g, " ")}</span>
                                        <span className="font-bold text-gray-900">₹{o.total?.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {tab === "restaurants" && (
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-6">Restaurants ({restaurants.length})</h1>
                        <div className="space-y-3">
                            {restaurants.map(r => (
                                <div key={r._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                                        {r.image ? <img src={r.image} alt={r.name} className="w-full h-full object-cover" /> : "🍽️"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 truncate">{r.name}</h4>
                                        <p className="text-sm text-gray-500">{r.cuisine} · {r.city}</p>
                                        <p className="text-xs text-gray-400">{r.owner_email}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.is_approved ? "bg-green-100 text-green-600" :
                                            r.is_approved === false ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"
                                            }`}>
                                            {r.is_approved ? "Approved" : r.is_approved === false ? "Rejected" : "Pending"}
                                        </span>
                                        {!r.is_approved && r.is_approved !== false && (
                                            <>
                                                <button onClick={() => approveRestaurant(r._id, true)} className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => approveRestaurant(r._id, false)} className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "orders" && (
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-6">All Orders ({orders.length})</h1>
                        <div className="space-y-3">
                            {orders.map(o => (
                                <div key={o._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-bold text-gray-900">{o.restaurant_name}</p>
                                            <p className="text-xs text-gray-400">{o.user_name} · {o.created_date ? format(new Date(o.created_date), "MMM d, h:mm a") : ""}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}>
                                                {o.status?.replace(/_/g, " ")}
                                            </span>
                                            <span className="font-black text-gray-900">₹{o.total?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">{o.items?.map(i => `${i.name} ×${i.quantity}`).join(", ")}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "coupons" && (
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-6">Coupons</h1>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
                            <h3 className="font-bold text-gray-900 mb-4">Create New Coupon</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Input
                                    placeholder="COUPON CODE"
                                    value={newCoupon.code}
                                    onChange={e => setNewCoupon(c => ({ ...c, code: e.target.value.toUpperCase() }))}
                                    className="rounded-xl uppercase font-mono"
                                />
                                <select
                                    value={newCoupon.discount_type}
                                    onChange={e => setNewCoupon(c => ({ ...c, discount_type: e.target.value }))}
                                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none"
                                >
                                    <option value="percentage">Percentage</option>
                                    <option value="flat">Flat Amount</option>
                                </select>
                                <Input
                                    type="number"
                                    placeholder={newCoupon.discount_type === "percentage" ? "Discount %" : "Amount ₹"}
                                    value={newCoupon.discount_value}
                                    onChange={e => setNewCoupon(c => ({ ...c, discount_value: parseFloat(e.target.value) }))}
                                    className="rounded-xl"
                                />
                                <Button onClick={createCoupon} disabled={!newCoupon.code} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                                    <Plus className="w-4 h-4 mr-1" /> Create
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {coupons.map(c => (
                                <div key={c._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-mono font-black text-orange-500 text-lg">{c.code}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.is_active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                                                {c.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {c.discount_type === "percentage" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                                            {c.min_order > 0 && ` · Min order ₹${c.min_order}`}
                                        </p>
                                    </div>
                                    <button onClick={() => deleteCoupon(c._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
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