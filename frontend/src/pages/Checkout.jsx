import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, CreditCard, Wallet, Banknote, ChevronRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    address: "",
    city: "",
    pincode: "",
    instructions: "",
    payment: "cash",
  });

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem("foodhub_cart") || "[]");
    if (c.length === 0) { navigate(createPageUrl("Cart")); return; }
    setCart(c);
    api.auth.me().then(u => {
      setUser(u);
    }).catch(() => navigate(createPageUrl("Cart")));
  }, []);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = cart[0]?.delivery_fee ?? 2.99;
  const taxes = subtotal * 0.08;
  const total = subtotal + deliveryFee + taxes;

  const placeOrder = async () => {
    if (!form.address || !form.city) { alert("Please fill delivery address."); return; }
    setLoading(true);
    const order = await api.orders.create({
      user_email: user.email,
      user_name: user.full_name || user.email,
      restaurant_id: cart[0].restaurant_id,
      restaurant_name: cart[0].restaurant_name,
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      subtotal,
      delivery_fee: deliveryFee,
      discount: 0,
      total,
      status: "placed",
      delivery_address: `${form.address}, ${form.city} ${form.pincode}`,
      delivery_instructions: form.instructions,
      payment_method: form.payment,
      payment_status: form.payment === "cash" ? "pending" : "paid",
      estimated_time: 35,
    });
    localStorage.removeItem("foodhub_cart");
    window.dispatchEvent(new Event("cartUpdated"));
    navigate(`${createPageUrl("OrderTracking")}?id=${order.id}`);
  };

  const STEPS = ["Delivery", "Payment", "Review"];

  if (!user || cart.length === 0) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </button>

        <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                onClick={() => i + 1 < step && setStep(i + 1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i + 1 < step ? "bg-green-500 text-white cursor-pointer" :
                    i + 1 === step ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
                  }`}
              >
                {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm font-semibold hidden sm:block ${i + 1 === step ? "text-gray-900" : "text-gray-400"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 mx-1 ${i + 1 < step ? "bg-green-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <h2 className="font-black text-gray-900 text-lg">Delivery Address</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Street Address *</label>
                    <Input
                      placeholder="123 Main Street, Apt 4B"
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      className="rounded-xl border-gray-200 h-11"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">City *</label>
                      <Input
                        placeholder="New York"
                        value={form.city}
                        onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                        className="rounded-xl border-gray-200 h-11"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">ZIP Code</label>
                      <Input
                        placeholder="10001"
                        value={form.pincode}
                        onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                        className="rounded-xl border-gray-200 h-11"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Delivery Instructions</label>
                    <textarea
                      placeholder="Leave at door, ring bell, etc."
                      value={form.instructions}
                      onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-orange-400 resize-none h-20"
                    />
                  </div>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!form.address || !form.city}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 font-bold"
                  >
                    Continue to Payment <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                  <h2 className="font-black text-gray-900 text-lg">Payment Method</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { id: "cash", label: "Cash on Delivery", icon: Banknote, desc: "Pay when food arrives" },
                    { id: "card", label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, Amex" },
                    { id: "upi", label: "UPI / Digital Wallet", icon: Wallet, desc: "GPay, PhonePe, Paytm" },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setForm(f => ({ ...f, payment: m.id }))}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${form.payment === m.id ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className={`p-2.5 rounded-xl ${form.payment === m.id ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                        <m.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{m.label}</div>
                        <div className="text-xs text-gray-400">{m.desc}</div>
                      </div>
                      {form.payment === m.id && (
                        <div className="ml-auto w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => setStep(3)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 font-bold mt-6"
                >
                  Review Order <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <h2 className="font-black text-gray-900 text-lg">Review Your Order</h2>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name} × {item.quantity}</span>
                      <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-sm">
                  <p className="font-bold text-gray-700 mb-1">📍 Delivering to</p>
                  <p className="text-gray-600">{form.address}, {form.city} {form.pincode}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-sm">
                  <p className="font-bold text-gray-700 mb-1">💳 Payment</p>
                  <p className="text-gray-600 capitalize">{form.payment === "cash" ? "Cash on Delivery" : form.payment === "card" ? "Card" : "UPI"}</p>
                </div>
                <Button
                  onClick={placeOrder}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-14 rounded-2xl font-black text-base shadow-xl shadow-orange-200"
                >
                  {loading ? "Placing Order..." : `Place Order · $${total.toFixed(2)}`}
                </Button>
              </div>
            )}
          </div>

          {/* Order Summary sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
              <h3 className="font-black text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span className="font-semibold text-gray-900">${deliveryFee.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Taxes</span><span className="font-semibold text-gray-900">${taxes.toFixed(2)}</span></div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-gray-900 text-base">
                  <span>Total</span>
                  <span className="text-orange-500 text-lg">${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-400 text-center">
                Estimated delivery: ~35 minutes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}