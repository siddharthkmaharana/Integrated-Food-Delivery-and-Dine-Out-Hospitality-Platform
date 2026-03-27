import { useState, useEffect } from "react";
import { Calendar, Clock, Users, MapPin, Star, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, addDays } from "date-fns";
import { api } from "@/api/client";

const TIME_SLOTS = ["12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM"];

export default function TableBooking() {
    const [restaurants, setRestaurants] = useState([]);
    const [selected, setSelected] = useState(null);
    const [user, setUser] = useState(null);
    const [step, setStep] = useState(1);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [form, setForm] = useState({
        date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        time: "",
        guests: 2,
        requests: "",
    });

    useEffect(() => {
        api.restaurants.list("-rating", 20)
            .then(data => {
                if(Array.isArray(data)) setRestaurants(data.filter(r => r.is_approved !== false));
            })
            .catch(console.error);
        api.auth.me().then(setUser).catch(() => { });
    }, []);

    useEffect(() => {
        if (user) {
            api.reservations.filter({ user_email: user.email }).then(setBookings).catch(() => { });
        }
    }, [user]);

    const book = async () => {
        if (!user) { api.auth.redirectToLogin(); return; }
        if (!form.time) { alert("Please select a time slot."); return; }
        setLoading(true);
        const res = await api.reservations.create({
            user_email: user.email,
            user_name: user.full_name || user.email,
            restaurant_id: selected.id,
            restaurant_name: selected.name,
            date: form.date,
            time: form.time,
            guests: form.guests,
            special_requests: form.requests,
            status: "confirmed",
        });
        setSuccess(res);
        setLoading(false);
        const newBookings = await api.reservations.filter({ user_email: user.email });
        setBookings(newBookings);
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {restaurants.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => { setSelected(r); setStep(1); }}
                                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left"
                                >
                                    <div className="h-40 bg-gradient-to-br from-purple-100 to-indigo-100 overflow-hidden">
                                        {r.image ? (
                                            <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900">{r.name}</h3>
                                        <p className="text-gray-500 text-sm">{r.cuisine}</p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                {r.rating?.toFixed(1)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3" /> {r.total_seats || 40} seats
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {r.city}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
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
                                <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-bold text-gray-900">{b.restaurant_name}</h4>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${b.status === "confirmed" ? "bg-green-100 text-green-600" :
                                                b.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
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