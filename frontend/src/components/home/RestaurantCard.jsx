import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Star, Clock, Bike } from "lucide-react";

export default function RestaurantCard({ restaurant }) {
  const priceRangeMap = { 
    "₹": "Under ₹150", 
    "₹₹": "₹150-300", 
    "₹₹₹": "₹300-600", 
    "₹₹₹₹": "Over ₹600" 
  };

  const cuisineDisplay = Array.isArray(restaurant.cuisine)
    ? restaurant.cuisine.join(", ")
    : restaurant.cuisine || "";

  return (
    <Link to={`${createPageUrl("RestaurantDetail")}?id=${restaurant._id || restaurant.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100 hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-orange-100 to-red-100">
          {restaurant.image ? (
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🍽️
            </div>
          )}

          {restaurant.isOpen === false && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-white text-gray-800 font-bold px-3 py-1 rounded-full text-sm">Closed</span>
            </div>
          )}

          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-bold text-gray-800">
              {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "New"}
            </span>
          </div>

          {restaurant.delivery_fee === 0 && (
            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              FREE Delivery
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-base truncate group-hover:text-orange-500 transition-colors">
            {restaurant.name}
          </h3>

          <p className="text-sm text-gray-500 truncate mt-0.5">{cuisineDisplay}</p>

          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{restaurant.delivery_time || 30} min</span>
            </div>
            <span className="text-gray-200">·</span>
            <div className="flex items-center gap-1">
              <Bike className="w-3.5 h-3.5 text-gray-400" />
              <span>Free</span>
            </div>
            <span className="text-gray-200">·</span>
            {/* Changed $ to ₹ */}
           <span>{restaurant.price_range?.replace(/\$/g, "₹") || "₹₹"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}