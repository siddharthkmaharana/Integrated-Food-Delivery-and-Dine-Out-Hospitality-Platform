import { api } from "@/api/client";
import { useState, useEffect } from "react";
import {
    LayoutDashboard, UtensilsCrossed, Package, Calendar,
    Plus, Trash2, Edit3, Check, X, TrendingUp, RefreshCw, Save,
    Star, Music, Zap, Clock, User, MapPin, Settings as SettingsIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const ORDER_STATUSES = ["PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "DELIVERING", "DELIVERED", "CANCELLED"];
const STATUS_COLORS = {
    PLACED: "bg-blue-100 text-blue-600",
    CONFIRMED: "bg-indigo-100 text-indigo-600",
    PREPARING: "bg-yellow-100 text-yellow-700",
    READY_FOR_PICKUP: "bg-green-100 text-green-700",
    PICKED_UP: "bg-orange-100 text-orange-600",
    DELIVERING: "bg-purple-100 text-purple-600",
    DELIVERED: "bg-green-100 text-green-600",
    CANCELLED: "bg-red-100 text-red-600",
};

export default function RestaurantDashboard() {
    const [tab, setTab] = useState("overview");
    const [user, setUser] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form states
    const [showAddItem, setShowAddItem] = useState(false);
    const [newItem, setNewItem] = useState({ name: "", price: "", category: "", description: "", is_veg: false, image: "" });
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: "", description: "", date: format(new Date(), "yyyy-MM-dd"), startTime: "19:00", endTime: "22:00", type: "Food Festival", capacity: 50 });
    const [editRest, setEditRest] = useState({ name: "", cuisine: "", address: "", image: "" });
    const [allRestaurants, setAllRestaurants] = useState([]);
    const [addrQuery, setAddrQuery] = useState("");
    const [addrSuggestions, setAddrSuggestions] = useState([]);

    useEffect(() => {
        let unsubscribe;
        const init = async () => {
            try {
                const u = await api.auth.me();
                if (!u) { api.auth.redirectToLogin(); return; }
                setUser(u);
                
                const rests = await api.restaurants.filter({ owner: u._id }).catch(() => []);
                const owned = rests.data || rests || [];
                setAllRestaurants(owned);
                
                const savedId = localStorage.getItem("active_restaurant_id");
                const myRest = owned.find(r => r._id === savedId) || owned[0];
                
                if (myRest) {
                    localStorage.setItem("active_restaurant_id", myRest._id);
                    setRestaurant(myRest);
                    setEditRest({ 
                        name: myRest.name, 
                        cuisine: Array.isArray(myRest.cuisine) ? myRest.cuisine.join(", ") : myRest.cuisine, 
                        address: myRest.address,
                        image: myRest.image || ""
                    });
                    setAddrQuery(myRest.address);

                    const [items, ords, res, revs, evts] = await Promise.all([
                        api.menuItems.filter({ restaurant_id: myRest._id }),
                        api.orders.filter({ restaurant_id: myRest._id }, "-created_date", 50),
                        api.reservations.filter({ restaurant_id: myRest._id }, "-created_date", 50),
                        api.reviews.filter({ restaurant_id: myRest._id }, "-createdAt", 50).catch(() => []), 
                        api.events.list({ restaurantId: myRest._id }).catch(() => []),
                    ]);
                    
                    setMenuItems(items?.data || items || []);
                    setOrders(ords?.data || ords || []);
                    setReservations(res?.data || res || []);
                    setReviews(revs?.data || revs || []);
                    setEvents(evts?.data || evts || []);
                    
                    // Subscribe to real-time order updates for this restaurant
                    unsubscribe = api.orders.subscribeRestaurant(myRest._id, 
                        (newOrder) => {
                            setOrders(prev => {
                                if (prev.find(o => (o._id || o.id) === (newOrder._id || newOrder.id))) return prev;
                                return [newOrder, ...prev];
                            });
                        },
                        (update) => {
                            setOrders(prev => prev.map(o => (o._id || o.id) === update.orderId ? { ...o, status: update.status } : o));
                        }
                    );
                }
            } catch (error) {
                console.error("Dashboard initialization error:", error);
                api.auth.redirectToLogin();
            } finally {
                setLoading(false);
            }
        };
        init();
        return () => {
            if (unsubscribe) unsubscribe();
        };
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
            restaurant: restaurant._id,
            restaurant_name: restaurant.name,
        });
        setMenuItems(prev => [...prev, item]);
        setShowAddItem(false);
        setNewItem({ name: "", price: "", category: "", description: "", is_veg: false, image: "" });
    };

    const addEvent = async () => {
        if (!newEvent.title || !newEvent.date) return;
        const ev = await api.events.create({
            ...newEvent,
            restaurantId: restaurant._id
        });
        setEvents(prev => [ev, ...prev]);
        setShowAddEvent(false);
        setNewEvent({ title: "", description: "", date: format(new Date(), "yyyy-MM-dd"), startTime: "19:00", endTime: "22:00", type: "Food Festival", capacity: 50 });
    };

    const deleteMenuItem = async (id) => {
        if (!window.confirm("Delete this item?")) return;
        await api.menuItems.delete(id);
        setMenuItems(prev => prev.filter(i => i._id !== id));
    };

    const deleteEvent = async (id) => {
        if (!window.confirm("Delete this event?")) return;
        await api.events.delete(id);
        setEvents(prev => prev.filter(e => e._id !== id));
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
    );

    if (!restaurant) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 max-w-md w-full text-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-orange-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <UtensilsCrossed className="w-12 h-12 text-orange-500" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">No Restaurant Linked</h2>
                <p className="text-gray-500 font-medium mb-8">
                    Your account is set as a <strong>{user?.role}</strong>, but there are no restaurants assigned to you yet.
                </p>
                {user?.role === "restaurant" ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-400 mb-6">Please contact the administrator to link your restaurant, or try refreshing if you just registered.</p>
                        <Button 
                            onClick={() => window.location.reload()} 
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-14 font-black shadow-lg shadow-orange-100 transition-all"
                        >
                            <RefreshCw className="w-5 h-5 mr-2" /> Refresh Dashboard
                        </Button>
                    </div>
                ) : (
                    <Button 
                        onClick={() => api.auth.logout()} 
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl h-14 font-black transition-all"
                    >
                        Sign Out
                    </Button>
                )}
            </div>
        </div>
    );

    const TABS = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "orders", label: "Live Orders", icon: Package, count: Array.isArray(orders) ? orders.filter(o => o?.status !== "DELIVERED" && o?.status !== "CANCELLED").length : 0 },
        { id: "menu", label: "Menu", icon: UtensilsCrossed },
        { id: "events", label: "Events", icon: Zap, count: Array.isArray(events) ? events.length : 0 },
        { id: "reservations", label: "Bookings", icon: Calendar, count: Array.isArray(reservations) ? reservations.length : 0 },
        { id: "reviews", label: "Reviews", icon: Star },
        { id: "settings", label: "Settings", icon: SettingsIcon },
    ];

    const activeOrders = orders.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED");
    const totalRevenue = orders.filter(o => o.status === "DELIVERED").reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col fixed h-screen z-40">
                <div className="p-6">
                    <div className="flex items-center gap-2 text-orange-600 mb-8">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black italic">F</div>
                        <span className="font-black text-xl tracking-tight text-gray-900">Partner</span>
                    </div>
                    <div className="space-y-1">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                    tab === t.id ? "bg-orange-500 text-white shadow-lg shadow-orange-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                            >
                                <t.icon className="w-4 h-4" />
                                {t.label}
                                {t.count > 0 && (
                                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${tab === t.id ? "bg-white text-orange-600" : "bg-orange-100 text-orange-600"}`}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-auto p-6 border-t border-gray-50">
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold">
                            {restaurant?.name?.[0] || "R"}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{restaurant?.name || "Restaurant"}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{user?.role}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 p-6 pb-24 md:pb-6">
                {/* Top Header with Restaurant Name */}
                <div className="flex items-center justify-center mb-8 bg-white py-6 px-8 rounded-3xl shadow-sm border border-orange-50 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-[2rem] bg-orange-500 flex items-center justify-center text-white text-3xl shadow-xl shadow-orange-100 overflow-hidden border-4 border-white">
                            {restaurant?.image ? <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" /> : (restaurant?.name?.[0] || "R")}
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight text-center">{restaurant?.name || "Loading..."}</h2>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-orange-50 text-orange-600 border-none text-[10px] font-black uppercase px-3 py-1 rounded-full">Partner Store</Badge>
                            <button 
                                onClick={async () => {
                                    try {
                                        const newStatus = !restaurant.is_open;
                                        await api.restaurants.update(restaurant._id, { is_open: newStatus });
                                        setRestaurant(prev => ({ ...prev, is_open: newStatus }));
                                        setAllRestaurants(prev => prev.map(r => r._id === restaurant._id ? { ...r, is_open: newStatus } : r));
                                        alert(`Store is now ${newStatus ? "ONLINE" : "OFFLINE"}`);
                                    } catch (error) {
                                        alert("Failed to update status. Please check your connection.");
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer ${
                                    restaurant.is_open ? "bg-green-50 border-green-100 text-green-600" : "bg-gray-50 border-gray-100 text-gray-500"
                                }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${restaurant.is_open ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                                <span className="text-[10px] font-black uppercase">{restaurant.is_open ? "Online" : "Offline"}</span>
                            </button>
                        </div>
                    </div>
                </div>
                {tab === "overview" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900">Dashboard Overview</h1>
                                <p className="text-gray-500 font-medium">Welcome back, {user.name}!</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                                <div className={`w-2 h-2 rounded-full ${restaurant.is_open ? "bg-green-500" : "bg-gray-300"}`} />
                                <span className="text-sm font-bold">{restaurant.is_open ? "Accepting Orders" : "Closed"}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: "Delivered Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
                                { label: "Live Orders", value: activeOrders.length, icon: Package, color: "text-blue-600 bg-blue-50" },
                                { label: "Total Bookings", value: reservations.length, icon: Calendar, color: "text-purple-600 bg-purple-50" },
                                { label: "Menu Size", value: menuItems.length, icon: UtensilsCrossed, color: "text-orange-600 bg-orange-50" },
                            ].map(stat => (
                                <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color} mb-4`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                                <h3 className="font-black text-gray-900 text-xl mb-6">Recent Live Orders</h3>
                                <div className="space-y-4">
                                    {activeOrders.slice(0, 5).map(o => (
                                        <div key={o._id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-orange-200 transition-all cursor-default">
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900">{o.customer?.name || "Customer"}</p>
                                                <p className="text-xs text-gray-400 line-wrap">{o.items?.map(i => i.name).join(", ")}</p>
                                            </div>
                                            <Badge className={`${STATUS_COLORS[o.status]} border-none capitalize font-bold`}>{o.status}</Badge>
                                        </div>
                                    ))}
                                    {activeOrders.length === 0 && <p className="text-center py-10 text-gray-400 font-medium">No live orders right now</p>}
                                </div>
                            </div>
                            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                                <h3 className="font-black text-gray-900 text-xl mb-6">Latest Reviews</h3>
                                <div className="space-y-4">
                                    {reviews.slice(0, 3).map(rev => (
                                        <div key={rev._id} className="p-4 rounded-2xl border border-gray-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-sm">{rev.user?.name || "Anonymous"}</span>
                                                <div className="flex text-yellow-500 text-xs">{"★".repeat(rev.rating)}</div>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2 italic">"{rev.reviewText}"</p>
                                        </div>
                                    ))}
                                    {reviews.length === 0 && <p className="text-center py-10 text-gray-400 font-medium">No reviews yet</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === "menu" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <h3 className="font-black text-gray-900 text-xl">Menu Management ({menuItems.length})</h3>
                            <Button onClick={() => setShowAddItem(true)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 shadow-lg shadow-orange-100">
                                <Plus className="w-4 h-4" /> Add New Item
                            </Button>
                        </div>

                        {showAddItem && (
                            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-100 shadow-2xl space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="rounded-xl h-12" />
                                    <Input placeholder="Price (₹)" type="number" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} className="rounded-xl h-12" />
                                    <Input placeholder="Category (e.g. Appetizers)" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="rounded-xl h-12" />
                                    <Input placeholder="Item Image URL (https://...)" value={newItem.image} onChange={e => setNewItem({ ...newItem, image: e.target.value })} className="rounded-xl h-12" />
                                    <div className="flex items-center gap-4 bg-gray-50 px-4 rounded-xl border border-gray-100 h-12 md:col-span-2">
                                        <label className="text-sm font-bold text-gray-500">Is Vegetarian?</label>
                                        <input type="checkbox" checked={newItem.is_veg} onChange={e => setNewItem({ ...newItem, is_veg: e.target.checked })} className="w-5 h-5 accent-green-600" />
                                    </div>
                                </div>
                                <textarea
                                    placeholder="Description"
                                    value={newItem.description}
                                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl p-4 text-sm resize-none h-24 outline-none focus:border-orange-400"
                                />
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button variant="outline" onClick={() => setShowAddItem(false)} className="rounded-xl h-11 px-6">Cancel</Button>
                                    <Button onClick={addMenuItem} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-10 h-11 font-bold">Save Item</Button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.isArray(menuItems) && menuItems.map(item => (
                                <div key={item._id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm group hover:border-orange-200 transition-all">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 font-black overflow-hidden flex-shrink-0">
                                            {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <UtensilsCrossed className="w-8 h-8 opacity-20" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-black text-gray-900 group-hover:text-orange-600 transition-colors">{item.name}</h4>
                                                {item.is_veg && <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />}
                                            </div>
                                            <p className="text-lg font-black text-orange-600">₹{item.price}</p>
                                            <p className="text-xs text-gray-400 line-clamp-2 mt-1">{item.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2.5 py-1 rounded-lg">{item.category}</span>
                                        <div className="flex gap-1">
                                            <Button variant="outline" onClick={() => deleteMenuItem(item._id)} className="h-9 w-9 p-0 rounded-xl border-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {(!Array.isArray(menuItems) || menuItems.length === 0) && (
                            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <UtensilsCrossed className="w-10 h-10 text-gray-200" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">No menu items yet</h3>
                                <p className="text-gray-400 font-medium mb-8">Start adding your delicious dishes to attract customers!</p>
                                <Button onClick={() => setShowAddItem(true)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-8 h-12 font-black shadow-lg shadow-orange-100">
                                    Add Your First Item
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {tab === "orders" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <h1 className="text-3xl font-black text-gray-900">Manage Orders</h1>
                        <div className="space-y-4">
                            {Array.isArray(orders) && orders.map(o => (
                                <div key={o._id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <p className="font-black text-lg text-gray-900">{o.customer?.name || "Customer"}</p>
                                                <span className="text-xs font-bold text-gray-400 tracking-wide uppercase">{format(new Date(o.createdAt || o.created_date), "MMM d, h:mm a")}</span>
                                            </div>
                                            <p className="text-sm text-gray-500">{o.items?.map(i => `${i.name} ×${i.quantity}`).join(", ")}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-2xl font-black text-gray-900">₹{(o.totalAmount || o.total || 0).toFixed(2)}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{o.payment_method || "Paid Online"}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-50">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Update Status</span>
                                            <select
                                                value={o.status}
                                                onChange={e => updateOrderStatus(o._id, e.target.value)}
                                                className={`text-xs font-black px-4 py-2 rounded-full border-none outline-none cursor-pointer shadow-sm transition-all ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}
                                            >
                                                {ORDER_STATUSES.map(s => (
                                                    <option key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {o.deliveryAddress && <div className="ml-auto text-sm text-gray-500 font-medium">📍 {o.deliveryAddress}</div>}
                                    </div>
                                </div>
                            ))}
                            {(!Array.isArray(orders) || orders.length === 0) && <div className="text-center py-20 text-gray-400 font-bold">No orders found</div>}
                        </div>
                    </div>
                )}

                {tab === "events" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <h3 className="font-black text-gray-900 text-xl">Event Discovery ({Array.isArray(events) ? events.length : 0})</h3>
                            <Button onClick={() => setShowAddEvent(true)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-2 shadow-lg shadow-orange-100 h-11">
                                <Plus className="w-4 h-4" /> Create New Event
                            </Button>
                        </div>

                        {showAddEvent && (
                            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-100 shadow-2xl space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="rounded-xl h-12" />
                                    <select 
                                        value={newEvent.type} 
                                        onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 h-12 text-sm outline-none focus:border-orange-400 font-bold"
                                    >
                                        <option>Food Festival</option>
                                        <option>Happy Hour</option>
                                        <option>Live Music</option>
                                        <option>Chef Special</option>
                                        <option>Holiday Event</option>
                                        <option>Other</option>
                                    </select>
                                    <Input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="rounded-xl h-12" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="time" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} className="rounded-xl h-12" />
                                        <Input type="time" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} className="rounded-xl h-12" />
                                    </div>
                                    <Input placeholder="Max Capacity" type="number" value={newEvent.capacity} onChange={e => setNewEvent({ ...newEvent, capacity: e.target.value })} className="rounded-xl h-12" />
                                    <Input placeholder="Image URL" value={newEvent.image} onChange={e => setNewEvent({ ...newEvent, image: e.target.value })} className="rounded-xl h-12" />
                                </div>
                                <textarea
                                    placeholder="Describe your event..."
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl p-4 text-sm resize-none h-24 outline-none focus:border-orange-400"
                                />
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button variant="outline" onClick={() => setShowAddEvent(false)} className="rounded-xl h-11 px-6">Cancel</Button>
                                    <Button onClick={addEvent} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-10 h-11 font-black shadow-lg shadow-orange-100">Publish Event</Button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {Array.isArray(events) && events.map(event => (
                                <div key={event._id} className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 group hover:border-orange-200 transition-all">
                                    <div className="w-full md:w-36 h-36 rounded-3xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-50 shadow-inner">
                                        <img src={event.image || "https://images.unsplash.com/photo-1514525253361-bee8718a7439?auto=format&fit=crop&q=80&w=300"} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <Badge className="bg-orange-50 text-orange-600 border-none text-[10px] uppercase font-black px-2.5 py-1 mb-1 rounded-lg">{event.type}</Badge>
                                                <h4 className="font-black text-gray-900 text-lg leading-tight group-hover:text-orange-600 transition-colors">{event.title}</h4>
                                            </div>
                                            <Button variant="outline" onClick={() => deleteEvent(event._id)} className="h-9 w-9 p-0 rounded-xl border-gray-50 text-gray-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400"><Calendar className="w-3.5 h-3.5 text-orange-300" /> {event.date && !isNaN(new Date(event.date).getTime()) ? format(new Date(event.date), "MMM d, yyyy") : "No Date"}</div>
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400"><Clock className="w-3.5 h-3.5 text-orange-300" /> {event.startTime} - {event.endTime}</div>
                                            <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg"><Zap className="w-3.5 h-3.5" /> {event.rsvp_count || 0}/{event.capacity} Booked</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "reservations" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <h1 className="text-3xl font-black text-gray-900">Table Bookings</h1>
                        <div className="grid gap-4">
                            {Array.isArray(reservations) && reservations.map(res => (
                                <div key={res._id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <p className="font-black text-gray-900 text-lg">{res.user_name}</p>
                                            <Badge className={`${res.status === "CONFIRMED" ? "bg-green-100 text-green-600" : res.status === "CANCELLED" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"} border-none font-bold capitalize`}>{res.status}</Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {res.date && !isNaN(new Date(res.date).getTime()) ? format(new Date(res.date), "MMM d, yyyy") : "Date TBD"}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {res.time || "Time TBD"}</span>
                                            <span className="flex items-center gap-1.5 text-orange-500"><Zap className="w-3.5 h-3.5" /> {res.guests} Guests</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {res.status === "PENDING" && (
                                            <>
                                                <Button onClick={() => api.reservations.update(res._id, { status: "CONFIRMED" }).then(() => setReservations(rs => rs.map(r => r._id === res._id ? { ...r, status: "CONFIRMED" } : r)))} className="bg-green-500 hover:bg-green-600 text-white rounded-xl h-11 px-6 font-bold shadow-lg shadow-green-100">Approve</Button>
                                                <Button onClick={() => api.reservations.update(res._id, { status: "CANCELLED" }).then(() => setReservations(rs => rs.map(r => r._id === res._id ? { ...r, status: "CANCELLED" } : r)))} variant="outline" className="text-red-500 border-red-100 hover:bg-red-50 rounded-xl h-11 px-6 font-bold">Reject</Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {reservations.length === 0 && <div className="text-center py-20 text-gray-400 font-bold bg-white rounded-[2.5rem] border border-gray-50">No reservations booked yet</div>}
                        </div>
                    </div>
                )}

                {tab === "reviews" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <h1 className="text-3xl font-black text-gray-900">Customer Feedback</h1>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {Array.isArray(reviews) && reviews.map(rev => (
                                <div key={rev._id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black">{rev.user_name?.[0] || "U"}</div>
                                            <div>
                                                <p className="font-bold text-gray-900">{rev.user_name || rev.user?.name || "Anonymous"}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rev.createdAt && !isNaN(new Date(rev.createdAt).getTime()) ? format(new Date(rev.createdAt), "MMM d, yyyy") : "Recently"}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex text-yellow-500 text-xs">{"★".repeat(rev.rating)}</div>
                                            {rev.sentiment && (
                                                <Badge className={`text-[9px] uppercase font-black px-2 py-0.5 border-none ${
                                                    rev.sentiment === 'positive' ? 'bg-green-100 text-green-600' :
                                                    rev.sentiment === 'negative' ? 'bg-red-100 text-red-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {rev.sentiment}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-50">"{rev.reviewText}"</p>
                                </div>
                            ))}
                        </div>
                        {(!Array.isArray(reviews) || reviews.length === 0) && (
                            <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-50">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Star className="w-8 h-8 text-gray-200" />
                                </div>
                                <h3 className="text-lg font-black text-gray-900">No reviews yet</h3>
                                <p className="text-gray-400 font-medium text-sm">Feedback from customers will appear here.</p>
                            </div>
                        )}
                    </div>
                )}

                {tab === "settings" && (
                    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
                        <h1 className="text-3xl font-black text-gray-900">Store Settings</h1>
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Select Restaurant</label>
                                <select 
                                    value={restaurant._id}
                                    onChange={async (e) => {
                                        const r = allRestaurants.find(res => res._id === e.target.value);
                                        if (r) {
                                            localStorage.setItem("active_restaurant_id", r._id);
                                            setRestaurant(r);
                                            setEditRest({ 
                                                name: r.name, 
                                                cuisine: Array.isArray(r.cuisine) ? r.cuisine.join(", ") : r.cuisine, 
                                                address: r.address,
                                                image: r.image || ""
                                            });
                                            setAddrQuery(r.address);
                                            // Reload dashboard data for this restaurant
                                            const [items, ords, res, revs, evts] = await Promise.all([
                                                api.menuItems.filter({ restaurant_id: r._id }),
                                                api.orders.filter({ restaurant_id: r._id }, "-created_date", 50),
                                                api.reservations.filter({ restaurant_id: r._id }, "-created_date", 50),
                                                api.reviews.filter({ restaurant_id: r._id }, "-createdAt", 50).catch(() => []), 
                                                api.events.list({ restaurantId: r._id }).catch(() => []),
                                            ]);
                                            setMenuItems(items?.data || items || []);
                                            setOrders(ords?.data || ords || []);
                                            setReservations(res?.data || res || []);
                                            setReviews(revs?.data || revs || []);
                                            setEvents(evts?.data || evts || []);
                                        }
                                    }}
                                    className="w-full rounded-2xl h-14 border-2 border-gray-50 font-bold text-lg focus:border-orange-500 outline-none px-4 bg-white"
                                >
                                    {allRestaurants.map(r => (
                                        <option key={r._id} value={r._id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Cuisine Types (comma separated)</label>
                                <Input 
                                    value={editRest.cuisine} 
                                    onChange={e => setEditRest(s => ({ ...s, cuisine: e.target.value }))}
                                    className="rounded-2xl h-14 border-gray-50 font-bold focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Restaurant Image URL</label>
                                <Input 
                                    value={editRest.image} 
                                    onChange={e => setEditRest(s => ({ ...s, image: e.target.value }))}
                                    className="rounded-2xl h-14 border-gray-50 font-bold focus:border-orange-500"
                                    placeholder="https://images.unsplash.com/..."
                                />
                            </div>
                            <div className="relative">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Store Address Search</label>
                                <div className="relative">
                                    <Input 
                                        value={addrQuery} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            setAddrQuery(val);
                                            setEditRest(s => ({ ...s, address: val }));
                                            if (val.length > 2) {
                                                // Simple mock suggestions based on keywords or common areas
                                                const areas = ["Koregaon Park, Pune", "Indiranagar, Bangalore", "Hitech City, Hyderabad", "Bandra West, Mumbai", "Cyber Hub, Gurgaon"];
                                                setAddrSuggestions(areas.filter(a => a.toLowerCase().includes(val.toLowerCase())));
                                            } else {
                                                setAddrSuggestions([]);
                                            }
                                        }}
                                        className="rounded-2xl h-14 border-gray-50 font-bold focus:border-orange-500 pr-10"
                                        placeholder="Type to search address..."
                                    />
                                    {addrSuggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-2xl mt-2 shadow-2xl z-50 overflow-hidden">
                                            {addrSuggestions.map(s => (
                                                <button 
                                                    key={s} 
                                                    onClick={() => {
                                                        setAddrQuery(s);
                                                        setEditRest(prev => ({ ...prev, address: s }));
                                                        setAddrSuggestions([]);
                                                    }}
                                                    className="w-full text-left px-6 py-4 hover:bg-orange-50 text-sm font-bold text-gray-700 transition-colors border-b border-gray-50 last:border-none"
                                                >
                                                    📍 {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button 
                                onClick={async () => {
                                    const updated = await api.restaurants.update(restaurant._id, {
                                        ...editRest,
                                        cuisine: editRest.cuisine.split(',').map(s => s.trim())
                                    });
                                    setRestaurant(updated.data || updated);
                                    alert("Restaurant details updated successfully!");
                                }} 
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-14 font-black shadow-lg shadow-orange-100"
                            >
                                <Save className="w-5 h-5 mr-2" /> Save Profile Changes
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 py-2 flex items-center justify-around shadow-2xl">
                {TABS.map(t => (
                    <button 
                        key={t.id} 
                        onClick={() => setTab(t.id)} 
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${tab === t.id ? "text-orange-500 bg-orange-50" : "text-gray-400"}`}
                    >
                        <t.icon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{t.label.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}