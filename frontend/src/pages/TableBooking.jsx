import { useState, useEffect } from "react";
import { Calendar, Clock, Users, MapPin, Star, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, addDays } from "date-fns";
import { api } from "@/api/client";
import { useLocation } from "@/lib/LocationContext";

const TIME_SLOTS = [
    "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
    "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
    "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM"
];

// ── Time-based Open/Closed logic ─────────────────────────────────────────────
const OPEN_HOUR = 8;   // 8:00 AM
const CLOSE_HOUR = 23;  // 11:00 PM

function isRestaurantOpen() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
    return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}

const priceRangeMap = {
    "₹": "Under ₹150",
    "₹₹": "₹150–300",
    "₹₹₹": "₹300–600",
    "₹₹₹₹": "Over ₹600",
    "$": "Under ₹150",
    "$$": "₹150–300",
    "$$$": "₹300–600",
    "$$$$": "Over ₹600",
};

export default function TableBooking() {
    const [restaurants, setRestaurants] = useState([]);
    const [selected, setSelected] = useState(null);
    const [user, setUser] = useState(null);
    const [step, setStep] = useState(1);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const { coords } = useLocation();
    const [form, setForm] = useState({
        date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        time: "",
        guests: 2,
        requests: "",
    });

    useEffect(() => {
        setLoading(true);
        // Match Home page logic: fetch based on current coordinates only
        api.restaurants.list(coords)
            .then(data => {
                const list = data.data || data || [];
                setRestaurants(list.filter(r => r.is_approved !== false));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
        api.auth.me().then(setUser).catch(() => { });
    }, [coords]);

    useEffect(() => {
        if (user && user._id) {
            api.reservations.filter({ user: user._id }).then(setBookings).catch(() => { });
        }
    }, [user]);

    const book = async () => {
        if (!user) { api.auth.redirectToLogin(); return; }
        if (!form.time) { alert("Please select a time slot."); return; }
        setLoading(true);
        try {
            const res = await api.reservations.create({
                restaurant: selected._id || selected.id,
                date: form.date,
                time: form.time,
                guests: form.guests,
                specialRequests: form.requests,
                status: "PENDING",
                // Extra fields allowed by schema (if any) or ignored:
                user_email: user.email,
                user_name: user.full_name || user.email,
                restaurant_name: selected.name,
            });
            setSuccess({ ...res, restaurant_name: selected.name });
            const newBookings = await api.reservations.filter({ user: user._id });
            setBookings(newBookings);
        } catch (error) {
            console.error("Booking error:", error);
            alert("Booking failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const today = format(new Date(), "yyyy-MM-dd");
    const maxDate = format(addDays(new Date(), 30), "yyyy-MM-dd");

    if (success) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Check className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Booking Confirmed! 🎉</h2>
                <p className="text-gray-500 mb-6">Your table at <span className="font-bold text-orange-500">{success.restaurant_name}</span> is reserved.</p>
                <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3 mb-6">
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Date</span><span className="font-bold">{format(new Date(success.date), "MMM d, yyyy")}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Time</span><span className="font-bold">{success.time}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Guests</span><span className="font-bold">{success.guests} people</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Booking ID</span><span className="font-mono font-bold text-orange-500">#{success.id?.slice(-8).toUpperCase()}</span></div>
                </div>
                <Button onClick={() => { setSuccess(null); setSelected(null); setStep(1); }} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-12 font-bold">
                    Book Another Table
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-16 px-4 text-center text-white">
                <h1 className="text-4xl font-black mb-3">Book a Table</h1>
                <p className="text-purple-100 text-lg">Reserve your spot at the best restaurants in the city</p>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
                {!selected ? (
                    <>
                        <h2 className="text-2xl font-black text-gray-900 mb-6">Choose a Restaurant</h2>
                        {loading ? (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center">
                                <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mb-4" />
                                <p className="text-gray-500 font-bold">Finding best tables for you...</p>
                            </div>
                        ) : restaurants.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                                <div className="text-6xl mb-4">🍽️</div>
                                <h3 className="text-xl font-bold text-gray-900">No restaurants available</h3>
                                <p className="text-gray-500">We couldn't find any restaurants open for booking right now.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {restaurants.map(r => {
                                    const open = isRestaurantOpen();
                                    const cuisineDisplay = Array.isArray(r.cuisine) ? r.cuisine.join(", ") : r.cuisine || "";
                                    const rawPrice = r.price_range || "₹₹";
                                    const priceLabel = priceRangeMap[rawPrice] || priceRangeMap[rawPrice.replace(/\$/g, "₹")] || "₹150–300";

                                    return (
                                        <button
                                            key={r._id || r.id}
                                            onClick={() => { setSelected(r); setStep(1); }}
                                            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all text-left group flex flex-col"
                                        >
                                            <div className="h-48 bg-gradient-to-br from-orange-50 to-red-50 overflow-hidden relative">
                                                {r.image ? (
                                                    <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                                                )}
                                                
                                                {/* Open/Closed Badge */}
                                                {!open && (
                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                                        <span className="bg-white text-gray-900 font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest shadow-xl">
                                                            Closed · Opens 8 AM
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {open && (
                                                    <div className="absolute bottom-3 left-3 bg-orange-500/90 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg border border-white/20">
                                                        <span className="w-1.5 h-1.5 bg-white rounded-full inline-block animate-pulse" />
                                                        OPEN UNTIL 11 PM
                                                    </div>
                                                )}

                                                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] font-black text-gray-900 shadow-xl">
                                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                    {r.rating > 0 ? r.rating.toFixed(1) : "NEW"}
                                                </div>
                                            </div>
                                            <div className="p-5 flex-1 flex flex-col">
                                                <h3 className="font-black text-gray-900 text-lg group-hover:text-orange-500 transition-colors truncate mb-0.5">{r.name}</h3>
                                                <p className="text-gray-500 text-xs font-bold truncate uppercase tracking-tight mb-4">{cuisineDisplay}</p>
                                                
                                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] font-black text-gray-700 uppercase tracking-widest">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5 text-orange-600" />
                                                        {r.total_seats || 40} SEATS
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-orange-600" />
                                                        {r.city || "PUNE"}
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-3 flex items-center gap-3 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                                    <span>{priceLabel}</span>
                                                    <span>•</span>
                                                    <span>{r.delivery_time || 30} MINS</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="max-w-xl mx-auto">
                        <button onClick={() => setSelected(null)} className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1 font-medium transition-colors">
                            ← All Restaurants
                        </button>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                            <div className="h-40 bg-gradient-to-br from-purple-100 to-indigo-100 overflow-hidden">
                                {selected.image ? <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" /> :
                                    <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>}
                            </div>
                            <div className="p-4">
                                <h2 className="font-black text-gray-900 text-xl">{selected.name}</h2>
                                <p className="text-gray-500 text-sm">{selected.cuisine} · {selected.city}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="date"
                                        min={today}
                                        max={maxDate}
                                        value={form.date}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-purple-400 font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Number of Guests</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setForm(f => ({ ...f, guests: Math.max(1, f.guests - 1) }))}
                                        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg"
                                    >−</button>
                                    <span className="text-2xl font-black text-gray-900 w-10 text-center">{form.guests}</span>
                                    <button
                                        onClick={() => setForm(f => ({ ...f, guests: Math.min(12, f.guests + 1) }))}
                                        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg"
                                    >+</button>
                                    <span className="text-sm text-gray-400 ml-2">guests</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Select Time</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {TIME_SLOTS.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setForm(f => ({ ...f, time: t }))}
                                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${form.time === t ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-600 hover:border-purple-300"
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Special Requests</label>
                                <textarea
                                    placeholder="Birthday celebration, window seat, allergies..."
                                    value={form.requests}
                                    onChange={e => setForm(f => ({ ...f, requests: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-purple-400 resize-none h-20"
                                />
                            </div>

                            <Button
                                onClick={book}
                                disabled={loading || !form.time}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-13 rounded-2xl font-bold text-base shadow-lg shadow-purple-200"
                                style={{ height: "52px" }}
                            >
                                {loading ? "Booking..." : "Confirm Reservation"} <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* User's Past Bookings */}
                {bookings.length > 0 && !selected && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-black text-gray-900 mb-5">Your Reservations</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {bookings.map(b => (
                                <div key={b.id || b._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-bold text-gray-900">{b.restaurant?.name || b.restaurant_name || "Unknown Restaurant"}</h4>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${b.status === "CONFIRMED" ? "bg-green-100 text-green-600" :
                                                b.status === "CANCELLED" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
                                            }`}>
                                            {b.status}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 text-sm text-gray-500">
                                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-400" />{format(new Date(b.date), "MMM d, yyyy")}</div>
                                        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-purple-400" />{b.time}</div>
                                        <div className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-400" />{b.guests} guests</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}