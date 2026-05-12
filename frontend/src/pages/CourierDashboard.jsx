import { api } from "@/api/client";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
    MapPin, Package, Navigation2, CheckCircle2,
    Clock, TrendingUp, AlertTriangle, RefreshCw, Bike
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

import DeliveryMap from "../components/DeliveryMap";

export default function CourierDashboard() {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("active");
    const [isOnline, setIsOnline] = useState(false);
    const [courierLocations, setCourierLocations] = useState({});
    
    const socketRef = useRef(null);
    const isOnlineRef = useRef(false);

    useEffect(() => {
        isOnlineRef.current = isOnline;
    }, [isOnline]);

    useEffect(() => {
        api.auth.me().then(async u => {
            if (!u) { api.auth.redirectToLogin(); return; }
            setUser(u);
            setIsOnline(u.isOnline || false);
            
            // Initial fetch of available orders
            const fetchInitialAvailable = async () => {
                try {
                    const data = await api.orders.list();
                    const avail = (data?.data || data || []).filter(o => {
                        const s = (o.status || "").toUpperCase();
                        return (s === "PREPARING" || s === "READY_FOR_PICKUP") && 
                        !o.courier && 
                        !(o.rejectedBy || []).includes(u._id);
                    });
                    setAvailableOrders(avail);
                } catch (err) {
                    console.error("Failed to fetch initial available orders", err);
                }
            };
            fetchInitialAvailable();

            const ords = await api.orders.filter({ courier: u._id }, "-created_date", 50);
            setOrders(ords);
            setLoading(false);
            
            // Initialize courier locations for active orders
            const initialLocations = {};
            ords.forEach(o => {
                if (o.status === "PREPARING" || o.status === "PICKED_UP" || o.status === "DELIVERING") {
                    const rLoc = o.restaurant?.location?.coordinates ? { lat: o.restaurant.location.coordinates[1], lng: o.restaurant.location.coordinates[0] } : { lat: 12.9716, lng: 77.5946 };
                    // Start courier near restaurant
                    initialLocations[o._id || o.id] = { lat: rLoc.lat + 0.005, lng: rLoc.lng - 0.005 };
                }
            });
            setCourierLocations(initialLocations);
        }).catch(() => api.auth.redirectToLogin());
    }, []);

    // Dedicated Socket Effect
    useEffect(() => {
        if (!user) return;

        const socketUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
        const socket = io(socketUrl);
        socketRef.current = socket;

        socket.emit("join_courier", user._id);

        socket.on("new_delivery_available", (newOrder) => {
            if (isOnlineRef.current) {
                setAvailableOrders(prev => {
                    const id = newOrder.orderId || newOrder._id;
                    if (prev.find(o => (o.orderId || o._id) === id)) return prev;
                    return [{ ...newOrder, orderId: id }, ...prev];
                });
            }
        });

        socket.on("order_update", ({ orderId, status, courierId }) => {
            if (courierId && courierId !== user._id) {
                setAvailableOrders(prev => prev.filter(o => (o.orderId || o._id) !== orderId));
            }
            setOrders(prev => prev.map(o => (o._id || o.id) === orderId ? { ...o, status } : o));
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    // Simulate movement for active deliveries
    useEffect(() => {
        const interval = setInterval(() => {
            setCourierLocations(prevLocations => {
                const newLocations = { ...prevLocations };
                
                orders.forEach(o => {
                    const orderId = o._id || o.id;
                    const status = o.status;
                    
                    if (status !== "PREPARING" && status !== "PICKED_UP" && status !== "DELIVERING") return;
                    
                    let targetLoc;
                    if (status === "PREPARING" || status === "PICKED_UP") {
                        // Move toward restaurant
                        targetLoc = o.restaurant?.location?.coordinates && (o.restaurant.location.coordinates[0] !== 0 || o.restaurant.location.coordinates[1] !== 0) ? { lat: o.restaurant.location.coordinates[1], lng: o.restaurant.location.coordinates[0] } : { lat: 12.9716, lng: 77.5946 };
                    } else if (status === "DELIVERING") {
                        // Move toward customer
                        targetLoc = o.customer?.location?.coordinates && (o.customer.location.coordinates[0] !== 0 || o.customer.location.coordinates[1] !== 0) ? { lat: o.customer.location.coordinates[1], lng: o.customer.location.coordinates[0] } : { 
                            lat: o.restaurant?.location?.coordinates ? o.restaurant.location.coordinates[1] - 0.02 : 12.9516, 
                            lng: o.restaurant?.location?.coordinates ? o.restaurant.location.coordinates[0] + 0.02 : 77.6146 
                        };
                    }
                    
                    if (!targetLoc) return;
                    
                    const currentLoc = prevLocations[orderId] || { lat: targetLoc.lat + 0.005, lng: targetLoc.lng - 0.005 };
                    
                    // Simple linear interpolation for movement (move 5% closer each tick)
                    const latDiff = targetLoc.lat - currentLoc.lat;
                    const lngDiff = targetLoc.lng - currentLoc.lng;
                    
                    const newLat = currentLoc.lat + (latDiff * 0.05);
                    const newLng = currentLoc.lng + (lngDiff * 0.05);
                    
                    newLocations[orderId] = { lat: newLat, lng: newLng };
                    
                    // Emit update for customers
                    if (socketRef.current) {
                        socketRef.current.emit("update_location", {
                            orderId: orderId,
                            coordinates: { lat: newLat, lng: newLng }
                        });
                    }
                });
                
                return newLocations;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [orders]);

    const toggleOnline = async () => {
        const newStatus = !isOnline;
        await api.auth.updateProfile({ isOnline: newStatus });
        setIsOnline(newStatus);
    };

    const acceptOrder = async (orderId) => {
        try {
            const updated = await api.orders.accept(orderId);
            setOrders(prev => [updated, ...prev]);
            setAvailableOrders(prev => prev.filter(o => (o.orderId || o._id) !== orderId));
            
            // Initialize map location immediately
            setCourierLocations(prev => {
                const rLoc = updated.restaurant?.location?.coordinates ? { lat: updated.restaurant.location.coordinates[1], lng: updated.restaurant.location.coordinates[0] } : { lat: 12.9716, lng: 77.5946 };
                return {
                    ...prev,
                    [updated._id || updated.id]: { lat: rLoc.lat + 0.005, lng: rLoc.lng - 0.005 }
                };
            });
        } catch (err) {
            alert(err.response?.data?.message || "Failed to accept order");
        }
    };

    const rejectOrder = async (orderId) => {
        await api.orders.reject(orderId);
        setAvailableOrders(prev => prev.filter(o => o.orderId !== orderId));
    };

    const updateOrderStatus = async (orderId, status) => {
        await api.orders.update(orderId, { status });
        setOrders(os => os.map(o => o._id === orderId ? { ...o, status } : o));
        
        // Also notify via socket immediately
        if (socketRef.current) {
            socketRef.current.emit("update_order_status", { orderId, status });
        }
    };

    const myOrders = orders.filter(o => o.courier === user?._id || o.courier?._id === user?._id);
    const activeDeliveries = myOrders.filter(o => ["READY_FOR_PICKUP", "PREPARING", "PICKED_UP", "DELIVERING"].includes(o.status));
    const completedDeliveries = myOrders.filter(o => o.status === "DELIVERED");
    
    // Calculate total earnings dynamically (25% of delivered orders)
    const earnings = completedDeliveries.reduce((sum, o) => {
        const amount = o.totalAmount || o.total || 0;
        return sum + (amount * 0.25);
    }, 0);

    const displayedOrders = statusFilter === "active" ? activeDeliveries : completedDeliveries;

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-60 bg-gray-950 text-white min-h-screen p-4 flex-shrink-0 fixed top-16 bottom-0 left-0 z-20">
                <div className="mb-6 px-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Courier Profile</p>
                    <p className="font-black text-white text-sm truncate">{user.email}</p>
                    <div className="mt-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isOnline ? "Active" : "On Break"}</p>
                            <button 
                                onClick={toggleOnline}
                                className={`w-10 h-5 rounded-full transition-all relative ${isOnline ? "bg-green-500" : "bg-gray-700"}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isOnline ? "left-6" : "left-1"}`} />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                            {isOnline ? "You are visible for new deliveries" : "Go online to start earning"}
                        </p>
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
                            <p className="text-2xl font-black text-gray-900">₹{earnings.toFixed(0)}</p>
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
                    
                    {/* Available Orders Section */}
                    {statusFilter === "active" && isOnline && availableOrders.length > 0 && (
                        <div className="mb-8 space-y-4">
                            <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 animate-pulse" />
                                New Deliveries Nearby
                            </h3>
                            {availableOrders.map(o => {
                                const id = o._id || o.orderId;
                                const amount = o.totalAmount || o.total || 0;
                                const earned = (amount * 0.25).toFixed(0);
                                
                                return (
                                <div key={id} className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                                            <Package className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900">New Order from {o.restaurantName || o.restaurant?.name || "Store"}</p>
                                            <p className="text-sm text-gray-600 truncate max-w-xs">{o.deliveryAddress || "Customer Address"}</p>
                                            <div className="flex gap-4 mt-1">
                                                <p className="text-xs font-bold text-orange-600">Earnings: ₹{earned}</p>
                                                {o.phoneNumber && <p className="text-xs font-bold text-gray-500">📞 {o.phoneNumber}</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => rejectOrder(id)} variant="ghost" className="text-gray-500 font-bold text-sm">Ignore</Button>
                                        <Button onClick={() => acceptOrder(id)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-6">Accept Run</Button>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}

                    {displayedOrders.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-gray-900">No {statusFilter} deliveries found.</h3>
                            <p className="text-gray-500 text-sm mt-1">{isOnline ? "Wait for orders to be assigned to you." : "Go online to see available orders."}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayedOrders.map(o => {
                                const amount = o.totalAmount || o.total || 0;
                                const earned = (amount * 0.25).toFixed(0);
                                return (
                                <div key={o._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                                     {o.status === "PREPARING" && <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-400" />}
                                     {o.status === "PICKED_UP" && <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />}
                                     {o.status === "DELIVERING" && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />}
                                     {o.status === "DELIVERED" && <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500" />}
                                    
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-black text-gray-900 text-lg">Order #{o.id?.slice(-6) || o._id?.slice(-6)}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                                                    o.status === "PREPARING" ? "bg-yellow-100 text-yellow-700" : 
                                                    o.status === "PICKED_UP" ? "bg-orange-100 text-orange-600" : 
                                                    "bg-blue-100 text-blue-600"
                                                }`}>{o.status?.replace(/_/g, " ")}</span>
                                                <span className="ml-auto md:ml-2 text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">Earn: ₹{earned}</span>
                                            </div>
                                            
                                            {/* Live Delivery Map for Courier */}
                                            {(o.status === "READY_FOR_PICKUP" || o.status === "PREPARING" || o.status === "PICKED_UP" || o.status === "DELIVERING") && (
                                                <div className="my-4 h-64 rounded-2xl relative overflow-hidden border border-gray-200">
                                                    <DeliveryMap 
                                                        status={o.status}
                                                        restaurantLoc={o.restaurant?.location?.coordinates && (o.restaurant.location.coordinates[0] !== 0 || o.restaurant.location.coordinates[1] !== 0) ? { lng: o.restaurant.location.coordinates[0], lat: o.restaurant.location.coordinates[1] } : { lat: 12.9716, lng: 77.5946 }}
                                                        customerLoc={o.customer?.location?.coordinates && (o.customer.location.coordinates[0] !== 0 || o.customer.location.coordinates[1] !== 0) ? { lng: o.customer.location.coordinates[0], lat: o.customer.location.coordinates[1] } : { 
                                                            lat: o.restaurant?.location?.coordinates ? o.restaurant.location.coordinates[1] - 0.02 : 12.9516, 
                                                            lng: o.restaurant?.location?.coordinates ? o.restaurant.location.coordinates[0] + 0.02 : 77.6146 
                                                        }}
                                                        courierLoc={courierLocations[o._id || o.id] || null}
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-3 mt-4 text-sm">
                                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="mt-0.5 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-[10px]">A</div>
                                                    <div>
                                                        <p className="font-black text-gray-900 text-[10px] uppercase tracking-wider">Pickup From</p>
                                                        <p className="font-bold text-gray-700">{o.restaurantName || o.restaurant?.name || "Restaurant"}</p>
                                                        <p className="text-gray-500 text-xs">{o.restaurant?.address || "Jaipur, Rajasthan"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-[10px]">B</div>
                                                    <div>
                                                        <p className="font-black text-gray-900 text-[10px] uppercase tracking-wider">Deliver To</p>
                                                        <p className="font-bold text-gray-700">{o.customer?.name || o.customerName || "Customer"}</p>
                                                        <p className="text-gray-500 text-xs">{o.deliveryAddress || "Customer Address"}</p>
                                                        {o.phoneNumber && <p className="text-blue-600 font-bold text-xs mt-1">📞 {o.phoneNumber}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full md:w-auto">
                                             {o.status === "PREPARING" && (
                                                <Button onClick={() => updateOrderStatus(o._id, "PICKED_UP")} className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl">
                                                    Mark as Picked Up
                                                </Button>
                                             )}
                                              {o.status === "PICKED_UP" && (
                                                <Button onClick={() => updateOrderStatus(o._id, "DELIVERING")} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                                                    Start Delivery Journey
                                                </Button>
                                             )}
                                              {o.status === "DELIVERING" && (
                                                <Button onClick={() => updateOrderStatus(o._id, "DELIVERED")} className="bg-green-500 hover:bg-green-600 text-white rounded-xl">
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Delivered
                                                </Button>
                                             )}
                                              {o.status === "DELIVERED" && (
                                                 <p className="text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-xl text-center border border-green-100">
                                                     Delivered successfully!
                                                 </p>
                                             )}
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
