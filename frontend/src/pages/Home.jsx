import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Star, Clock, ChevronRight, Flame, Tag, Utensils, Coffee, Pizza, Salad } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import RestaurantCard from "../components/home/RestaurantCard";
import CategoryPill from "../components/home/CategoryPill";
import HeroSection from "../components/home/HeroSection";

const CATEGORIES = [
  { name: "All", icon: "🍽️" },
  { name: "Pizza", icon: "🍕" },
  { name: "Burgers", icon: "🍔" },
  { name: "Sushi", icon: "🍱" },
  { name: "Indian", icon: "🍛" },
  { name: "Chinese", icon: "🥡" },
  { name: "Italian", icon: "🍝" },
  { name: "Desserts", icon: "🍰" },
  { name: "Healthy", icon: "🥗" },
  { name: "Mexican", icon: "🌮" },
];

import { api } from "@/api/client";
import { useLocation } from "@/lib/LocationContext";

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { coords } = useLocation();

  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [basedOn, setBasedOn] = useState([]);

  useEffect(() => {
    setLoading(true);
    api.restaurants.list(coords)
      .then(data => {
        const resList = data.data || data || [];
        setRestaurants(resList);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load restaurants", err);
        setLoading(false);
      });

    // Fetch recommendations
    setRecLoading(true);
    api.restaurants.recommendations(coords)
      .then(data => {
        setRecommendations(data.data || []);
        setBasedOn(data.basedOn || []);
        setRecLoading(false);
      })
      .catch(() => setRecLoading(false));
  }, [coords]);

  const filtered = restaurants.filter(r => {
    const cuisineMatch = Array.isArray(r.cuisine) 
      ? r.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
      : typeof r.cuisine === 'string' && r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchSearch = r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || cuisineMatch;
    
    const catMatch = Array.isArray(r.cuisine)
      ? r.cuisine.some(c => c.toLowerCase().includes(selectedCategory.toLowerCase()))
      : typeof r.cuisine === 'string' && r.cuisine.toLowerCase().includes(selectedCategory.toLowerCase());
      
    const matchCat = selectedCategory === "All" || catMatch;
    
    return matchSearch && matchCat;
  });

  const topRated = [...restaurants].filter(r => r.rating >= 4.5).slice(0, 6);
  const fastDelivery = [...restaurants].sort((a, b) => (a.delivery_time || 30) - (b.delivery_time || 30)).slice(0, 6);

  return (
    <div className="bg-gray-50">
      <HeroSection searchQuery={searchQuery} setSearchQuery={setSearchQuery} restaurants={restaurants} />

      {/* Category Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {CATEGORIES.map(cat => (
            <CategoryPill
              key={cat.name}
              category={cat}
              isActive={selectedCategory === cat.name}
              onClick={() => setSelectedCategory(cat.name)}
            />
          ))}
        </div>
      </div>



      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-100">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recommended for You</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Based on your love for</span>
                  <div className="flex gap-1">
                    {basedOn.map(b => (
                      <Badge key={b} variant="secondary" className="text-[9px] h-4 px-1.5 bg-gray-100 text-gray-600 border-none font-black uppercase">{b}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Badge className="bg-orange-50 text-orange-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">AI Powered</Badge>
          </div>
          
          <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {recommendations.map(r => (
              <div key={r._id} className="min-w-[280px] sm:min-w-[320px]">
                <RestaurantCard restaurant={r} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Filtered List */}
      <div id="restaurant-list" className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              {selectedCategory === "All" ? "All Restaurants" : `${selectedCategory} Near You`}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">{filtered.length} restaurants available</p>
          </div>
          <Link to={createPageUrl("Restaurants")} className="flex items-center gap-1 text-orange-500 font-bold text-sm hover:text-orange-600 transition-colors">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
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
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-bold text-gray-700">No restaurants found</h3>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.slice(0, 12).map(r => <RestaurantCard key={r._id || r.id} restaurant={r} />)}
          </div>
        )}
      </div>

      {/* Top Rated Section */}
      {topRated.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">⭐</span>
            <h2 className="text-2xl font-black text-gray-900">Top Rated</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topRated.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
          </div>
        </div>
      )}

      {/* Fast Delivery */}
      {fastDelivery.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">⚡</span>
            <h2 className="text-2xl font-black text-gray-900">Fastest Delivery</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {fastDelivery.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}