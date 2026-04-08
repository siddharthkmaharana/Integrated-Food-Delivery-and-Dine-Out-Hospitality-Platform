import { api } from "@/api/client";
import { useState, useEffect } from "react";
import {
    LayoutDashboard, UtensilsCrossed, Package, Calendar,
    Plus, Trash2, Edit3, Check, X, TrendingUp, RefreshCw, Save,
    Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const ORDER_STATUSES = ["placed", "confirmed", "preparing", "picked_up", "out_for_delivery", "delivered", "cancelled"];
const STATUS_COLORS = {
    placed: "bg-blue-100 text-blue-600",
    confirmed: "bg-indigo-100 text-indigo-600",
    preparing: "bg-yellow-100 text-yellow-700",
    picked_up: "bg-orange-100 text-orange-600",
    out_for_delivery: "bg-purple-100 text-purple-600",
    delivered: "bg-green-100 text-green-600",
    cancelled: "bg-red-100 text-red-600",
};

export default function RestaurantDashboard() {
    const [tab, setTab] = useState("overview");
    const [user, setUser] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editItem, setEditItem] = useState(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [newItem, setNewItem] = useState({ name: "", price: "", category: "", description: "", is_veg: false, is_available: true, is_bestseller: false });

    useEffect(() => {
        api.auth.me().then(async u => {
            if (!u) { api.auth.redirectToLogin(); return; }
            setUser(u);
            const rests = await api.restaurants.filter({ owner_email: u.email }).catch(() => []);
            // Admins can see all, owners see their own
            const myRest = rests[0];
            if (!myRest && u.role !== "admin") {
                return;
            }
            const r = myRest || (await api.restaurants.list("-created_date", 1))[0];
            if (!r) { setLoading(false); return; }
            setRestaurant(r);
            const [items, ords, res, revs] = await Promise.all([
                api.menuItems.filter({ restaurant_id: r._id }),
                api.orders.filter({ restaurant_id: r._id }, "-created_date", 50),
                api.reservations.filter({ restaurant_id: r._id }, "-created_date", 50),
                api.reviews.filter({ restaurant_id: r._id }, "-createdAt", 50).catch(() => []), 
            ]);
            setMenuItems(items);
            setOrders(ords);
            setReservations(res);
            setReviews(revs);
            setLoading(false);
        }).catch(() => api.auth.redirectToLogin());
    }, []);

    const updateOrderStatus = async (orderId, status) => {
        await api.orders.update(orderId, { status });
        setOrders(os => os.map(o => o._id === orderId ? { ...o, status } : o));
    };

    const addMenuItem = async () => {
        if (!newItem.name || !newItem.price) return;
        const item = await api.menuItems.create({
            ...newItem,
            price: parseFloat(newItem.price),
            restaurant_id: restaurant._id,
            restaurant_name: restaurant.name,
        });
        setMenuItems(items => [...items, item]);
        setNewItem({ name: "", price: "", category: "", description: "", is_veg: false, is_available: true, is_bestseller: false });
        setShowAddItem(false);
    };

    const deleteItem = async (id) => {
        await api.menuItems.delete(id);
        setMenuItems(items => items.filter(i => i._id !== id));
    };

    const saveEdit = async () => {
        await api.menuItems.update(editItem._id, editItem);
        setMenuItems(items => items.map(i => i._id === editItem._id ? editItem : i));
        setEditItem(null);
    };

    const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total || 0), 0);
    const activeOrders = orders.filter(o => !["delivered", "cancelled"].includes(o.status));

    const TABS = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "menu", label: "Menu", icon: UtensilsCrossed },
        { id: "orders", label: "Orders", icon: Package },
        { id: "reservations", label: "Reservations", icon: Calendar },
        { id: "reviews", label: "Reviews", icon: Star },
    ];

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" /></div>;

    if (!restaurant) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">🍽️</div>
                <h2 className="text-xl font-bold text-gray-700">No Restaurant Found</h2>
                <p className="text-gray-400 mt-2">Your restaurant is not registered yet.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-60 bg-gray-950 text-white min-h-screen p-4 flex-shrink-0 fixed top-16 bottom-0 left-0 z-20 overflow-y-auto">
                <div className="mb-6 px-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Restaurant</p>
                    <p className="font-black text-white text-sm truncate">{restaurant.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className={`w-2 h-2 rounded-full ${restaurant.is_open ? "bg-green-500" : "bg-gray-500"}`} />
                        <p className="text-xs text-gray-400">{restaurant.is_open ? "Open" : "Closed"}</p>
                    </div>
                </div>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${tab === t.id ? "bg-orange-500 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                        {t.id === "orders" && activeOrders.length > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeOrders.length}</span>
                        )}
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
                        <h1 className="text-2xl font-black text-gray-900 mb-6">Restaurant Dashboard</h1>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: "Total Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "bg-green-50 text-green-600" },
                                { label: "Total Orders", value: orders.length, icon: Package, color: "bg-blue-50 text-blue-600" },
                                { label: "Active Orders", value: activeOrders.length, icon: Package, color: "bg-orange-50 text-orange-600" },
                                { label: "Menu Items", value: menuItems.length, icon: UtensilsCrossed, color: "bg-purple-50 text-purple-600" },
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

                        {activeOrders.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
                                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                    Live Orders ({activeOrders.length})
                                </h3>
                                <div className="space-y-3">
                                    {activeOrders.map(o => (
                                        <div key={o._id} className="flex items-center gap-4 border border-gray-100 rounded-xl p-3">
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-gray-900">{o.user_name}</p>
                                                <p className="text-xs text-gray-400">{o.items?.map(i => `${i.name} ×${i.quantity}`).join(", ")}</p>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[o.status]}`}>{o.status?.replace(/_/g, " ")}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {tab === "menu" && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-black text-gray-900">Menu ({menuItems.length})</h1>
                            <Button onClick={() => setShowAddItem(true)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                                <Plus className="w-4 h-4 mr-1" /> Add Item
                            </Button>
                        </div>

                        {showAddItem && (
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 mb-6">
                                <h3 className="font-bold text-gray-900 mb-4">Add New Item</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                    <Input placeholder="Item name *" value={newItem.name} onChange={e => setNewItem(i => ({ ...i, name: e.target.value }))} className="rounded-xl" />
                                    <Input placeholder="Price *" type="number" value={newItem.price} onChange={e => setNewItem(i => ({ ...i, price: e.target.value }))} className="rounded-xl" />
                                    <Input placeholder="Category (e.g. Starters)" value={newItem.category} onChange={e => setNewItem(i => ({ ...i, category: e.target.value }))} className="rounded-xl" />
                                    <Input placeholder="Description" value={newItem.description} onChange={e => setNewItem(i => ({ ...i, description: e.target.value }))} className="rounded-xl col-span-2 md:col-span-3" />
                                </div>
                                <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={newItem.is_veg} onChange={e => setNewItem(i => ({ ...i, is_veg: e.target.checked }))} className="rounded" />
                                        <span className="font-medium text-green-600">🥦 Vegetarian</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={newItem.is_bestseller} onChange={e => setNewItem(i => ({ ...i, is_bestseller: e.target.checked }))} className="rounded" />
                                        <span className="font-medium text-orange-500">🔥 Bestseller</span>
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={addMenuItem} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">Add Item</Button>
                                    <Button onClick={() => setShowAddItem(false)} variant="outline" className="rounded-xl">Cancel</Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {menuItems.map(item => (
                                <div key={item._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                                    {editItem?._id === item._id ? (
                                        <div className="flex-1 grid grid-cols-3 gap-2">
                                            <Input value={editItem.name} onChange={e => setEditItem(i => ({ ...i, name: e.target.value }))} className="rounded-xl text-sm" />
                                            <Input value={editItem.price} type="number" onChange={e => setEditItem(i => ({ ...i, price: parseFloat(e.target.value) }))} className="rounded-xl text-sm" />
                                            <Input value={editItem.category || ""} onChange={e => setEditItem(i => ({ ...i, category: e.target.value }))} className="rounded-xl text-sm" placeholder="Category" />
                                        </div>
                                    ) : (
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3.5 h-3.5 rounded border ${item.is_veg ? "border-green-500" : "border-red-500"} flex items-center justify-center`}>
                                                    <div className={`w-2 h-2 rounded-full ${item.is_veg ? "bg-green-500" : "bg-red-500"}`} />
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                                                {item.is_bestseller && <span className="text-xs">🔥</span>}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="font-bold text-orange-500">₹{item.price?.toFixed(2)}</span>
                                                {item.category && <span>{item.category}</span>}
                                                <span className={item.is_available ? "text-green-600" : "text-gray-400"}>{item.is_available ? "Available" : "Unavailable"}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {editItem?._id === item._id ? (
                                            <>
                                                <button onClick={saveEdit} className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200"><Save className="w-4 h-4" /></button>
                                                <button onClick={() => setEditItem(null)} className="p-2 bg-gray-100 text-gray-500 rounded-xl"><X className="w-4 h-4" /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => setEditItem({ ...item })} className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200"><Edit3 className="w-4 h-4" /></button>
                                                <button onClick={() => deleteItem(item._id)} className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
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
                        <h1 className="text-2xl font-black text-gray-900 mb-6">Orders ({orders.length})</h1>
                        <div className="space-y-4">
                            {orders.map(o => (
                                <div key={o._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-bold text-gray-900">{o.user_name}</p>
                                            <p className="text-xs text-gray-400">{o.created_date ? format(new Date(o.created_date), "MMM d, h:mm a") : ""}</p>
                                        </div>
                                        <span className="font-black text-gray-900">₹{o.total?.toFixed(2)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">{o.items?.map(i => `${i.name} ×${i.quantity}`).join(", ")}</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-gray-500 font-medium">Status:</span>
                                        <select
                                            value={o.status}
                                            onChange={e => updateOrderStatus(o._id, e.target.value)}
                                            className={`text-xs font-bold px-2 py-1 rounded-full border-none outline-none cursor-pointer ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}
                                        >
                                            {ORDER_STATUSES.map(s => (
                                                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                            ))}
                                        </select>
                                        {o.delivery_address && (
                                            <span className="text-xs text-gray-400 ml-2">📍 {o.delivery_address}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "reservations" && (
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-6">Reservations ({reservations.length})</h1>
                        <div className="space-y-3">
                            {reservations.map(res => (
                                <div key={res._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-gray-900">{res.user_name}</p>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${res.status === "confirmed" ? "bg-green-100 text-green-600" :
                                                    res.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"
                                                }`}>{res.status}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">{format(new Date(res.date), "MMM d, yyyy")} at {res.time} · {res.guests} guests</p>
                                        {res.special_requests && <p className="text-xs text-gray-400 mt-1">📝 {res.special_requests}</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        {res.status === "pending" && (
                                            <>
                                                <button onClick={() => api.reservations.update(res._id, { status: "confirmed" }).then(() => setReservations(rs => rs.map(r => r._id === res._id ? { ...r, status: "confirmed" } : r)))}
                                                    className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => api.reservations.update(res._id, { status: "cancelled" }).then(() => setReservations(rs => rs.map(r => r._id === res._id ? { ...r, status: "cancelled" } : r)))}
                                                    className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"><X className="w-4 h-4" /></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "reviews" && (
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-6">Customer Reviews ({reviews.length})</h1>
                        <div className="space-y-4">
                            {reviews.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-bold text-gray-900">No reviews yet.</h3>
                                    <p className="text-gray-500 text-sm mt-1">When customers review your restaurant, they will appear here.</p>
                                </div>
                            ) : (
                                reviews.map(review => (
                                    <div key={review._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900">{review.user_name || review.user?.name || "Anonymous"}</p>
                                                <span className="text-xs text-gray-400">• {review.createdAt ? format(new Date(review.createdAt), "MMM d, yyyy") : ""}</span>
                                            </div>
                                            <div className="flex text-yellow-500 text-sm">
                                                {[1, 2, 3, 4, 5].map(s => <span key={s} className={s <= review.rating ? "text-yellow-500" : "text-gray-200"}>★</span>)}
                                            </div>
                                        </div>
                                        {review.reviewText && (
                                            <p className="text-sm text-gray-600 leading-relaxed mt-2">{review.reviewText}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}