import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Star, Clock, Bike, MapPin, Phone, Heart, Share2, Plus, Minus, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReviewCard from "../components/restaurant/ReviewCard";
import MenuSection from "../components/restaurant/MenuSection";
import { api } from "@/api/client";

export default function RestaurantDetail() {
    const navigate = useNavigate();
    const urlParams = new URLSearchParams(window.location.search);
    const restaurantId = urlParams.get("id");

    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("menu");
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (!restaurantId) return;
        const savedCart = JSON.parse(localStorage.getItem("foodhub_cart") || "[]");
        setCart(savedCart);
        api.auth.me().then(setUser).catch(() => { });
        Promise.all([
            api.restaurants.filter({ id: restaurantId }).catch(() => []),
            api.menuItems.filter({ restaurant_id: restaurantId }).catch(() => []),
            api.reviews.filter({ restaurant_id: restaurantId }).catch(() => []),
        ]).then(([rests, items, revs]) => {
            setRestaurant(rests[0] || null);
            setMenuItems(items);
            setReviews(revs);
            setLoading(false);
        });
    }, [restaurantId]);

    const getItemQty = (itemId) => {
        const found = cart.find(c => (c._id || c.id) === itemId);
        return found ? found.quantity : 0;
    };

    const updateCart = (item, delta) => {
        let updatedCart = [...cart];
        const itemId = item._id || item.id;
        
        // Prevent cross-restaurant ordering
        if (delta > 0 && updatedCart.length > 0 && updatedCart[0].restaurant_id !== restaurantId) {
            const confirmClear = window.confirm("Your cart contains items from another restaurant. Would you like to clear it and add this item instead?");
            if (confirmClear) {
                updatedCart = [];
            } else {
                return;
            }
        }

        const idx = updatedCart.findIndex(c => (c._id || c.id) === itemId);
        if (idx >= 0) {
            updatedCart[idx].quantity += delta;
            if (updatedCart[idx].quantity <= 0) updatedCart.splice(idx, 1);
        } else if (delta > 0) {
            updatedCart.push({ ...item, id: itemId, quantity: 1, restaurant_id: restaurantId, restaurant_name: restaurant?.name });
        }
        setCart(updatedCart);
        localStorage.setItem("foodhub_cart", JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("cartUpdated"));
    };

    const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

    const submitReview = async () => {
        if (!user) { api.auth.redirectToLogin(); return; }
        await api.reviews.create({
            restaurant_id: restaurantId,
            user_email: user.email,
            user_name: user.full_name || user.email,
            rating: newReview.rating,
            comment: newReview.comment,
        });
        const revs = await api.reviews.filter({ restaurant_id: restaurantId });
        setReviews(revs);
        setNewReview({ rating: 5, comment: "" });
    };

    const grouped = menuItems.reduce((acc, item) => {
        const cat = item.category || "Uncategorized";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
    );
    if (!restaurant) return (
        <div className="min-h-screen flex items-center justify-center text-gray-500">Restaurant not found.</div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-28">
            {/* Hero */}
            <div className="relative h-64 md:h-80 bg-gradient-to-br from-orange-100 to-red-100 overflow-hidden">
                {restaurant.image ? (
                    <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl">🍽️</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-white">{restaurant.name}</h1>
                            <p className="text-white/80 mt-1">{restaurant.cuisine}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsWishlisted(!isWishlisted)}
                                className={`p-2.5 rounded-full backdrop-blur-sm transition-all ${isWishlisted ? "bg-red-500 text-white" : "bg-white/20 text-white"}`}
                            >
                                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-white" : ""}`} />
                            </button>
                            <button className="p-2.5 rounded-full bg-white/20 backdrop-blur-sm text-white">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Bar */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold">{restaurant.rating?.toFixed(1)}</span>
                            <span className="text-gray-400">({reviews.length} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <Clock className="w-4 h-4 text-orange-400" />
                            <span>{restaurant.delivery_time || 30} min delivery</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <Bike className="w-4 h-4 text-orange-400" />
                            <span>{restaurant.delivery_fee === 0 ? "Free delivery" : `$${restaurant.delivery_fee} delivery`}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <MapPin className="w-4 h-4 text-orange-400" />
                            <span>{restaurant.address || restaurant.city}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <span className={`w-2 h-2 rounded-full ${restaurant.is_open ? "bg-green-500" : "bg-gray-400"}`} />
                            <span className="font-medium">{restaurant.is_open ? "Open" : "Closed"} · {restaurant.opening_hours}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white sticky top-16 z-30 border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="flex gap-1">
                        {["menu", "reviews", "info"].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-3.5 text-sm font-bold capitalize transition-colors border-b-2 ${activeTab === tab ? "border-orange-500 text-orange-500" : "border-transparent text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                {tab} {tab === "reviews" && `(${reviews.length})`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                {activeTab === "menu" && (
                    <div className="space-y-8">
                        {Object.entries(grouped).map(([category, items]) => (
                            <MenuSection key={category} category={category} items={items} getItemQty={getItemQty} updateCart={updateCart} />
                        ))}
                        {menuItems.length === 0 && (
                            <div className="text-center py-20 text-gray-400">
                                <div className="text-5xl mb-3">📋</div>
                                <p className="font-semibold">Menu not available yet</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "reviews" && (
                    <div className="space-y-6">
                        {/* Add Review */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">Write a Review</h3>
                            <div className="flex gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button key={s} onClick={() => setNewReview(r => ({ ...r, rating: s }))}
                                        className={`text-2xl transition-transform hover:scale-110 ${s <= newReview.rating ? "opacity-100" : "opacity-30"}`}>⭐</button>
                                ))}
                            </div>
                            <textarea
                                placeholder="Share your experience..."
                                value={newReview.comment}
                                onChange={e => setNewReview(r => ({ ...r, comment: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 outline-none focus:border-orange-400"
                            />
                            <Button onClick={submitReview} className="mt-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                                Submit Review
                            </Button>
                        </div>

                        {reviews.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <div className="text-5xl mb-3">💬</div>
                                <p className="font-semibold">No reviews yet. Be the first!</p>
                            </div>
                        ) : (
                            reviews.map(review => <ReviewCard key={review.id} review={review} />)
                        )}
                    </div>
                )}

                {activeTab === "info" && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-900 text-lg">About {restaurant.name}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{restaurant.description || "No description available."}</p>
                        <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4 text-orange-400" />{restaurant.opening_hours || "9am - 10pm"}</div>
                            <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-orange-400" />{restaurant.phone || "Not listed"}</div>
                            <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4 text-orange-400" />{restaurant.address || restaurant.city}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Cart */}
            {cartCount > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
                    <button
                        onClick={() => navigate(createPageUrl("Cart"))}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-2xl shadow-2xl shadow-orange-300 flex items-center justify-between hover:from-orange-600 hover:to-red-600 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <span className="bg-white/25 rounded-lg px-2 py-0.5 font-black text-sm">{cartCount}</span>
                            <span className="font-bold">View Cart</span>
                        </div>
                        <div className="flex items-center gap-1 font-black">
                            ${cartTotal.toFixed(2)} <ChevronRight className="w-5 h-5" />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}