import { api } from "@/api/client";
import { useState, useEffect } from "react";
import {
    MapPin, Package, Navigation2, CheckCircle2,
    Clock, TrendingUp, AlertTriangle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function CourierDashboard() {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("active");

    useEffect(() => {
        api.auth.me().then(async u => {
            if (!u) { api.auth.redirectToLogin(); return; }
            setUser(u);
            const ords = await api.orders.filter({}, "-created_date", 100);
            setOrders(ords);
            setLoading(false);
        }).catch(() => api.auth.redirectToLogin());
    }, []);

    const updateOrderStatus = async (orderId, status) => {
        await api.orders.update(orderId, { status });
        setOrders(os => os.map(o => o.id === orderId ? { ...o, status } : o));
    };

    const myOrders = orders.filter(o => o.status !== "placed" && o.status !== "cancelled" && o.status !== "confirmed");
    const activeDeliveries = myOrders.filter(o => o.status === "preparing" || o.status === "picked_up" || o.status === "out_for_delivery");
    const completedDeliveries = myOrders.filter(o => o.status === "delivered");
    const earnings = completedDeliveries.length * 5; // Flat $5 per delivery for demo

    const displayedOrders = statusFilter === "active" ? activeDeliveries : completedDeliveries;

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-60 bg-gray-950 text-white min-h-screen p-4 flex-shrink-0 fixed top-16 bottom-0 left-0 z-20">
                <div className="mb-6 px-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Courier Profile</p>
                    <p className="font-black text-white text-sm truncate">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <p className="text-xs text-gray-400">Online & Ready</p>
                    </div>
                </div>
                <button
                    onClick={() => setStatusFilter("active")}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${statusFilter === "active" ? "bg-orange-500 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
                >
                    <Navigation2 className="w-4 h-4" />
                    Active Runs
                    {activeDeliveries.length > 0 && <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{activeDeliveries.length}</span>}
                </button>
                <button
                    onClick={() => setStatusFilter("completed")}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${statusFilter === "completed" ? "bg-orange-500 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
                >
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                </button>
            </div>

            {/* Mobile tabs */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex">
                <button onClick={() => setStatusFilter("active")} className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-semibold ${statusFilter === "active" ? "text-orange-500" : "text-gray-400"}`}>
                    <Navigation2 className="w-5 h-5" />Active Runs
                </button>
                <button onClick={() => setStatusFilter("completed")} className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-semibold ${statusFilter === "completed" ? "text-orange-500" : "text-gray-400"}`}>
                    <CheckCircle2 className="w-5 h-5" />Completed
                </button>
            </div>

            <div className="flex-1 md:ml-60 p-6 pb-24 md:pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 mb-6">Courier Dashboard</h1>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50 text-green-600 mb-3">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <p className="text-2xl font-black text-gray-900">₹{(earnings * 80).toFixed(0)}</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Est. Earnings</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 mb-3">
                                <Package className="w-5 h-5" />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{completedDeliveries.length}</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Total Delivered</p>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-4">{statusFilter === "active" ? "Active Assignments" : "Delivery History"}</h2>
                    {displayedOrders.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-gray-900">No {statusFilter} deliveries found.</h3>
                            <p className="text-gray-500 text-sm mt-1">Wait for orders to be assigned to you.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayedOrders.map(o => (
                                <div key={o.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                                     {o.status === "preparing" && <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-400" />}
                                     {o.status === "picked_up" && <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />}
                                     {o.status === "out_for_delivery" && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />}
                                     {o.status === "delivered" && <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500" />}
                                    
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-black text-gray-900 text-lg">Order #{o.id?.slice(-6) || o._id?.slice(-6)}</span>
                                                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{o.status?.replace(/_/g, " ")}</span>
                                            </div>
                                            <div className="space-y-2 mt-4 text-sm">
                                                <div className="flex flex-col relative">
                                                    <div className="flex items-start gap-3">
                                                       <div className="mt-0.5 w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-[10px]">A</div>
                                                       <div>
                                                           <p className="font-bold text-gray-900 text-xs uppercase tracking-wide">Pickup Store</p>
                                                           <p className="text-gray-600">{o.restaurant_name || "FoodHub Restaurant"}</p>
                                                       </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col relative mt-3">
                                                    <div className="flex items-start gap-3">
                                                       <div className="mt-0.5 w-6 h-6 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold text-[10px]">B</div>
                                                       <div>
                                                           <p className="font-bold text-gray-900 text-xs uppercase tracking-wide">Dropoff Customer</p>
                                                           <p className="text-gray-600">{o.delivery_address || `Customer: ${o.user_name}`}</p>
                                                       </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full md:w-auto">
                                             {o.status === "preparing" && (
                                                <Button onClick={() => updateOrderStatus(o.id, "picked_up")} className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl">
                                                    Mark as Picked Up
                                                </Button>
                                             )}
                                              {o.status === "picked_up" && (
                                                <Button onClick={() => updateOrderStatus(o.id, "out_for_delivery")} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                                                    Start Delivery Journey
                                                </Button>
                                             )}
                                              {o.status === "out_for_delivery" && (
                                                <Button onClick={() => updateOrderStatus(o.id, "delivered")} className="bg-green-500 hover:bg-green-600 text-white rounded-xl">
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Delivered
                                                </Button>
                                             )}
                                             {o.status === "delivered" && (
                                                 <p className="text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-xl text-center border border-green-100">
                                                     Delivered successfully!
                                                 </p>
                                             )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
