import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { api } from "@/api/client";
import { Package, ChefHat, Bike, CheckCircle2, Clock, MapPin, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const ORDER_STEPS = [
    { status: "PENDING", label: "Order Placed", icon: Package, desc: "Your order has been placed" },
    { status: "ACCEPTED", label: "Confirmed", icon: CheckCircle2, desc: "Restaurant confirmed your order" },
    { status: "PREPARING", label: "Preparing", icon: ChefHat, desc: "Chef is preparing your food" },
    { status: "COURIER_ASSIGNED", label: "Courier Assigned", icon: Bike, desc: "Delivery partner assigned" },
    { status: "DELIVERING", label: "On the Way", icon: Bike, desc: "Your order is almost there!" },
    { status: "DELIVERED", label: "Delivered", icon: CheckCircle2, desc: "Enjoy your meal! 🎉" },
];

const STATUS_INDEX = { 
    PENDING: 0, PLACED: 0, placed: 0, 
    ACCEPTED: 1, confirmed: 1, CONFIRMED: 1,
    PREPARING: 2, preparing: 2, 
    COURIER_ASSIGNED: 3, picked_up: 3, PICKED_UP: 3,
    DELIVERING: 4, out_for_delivery: 4, OUT_FOR_DELIVERY: 4,
    DELIVERED: 5, delivered: 5 
};

export default function OrderTracking() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("id");
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) return;
        const loadOrder = async () => {
            const orders = await api.orders.filter({ id: orderId }).catch(() => []);
            setOrder(orders[0] || null);
            setLoading(false);
        };
        loadOrder();

        // Subscribe to real-time updates
        const unsub = api.orders.subscribeOrder(orderId, event => {
            if (event.orderId === orderId || event.id === orderId) {
                // Since event might just have status, we need to merge or refetch
                if (event.data) setOrder(event.data);
                else setOrder(prev => ({ ...prev, status: event.status }));
            }
        });
        return unsub;
    }, [orderId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
    );
    if (!order) return (
        <div className="min-h-screen flex items-center justify-center text-gray-500">Order not found.</div>
    );

    const currentStep = STATUS_INDEX[order.status] ?? 0;
    const isDelivered = order.status === "DELIVERED" || order.status === "delivered";
    const isCancelled = order.status === "CANCELLED" || order.status === "cancelled";

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    {isCancelled ? (
                        <>
                            <div className="text-6xl mb-3">❌</div>
                            <h1 className="text-2xl font-black text-gray-900">Order Cancelled</h1>
                        </>
                    ) : isDelivered ? (
                        <>
                            <div className="text-6xl mb-3">🎉</div>
                            <h1 className="text-2xl font-black text-gray-900">Delivered!</h1>
                            <p className="text-gray-500 mt-1">Enjoy your meal from {order.restaurant_name}</p>
                        </>
                    ) : (
                        <>
                            <div className="relative w-20 h-20 mx-auto mb-4">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                    <span className="text-3xl animate-bounce">🛵</span>
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-black text-gray-900">Order #{order.id?.slice(-6).toUpperCase()}</h1>
                            <p className="text-gray-500 mt-1">Estimated delivery: {order.estimated_time || 35} min</p>
                        </>
                    )}
                </div>

                {/* Status Timeline */}
                {!isCancelled && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="space-y-0">
                            {ORDER_STEPS.map((step, i) => {
                                const isActive = i === currentStep;
                                const isDone = i < currentStep;
                                const Icon = step.icon;
                                return (
                                    <div key={step.status} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isDone ? "bg-green-500" : isActive ? "bg-orange-500 ring-4 ring-orange-100" : "bg-gray-100"
                                                }`}>
                                                <Icon className={`w-5 h-5 ${isDone || isActive ? "text-white" : "text-gray-400"}`} />
                                            </div>
                                            {i < ORDER_STEPS.length - 1 && (
                                                <div className={`w-0.5 h-8 mt-1 ${isDone ? "bg-green-500" : "bg-gray-100"}`} />
                                            )}
                                        </div>
                                        <div className={`pb-6 ${i === ORDER_STEPS.length - 1 ? "pb-0" : ""}`}>
                                            <p className={`font-bold text-sm ${isActive ? "text-orange-600" : isDone ? "text-green-600" : "text-gray-400"}`}>
                                                {step.label}
                                                {isActive && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full animate-pulse">Live</span>}
                                            </p>
                                            <p className={`text-xs mt-0.5 ${isActive || isDone ? "text-gray-500" : "text-gray-300"}`}>{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Order Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
                    <h3 className="font-black text-gray-900 mb-4">Order Details</h3>
                    <div className="space-y-2 mb-4">
                        {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.name} × {item.quantity}</span>
                                <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span><span>₹{order.subtotal?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Delivery</span><span>₹{order.delivery_fee?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-black text-gray-900 text-base pt-1">
                            <span>Total</span><span className="text-orange-500">₹{order.totalAmount?.toFixed(2) || order.total?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <h4 className="font-bold text-gray-900 text-sm">Delivering to</h4>
                    </div>
                    <p className="text-gray-600 text-sm">{order.delivery_address}</p>
                    {order.delivery_instructions && (
                        <p className="text-gray-400 text-xs mt-1">📝 {order.delivery_instructions}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {isDelivered && (
                        <Link to={`${createPageUrl("RestaurantDetail")}?id=${order.restaurant?._id || order.restaurant}&order_id=${order._id || order.id}`} className="flex-1">
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-12 font-bold">
                                <Star className="w-4 h-4 mr-2" /> Rate & Review
                            </Button>
                        </Link>
                    )}
                    <Link to={createPageUrl("Profile")} className="flex-1">
                        <Button variant="outline" className="w-full rounded-2xl h-12 font-bold border-gray-200">
                            View All Orders
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}