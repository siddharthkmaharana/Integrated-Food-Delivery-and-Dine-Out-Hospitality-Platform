import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X, Star, ChevronDown } from "lucide-react";
import RestaurantCard from "../components/home/RestaurantCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "../api/client";

const CUISINES = ["All", "Italian", "Indian", "Chinese", "Japanese", "Mexican", "American", "Thai", "Mediterranean"];
const RATINGS = [{ label: "4.5+", value: 4.5 }, { label: "4.0+", value: 4.0 }, { label: "3.5+", value: 3.5 }];
const PRICE_RANGES = ["₹", "₹₹", "₹₹₹", "₹₹₹₹"];
const SORT_OPTIONS = [
    { label: "Relevance", value: "relevance" },
    { label: "Rating", value: "rating" },
    { label: "Delivery Time", value: "delivery_time" },
    { label: "Delivery Fee", value: "delivery_fee" },
];

export default function Restaurants() {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        cuisine: "All",
        minRating: 0,
        priceRanges: [],
        sortBy: "relevance",
    });

    useEffect(() => {
        api.restaurants.list("-rating", 50)
            .then(data => {
                if (Array.isArray(data)) {
                    setRestaurants(data.filter(r => r.is_approved !== false));
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching restaurants:", err);
                setRestaurants([]);
                setLoading(false);
            });
    }, []);

    const getFiltered = () => {
        let result = [...restaurants];
        if (searchQuery) {
            result = result.filter(r => {
                const cuisineMatch = Array.isArray(r.cuisine) 
                  ? r.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
                  : typeof r.cuisine === 'string' && r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
                return r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       cuisineMatch ||
                       r.city?.toLowerCase().includes(searchQuery.toLowerCase());
            });
        }
        if (filters.cuisine !== "All") {
            result = result.filter(r => {
                return Array.isArray(r.cuisine)
                  ? r.cuisine.some(c => c.toLowerCase().includes(filters.cuisine.toLowerCase()))
                  : typeof r.cuisine === 'string' && r.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase());
            });
        }
        if (filters.minRating > 0) {
            result = result.filter(r => (r.rating || 0) >= filters.minRating);
        }
        if (filters.priceRanges.length > 0) {
            result = result.filter(r => filters.priceRanges.includes(r.price_range));
        }
        if (filters.sortBy === "rating") result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        else if (filters.sortBy === "delivery_time") result.sort((a, b) => (a.delivery_time || 30) - (b.delivery_time || 30));
        else if (filters.sortBy === "delivery_fee") result.sort((a, b) => (a.delivery_fee || 0) - (b.delivery_fee || 0));
        return result;
    };

    const filtered = getFiltered();
    const activeFilterCount = (filters.cuisine !== "All" ? 1 : 0) + (filters.minRating > 0 ? 1 : 0) + filters.priceRanges.length;

    const togglePrice = (p) => {
        setFilters(f => ({
            ...f,
            priceRanges: f.priceRanges.includes(p) ? f.priceRanges.filter(x => x !== p) : [...f.priceRanges, p]
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 pt-10 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <h1 className="text-3xl font-black text-white mb-6">Find Your Favorite Food</h1>
                    <div className="flex gap-3 bg-white rounded-2xl p-2 shadow-xl max-w-2xl">
                        <div className="flex items-center gap-2 px-3 flex-1">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search restaurants, cuisines..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full text-gray-900 placeholder-gray-400 outline-none text-sm font-medium bg-transparent"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")}><X className="w-4 h-4 text-gray-400" /></button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8">
                {/* Filter Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex flex-wrap gap-3 items-center">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border transition-all ${activeFilterCount > 0 ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-600 hover:border-orange-300"
                            }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Cuisine quick pills */}
                    <div className="flex gap-2 flex-wrap">
                        {CUISINES.slice(0, 6).map(c => (
                            <button
                                key={c}
                                onClick={() => setFilters(f => ({ ...f, cuisine: c }))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filters.cuisine === c ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600"
                                    }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium hidden sm:block">Sort by:</span>
                        <select
                            value={filters.sortBy}
                            onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                            className="text-sm font-semibold text-gray-700 bg-gray-100 border-none rounded-xl px-3 py-2 outline-none cursor-pointer"
                        >
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-orange-100">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Min Rating</h4>
                                <div className="flex gap-2">
                                    {RATINGS.map(r => (
                                        <button
                                            key={r.value}
                                            onClick={() => setFilters(f => ({ ...f, minRating: f.minRating === r.value ? 0 : r.value }))}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${filters.minRating === r.value ? "bg-yellow-400 border-yellow-400 text-white" : "border-gray-200 text-gray-600"
                                                }`}
                                        >
                                            ⭐ {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Price Range</h4>
                                <div className="flex gap-2">
                                    {PRICE_RANGES.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => togglePrice(p)}
                                            className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${filters.priceRanges.includes(p) ? "bg-green-500 border-green-500 text-white" : "border-gray-200 text-gray-600"
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => setFilters({ cuisine: "All", minRating: 0, priceRanges: [], sortBy: "relevance" })}
                                    className="text-sm text-orange-500 font-semibold hover:text-orange-600 underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-gray-500 text-sm font-medium">
                        Showing <span className="text-gray-900 font-bold">{filtered.length}</span> restaurants
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                                <div className="h-44 bg-gray-200" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold text-gray-700">No results found</h3>
                        <p className="text-gray-400 mt-2">Try different search terms or remove filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-16">
                        {filtered.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
                    </div>
                )}
            </div>
        </div>
    );
}