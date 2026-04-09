import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Minus, Trash2, Tag, ChevronRight, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";

export default function Cart() {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [promoCode, setPromoCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [promoError, setPromoError] = useState("");
    const [promoLoading, setPromoLoading] = useState(false);

    useEffect(() => {
        setCart(JSON.parse(localStorage.getItem("foodhub_cart") || "[]"));
    }, []);

    const saveCart = (updated) => {
        setCart(updated);
        localStorage.setItem("foodhub_cart", JSON.stringify(updated));
        window.dispatchEvent(new Event("cartUpdated"));
    };

    const updateQty = (itemId, delta) => {
        let updated = cart.map(i => i.id === itemId ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0);
        saveCart(updated);
    };

    const removeItem = (itemId) => saveCart(cart.filter(i => i.id !== itemId));

    const applyPromo = async () => {
        if (!promoCode.trim()) return;
        setPromoLoading(true);
        setPromoError("");
        const coupons = await api.coupons.filter({ code: promoCode.toUpperCase(), is_active: true }).catch(() => []);
        if (coupons.length === 0) {
            setPromoError("Invalid or expired promo code");
        } else {
            const c = coupons[0];
            if (c.expiry_date && new Date(c.expiry_date) < new Date()) {
                setPromoError("This coupon has expired");
            } else if (subtotal < (c.min_order || 0)) {
                setPromoError(`Minimum order ₹${c.min_order} required`);
            } else {
                setAppliedCoupon(c);
            }
        }
        setPromoLoading(false);
    };

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = subtotal > 0 ? (cart[0]?.delivery_fee ?? 2.99) : 0;
    const discount = appliedCoupon
        ? appliedCoupon.discount_type === "percentage"
            ? Math.min(subtotal * appliedCoupon.discount_value / 100, appliedCoupon.max_discount || Infinity)
            : appliedCoupon.discount_value
        : 0;
    const taxes = subtotal * 0.08;
    const total = subtotal + deliveryFee - discount + taxes;

    const restaurantName = cart[0]?.restaurant_name;

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center py-20">
                    <div className="text-8xl mb-6">🛒</div>
                    <h2 className="text-2xl font-black text-gray-800 mb-3">Your cart is empty</h2>
                    <p className="text-gray-500 mb-8">Add items from a restaurant to get started.</p>
                    <Link to={createPageUrl("Restaurants")}>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 h-12 rounded-2xl font-bold text-base shadow-lg shadow-orange-200">
                            Browse Restaurants
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <h1 className="text-3xl font-black text-gray-900 mb-2">Your Cart</h1>
                {restaurantName && <p className="text-gray-500 text-sm mb-8">From <span className="font-bold text-orange-500">{restaurantName}</span></p>}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Items List */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {cart.map((item, idx) => (
                                <div key={item.id} className={`flex items-center gap-4 p-4 ${idx < cart.length - 1 ? "border-b border-gray-50" : ""}`}>
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-red-100 flex-shrink-0">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                                        <p className="text-orange-500 font-bold text-sm mt-0.5">₹{(item.price * item.quantity).toFixed(2)}</p>
                                        <p className="text-xs text-gray-400">₹{item.price.toFixed(2)} each</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                                            <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white transition-colors">
                                                <Minus className="w-3.5 h-3.5 text-gray-600" />
                                            </button>
                                            <span className="w-6 text-center font-bold text-sm text-gray-800">{item.quantity}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white bg-orange-500 transition-colors">
                                                <Plus className="w-3.5 h-3.5 text-white" />
                                            </button>
                                        </div>
                                        <button onClick={() => removeItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Promo Code */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Tag className="w-5 h-5 text-orange-400" />
                                <h3 className="font-bold text-gray-900">Promo Code</h3>
                            </div>
                            {appliedCoupon ? (
                                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                                    <span className="text-green-600 text-sm font-bold">✅ {appliedCoupon.code} applied!</span>
                                    <span className="text-green-600 text-sm">₹{discount.toFixed(2)}</span>
                                    <button onClick={() => setAppliedCoupon(null)} className="ml-auto text-xs text-red-500 font-medium hover:underline">Remove</button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex gap-3">
                                        <Input
                                            placeholder="Enter promo code"
                                            value={promoCode}
                                            onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                            className="rounded-xl border-gray-200 uppercase font-mono text-sm"
                                            onKeyDown={e => e.key === "Enter" && applyPromo()}
                                        />
                                        <Button
                                            onClick={applyPromo}
                                            disabled={promoLoading}
                                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6"
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                    {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h3 className="font-black text-gray-900 text-lg mb-5">Order Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                    <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery fee</span>
                                    <span className={`font-semibold ${deliveryFee === 0 ? "text-green-500" : "text-gray-900"}`}>
                                        {deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}
                                    </span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-500">
                                        <span>Promo discount</span>
                                        <span className="font-semibold">-₹{discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>Taxes & fees</span>
                                    <span className="font-semibold text-gray-900">₹{taxes.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex justify-between">
                                    <span className="font-black text-gray-900 text-base">Total</span>
                                    <span className="font-black text-orange-500 text-xl">₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => navigate(createPageUrl("Checkout"))}
                                className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-13 rounded-2xl font-bold text-base shadow-lg shadow-orange-200 flex items-center justify-between px-6"
                                style={{ height: "52px" }}
                            >
                                <span>Proceed to Checkout</span>
                                <ChevronRight className="w-5 h-5" />
                            </Button>

                            <p className="text-center text-xs text-gray-400 mt-3">
                                🔒 Secure payment · 30-day refund policy
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}