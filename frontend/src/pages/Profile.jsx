import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Package, Heart, Calendar, MessageSquare, Settings, ChevronRight, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const STATUS_COLORS = {
    placed: "bg-blue-100 text-blue-600",
    confirmed: "bg-indigo-100 text-indigo-600",
    preparing: "bg-yellow-100 text-yellow-700",
    picked_up: "bg-orange-100 text-orange-600",
    out_for_delivery: "bg-purple-100 text-purple-600",
    delivered: "bg-green-100 text-green-600",
    cancelled: "bg-red-100 text-red-600",
};

export default function Profile() {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [activeTab, setActiveTab] = useState("orders");
    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.auth.me().then(u => {
            if (!u) { api.auth.redirectToLogin(); return; }
            setUser(u);
            setEditName(u.full_name || "");
            return Promise.all([
                api.orders.filter({ user_email: u.email }, "-created_date", 20),
                api.reservations.filter({ user_email: u.email }, "-created_date", 20),
            ]);
        }).then(([ords, res]) => {
            if (ords) setOrders(ords);
            if (res) setReservations(res);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const saveProfile = async () => {
        await api.auth.updateMe({ full_name: editName });
        setUser(u => ({ ...u, full_name: editName }));
        setEditMode(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
    );
    if (!user) return null;

    const TABS = [
        { id: "orders", label: "Orders", icon: Package, count: orders.length },
        { id: "reservations", label: "Reservations", icon: Calendar, count: reservations.length },
        { id: "profile", label: "Profile", icon: Settings, count: null },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 pt-8 pb-16 px-4 text-white text-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 text-3xl font-black border-4 border-white/40 shadow-xl">
                    {(user.full_name || user.email || "U")[0].toUpperCase()}
                </div>
                <h1 className="text-2xl font-black">{user.full_name || "Foodie"}</h1>
                <p className="text-white/70 text-sm">{user.email}</p>
                <div className="flex justify-center gap-8 mt-5 text-center">
                    <div>
                        <div className="text-2xl font-black">{orders.length}</div>
                        <div className="text-xs text-white/70">Orders</div>
                    </div>
                    <div className="w-px bg-white/20" />
                    <div>
                        <div className="text-2xl font-black">{reservations.length}</div>
                        <div className="text-xs text-white/70">Bookings</div>
                    </div>
                    <div className="w-px bg-white/20" />
                    <div>
                        <div className="text-2xl font-black">{orders.filter(o => o.status === "delivered").length}</div>
                        <div className="text-xs text-white/70">Delivered</div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8">
                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-lg p-1.5 flex gap-1 mb-6">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === tab.id ? "bg-orange-500 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count !== null && tab.count > 0 && (
                                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${activeTab === tab.id ? "bg-white/25" : "bg-gray-200"}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === "orders" && (
                    <div className="space-y-4 pb-10">
                        {orders.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <div className="text-5xl mb-3">📦</div>
                                <p className="font-semibold">No orders yet</p>
                                <Link to={createPageUrl("Restaurants")}>
                                    <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl">Order Now</Button>
                                </Link>
                            </div>
                        ) : (
                            orders.map(order => (
                                <Link key={order.id} to={`${createPageUrl("OrderTracking")}?id=${order.id}`}>
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{order.restaurant_name}</h4>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {order.created_date ? format(new Date(order.created_date), "MMM d, yyyy 'at' h:mm a") : ""}
                                                </p>
                                            </div>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                                                {order.status?.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-3">
                                            {order.items?.map(i => i.name).join(", ")}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-gray-900">₹{order.total?.toFixed(2)}</span>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "reservations" && (
                    <div className="space-y-4 pb-10">
                        {reservations.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <div className="text-5xl mb-3">📅</div>
                                <p className="font-semibold">No reservations yet</p>
                                <Link to={createPageUrl("TableBooking")}>
                                    <Button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl">Book a Table</Button>
                                </Link>
                            </div>
                        ) : (
                            reservations.map(res => (
                                <div key={res.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-bold text-gray-900">{res.restaurant_name}</h4>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${res.status === "confirmed" ? "bg-green-100 text-green-600" :
                                                res.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"
                                            }`}>{res.status}</span>
                                    </div>
                                    <div className="flex gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-purple-400" />
                                            {format(new Date(res.date), "MMM d, yyyy")}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-purple-400" />
                                            {res.time}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-4 h-4 text-purple-400" />
                                            {res.guests} guests
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "profile" && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-10">
                        <h3 className="font-black text-gray-900 text-lg mb-5">Personal Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Full Name</label>
                                {editMode ? (
                                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl border-gray-200 h-11" />
                                ) : (
                                    <p className="font-semibold text-gray-800 py-2">{user.full_name || "Not set"}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Email</label>
                                <p className="font-semibold text-gray-800 py-2">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            {editMode ? (
                                <>
                                    <Button onClick={saveProfile} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6">Save Changes</Button>
                                    <Button onClick={() => setEditMode(false)} variant="outline" className="rounded-xl">Cancel</Button>
                                </>
                            ) : (
                                <Button onClick={() => setEditMode(true)} variant="outline" className="rounded-xl border-gray-200">Edit Profile</Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}