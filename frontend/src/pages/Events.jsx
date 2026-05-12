import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { createPageUrl } from "@/utils";
import { Calendar, MapPin, Clock, Music, Utensils, Zap, Filter, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useLocation } from "@/lib/LocationContext";

const EVENT_TYPES = [
    { name: "All", icon: Zap },
    { name: "Food Festival", icon: Utensils },
    { name: "Happy Hour", icon: Clock },
    { name: "Live Music", icon: Music },
    { name: "Chef Special", icon: Utensils },
    { name: "Holiday Event", icon: Calendar },
];

export default function Events() {
    const { address, coords } = useLocation();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState("All");
    const [user, setUser] = useState(null);

    useEffect(() => {
        api.auth.me().then(setUser).catch(() => { });
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = {
                longitude: coords?.longitude,
                latitude: coords?.latitude,
                maxDistance: 100000, // Increase to 100km
            };
            if (activeType !== "All") params.type = activeType;

            let data = await api.events.list(params).catch(() => []);
            let results = Array.isArray(data) ? data : data?.data || [];
            
            // Fallback: If no results nearby, fetch all events
            if (results.length === 0 && (params.latitude || params.longitude)) {
                console.log("No nearby events, fetching all...");
                data = await api.events.list({ type: activeType !== "All" ? activeType : undefined }).catch(() => []);
                results = Array.isArray(data) ? data : data?.data || [];
            }
            
            setEvents(results);
        } catch (error) {
            console.error("Fetch events failed", error);
            setEvents([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, [coords, activeType]);

    const handleRSVP = async (eventId) => {
        if (!user) {
            api.auth.redirectToLogin();
            return;
        }
        try {
            await api.events.rsvp(eventId);
            fetchEvents();
        } catch (error) {
            console.error("RSVP failed", error);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="relative h-[300px] bg-gray-900 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-red-600/80 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1200"
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Events Hero"
                />
                <div className="relative z-20 text-center px-4">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Discover Local Events</h1>
                    <p className="text-white/90 text-lg font-medium max-w-xl mx-auto">
                        Experience the best food festivals, live music, and exclusive dining events in <span className="text-white font-black underline decoration-orange-400">{address?.split(',')[0] || "Your Area"}</span>
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                {/* Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {EVENT_TYPES.map(type => (
                            <button
                                key={type.name}
                                onClick={() => setActiveType(type.name)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeType === type.name
                                    ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                <type.icon className="w-4 h-4" />
                                {type.name}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm font-bold">
                        <Filter className="w-4 h-4" />
                        Showing {events.length} upcoming events
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                        <div className="text-6xl mb-4">📅</div>
                        <h3 className="text-xl font-bold text-gray-900">No events found in your area</h3>
                        <p className="text-gray-500 mb-6">We couldn't find any events within 100km of your location.</p>
                        <Button 
                            onClick={() => {
                                setActiveType("All");
                                api.events.list({ type: "All" }).then(data => setEvents(Array.isArray(data) ? data : data?.data || []));
                            }}
                            className="bg-orange-500 text-white rounded-xl h-11 px-8 font-bold"
                        >
                            Browse All Events
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map(event => (
                            <div key={event._id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                                <div className="relative h-64">
                                    <img src={event.image || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={event.title} />
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button
                                            onClick={() => {
                                                const url = window.location.origin + createPageUrl("Events") + "?id=" + event._id;
                                                if (navigator.share) {
                                                    navigator.share({ title: event.title, url });
                                                } else {
                                                    navigator.clipboard.writeText(url);
                                                    alert("Link copied to clipboard!");
                                                }
                                            }}
                                            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-orange-400 font-black text-xs uppercase tracking-widest mb-1">
                                            {event.date ? format(new Date(event.date), "EEEE, MMMM d") : "Date TBA"}
                                        </p>
                                        <h3 className="text-xl font-black text-white leading-tight">{event.title}</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-col gap-3 mb-6">
                                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{event.restaurant?.name || "Local Restaurant"}</span>
                                                <span className="text-xs truncate max-w-[200px]">{event.restaurant?.address}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <span className="font-medium">{event.startTime || "7:00 PM"} onwards</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                                        {event.description}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col flex-1">
                                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Capacity</span>
                                            <span className="text-sm font-black text-gray-900">{event.rsvp_count || 0}/{event.capacity || 100} RSVPs</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link to={`${createPageUrl("RestaurantDetail")}?id=${event.restaurant?._id || event.restaurant}`}>
                                                <Button variant="outline" className="rounded-2xl h-11 px-4 border-gray-200">
                                                    <Utensils className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                onClick={() => handleRSVP(event._id)}
                                                className={`rounded-2xl h-11 px-6 font-bold transition-all shadow-xl ${event.attendees?.includes(user?._id)
                                                    ? "bg-green-500 hover:bg-red-500 text-white shadow-green-100"
                                                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-100"
                                                    }`}
                                            >
                                                {event.attendees?.includes(user?._id) ? "Joined ✓" : "RSVP Now"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[3rem] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f97316 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <h2 className="text-3xl md:text-4xl font-black mb-4 relative z-10">Are you a Restaurant Owner?</h2>
                    <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto relative z-10">
                        Host your own events and reach more foodies in your area. Happy hours, live music, or holiday specials—list them all here.
                    </p>
                    <Link to={createPageUrl("RestaurantDashboard")} className="relative z-10 inline-block">
                        <Button className="bg-white text-gray-900 hover:bg-orange-500 hover:text-white rounded-2xl h-14 px-10 font-black text-lg transition-all shadow-xl">
                            {user?.role === 'restaurant' ? "Manage Your Events" : "List Your Event"}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
