import { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLocation } from "@/lib/LocationContext";
import {
    ShoppingCart, User, Menu, X, MapPin, Heart,
    ChevronDown, LogOut, Settings, Package, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
    const [user, setUser] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { address, coords, detectLocation, updateLocation, isDetecting } = useLocation();
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [manualLocation, setManualLocation] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (manualLocation.trim().length > 2 && isLocationModalOpen) {
                fetchSuggestions(manualLocation);
            } else {
                setSuggestions([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [manualLocation, isLocationModalOpen]);

    const fetchSuggestions = async (query) => {
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`);
            const data = await res.json();
            setSuggestions(data);
        } catch (err) {
            console.error("Failed to fetch suggestions", err);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        api.auth.me().then(setUser).catch(() => { });
        updateCartCount();
        window.addEventListener("storage", updateCartCount);
        window.addEventListener("cartUpdated", updateCartCount);
        return () => {
            window.removeEventListener("storage", updateCartCount);
            window.removeEventListener("cartUpdated", updateCartCount);
        };
    }, []);

    const handleManualLocationSubmit = (e) => {
        e.preventDefault();
        if (!manualLocation.trim()) return;
        
        // If we have suggestions, use the first one if not selected
        if (suggestions.length > 0) {
            const top = suggestions[0];
            updateLocation({ latitude: parseFloat(top.lat), longitude: parseFloat(top.lon) }, top.display_name);
        } else {
            updateLocation({ ...coords }, manualLocation);
        }
        setIsLocationModalOpen(false);
        setManualLocation("");
    };

    const handleSelectSuggestion = (s) => {
        updateLocation({ latitude: parseFloat(s.lat), longitude: parseFloat(s.lon) }, s.display_name);
        setIsLocationModalOpen(false);
        setManualLocation("");
        setSuggestions([]);
    };

    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem("foodhub_cart") || "[]");
        setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    };

    const navLinks = [
        { name: "Home", page: "Home" },
        { name: "Restaurants", page: "Restaurants" },
        { name: "Dine-Out", page: "TableBooking" },
        { name: "Events", page: "Events" },
    ];

    // Fix: backend returns 'name' not 'full_name'
    const userName = user?.name || user?.full_name || "Account";
    const userInitial = userName[0]?.toUpperCase() || "U";

    return (
        <div className="min-h-screen bg-gray-50">
            <style>{`
                * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to={createPageUrl("Home")} className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
                                <span className="text-white font-black text-sm">F</span>
                            </div>
                            <span className="text-xl font-black text-gray-900 tracking-tight">
                                Food<span className="text-orange-500">Hub</span>
                            </span>
                        </Link>

                        {/* Location pill — only for customers */}
                        {(user?.role === "customer" || !user) && (
                            <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
                                <DialogTrigger asChild>
                                    <div
                                        className="hidden md:flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 cursor-pointer hover:border-orange-300 transition-colors"
                                        title="Click to change location"
                                    >
                                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                                        <span className="text-sm font-medium text-gray-700 max-w-[180px] truncate">
                                            {address}
                                        </span>
                                        <ChevronDown className="w-3 h-3 text-gray-400" />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-black">Change Location</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-2">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Location</div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-orange-500" />
                                                <span className="text-sm font-bold text-gray-700 truncate">{address}</span>
                                            </div>
                                        </div>

                                        <Button 
                                            variant="outline" 
                                            onClick={() => { detectLocation(); setIsLocationModalOpen(false); }}
                                            className="w-full justify-start gap-2 h-12 rounded-2xl border-orange-100 hover:bg-orange-50 hover:text-orange-600 transition-all font-bold"
                                            disabled={isDetecting}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                                <MapPin className="w-4 h-4 text-orange-500" />
                                            </div>
                                            {isDetecting ? "Detecting..." : "Detect my current location"}
                                        </Button>
                                        
                                        <div className="relative flex items-center py-2">
                                            <div className="flex-grow border-t border-gray-100"></div>
                                            <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">or enter manually</span>
                                            <div className="flex-grow border-t border-gray-100"></div>
                                        </div>

                                        <form onSubmit={handleManualLocationSubmit} className="space-y-3 relative">
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input 
                                                    placeholder="Search city, area or street..." 
                                                    className="pl-11 h-14 rounded-2xl bg-gray-50 border-gray-200 focus:ring-orange-500 font-medium"
                                                    value={manualLocation}
                                                    onChange={(e) => setManualLocation(e.target.value)}
                                                />
                                                {isSearching && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </div>

                                            {suggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-100 rounded-2xl mt-2 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {suggestions.map((s, i) => (
                                                        <button 
                                                            key={i}
                                                            type="button"
                                                            onClick={() => handleSelectSuggestion(s)}
                                                            className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex items-start gap-3 group border-b border-gray-50 last:border-none"
                                                        >
                                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 group-hover:text-orange-500" />
                                                            <div className="flex-1">
                                                                <div className="text-sm font-bold text-gray-700 group-hover:text-orange-600 line-clamp-1">{s.display_name.split(',')[0]}</div>
                                                                <div className="text-[10px] text-gray-400 line-clamp-1">{s.display_name.split(',').slice(1).join(',')}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="pt-2">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Popular Cities</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        { name: "Pune", lat: 18.5204, lon: 73.8567 },
                                                        { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
                                                        { name: "Delhi", lat: 28.6139, lon: 77.2090 },
                                                        { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
                                                        { name: "Hyderabad", lat: 17.3850, lon: 78.4867 }
                                                    ].map(city => (
                                                        <button
                                                            key={city.name}
                                                            type="button"
                                                            onClick={() => handleSelectSuggestion({ lat: city.lat, lon: city.lon, display_name: city.name })}
                                                            className="px-4 py-2 rounded-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all"
                                                        >
                                                            {city.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <Button type="submit" className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 font-black shadow-lg shadow-orange-100 uppercase tracking-wider text-xs">
                                                Apply Location
                                            </Button>
                                        </form>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}

                        {/* Nav Links — only for customers */}
                        <div className="hidden md:flex items-center gap-1">
                            {(user?.role === "customer" || !user) && navLinks.map(link => (
                                <Link
                                    key={link.page}
                                    to={createPageUrl(link.page)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                        currentPageName === link.page
                                            ? "bg-orange-50 text-orange-600"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-2">
                            {(user?.role === "customer" || !user) && (
                                <Link
                                    to={createPageUrl("Cart")}
                                    className="relative p-2.5 rounded-xl hover:bg-orange-50 transition-colors"
                                >
                                    <ShoppingCart className="w-5 h-5 text-gray-700" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center bg-orange-500 text-white text-xs font-bold rounded-full">
                                            {cartCount > 9 ? "9+" : cartCount}
                                        </span>
                                    )}
                                </Link>
                            )}

                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 transition-colors border border-gray-200">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                                                <span className="text-white font-bold text-xs">
                                                    {userInitial}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[80px] truncate">
                                                {userName.split(" ")[0]}
                                            </span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-xl border-gray-100 p-1">
                                        <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                                            <p className="font-bold text-sm text-gray-900">{userName}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                            <p className="text-xs text-orange-500 font-medium mt-0.5 capitalize">{user.role}</p>
                                        </div>
                                        <DropdownMenuItem asChild className="rounded-xl">
                                            <Link to={`${createPageUrl("Profile")}?tab=profile`} className="flex items-center gap-2.5 px-3 py-2">
                                                <User className="w-4 h-4 text-gray-400" /> My Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        
                                        {user.role === "customer" && (
                                            <>
                                                <DropdownMenuItem asChild className="rounded-xl">
                                                    <Link to={`${createPageUrl("Profile")}?tab=orders`} className="flex items-center gap-2.5 px-3 py-2">
                                                        <Package className="w-4 h-4 text-gray-400" /> My Orders
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild className="rounded-xl">
                                                    <Link to={`${createPageUrl("Profile")}?tab=favorites`} className="flex items-center gap-2.5 px-3 py-2">
                                                        <Heart className="w-4 h-4 text-gray-400" /> Favorites
                                                    </Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        {/* Show dashboard based on role */}
                                        {(user.role === "restaurant") && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild className="rounded-xl">
                                                    <Link to={createPageUrl("RestaurantDashboard")} className="flex items-center gap-2.5 px-3 py-2 text-blue-600">
                                                        <Settings className="w-4 h-4" /> Restaurant Panel
                                                    </Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        {(user.role === "admin") && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild className="rounded-xl">
                                                    <Link to={createPageUrl("AdminDashboard")} className="flex items-center gap-2.5 px-3 py-2 text-purple-600">
                                                        <Settings className="w-4 h-4" /> Admin Panel
                                                    </Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        {(user.role === "courier") && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild className="rounded-xl">
                                                    <Link to={createPageUrl("CourierDashboard")} className="flex items-center gap-2.5 px-3 py-2 text-green-600">
                                                        <Package className="w-4 h-4" /> Courier Dashboard
                                                    </Link>
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => api.auth.logout()}
                                            className="flex items-center gap-2.5 px-3 py-2 text-red-500 rounded-xl cursor-pointer"
                                        >
                                            <LogOut className="w-4 h-4" /> Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    onClick={() => api.auth.redirectToLogin()}
                                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm px-5 h-9 rounded-full font-semibold shadow-md shadow-orange-200"
                                >
                                    Sign In
                                </Button>
                            )}

                            <button
                                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-2 border-t border-gray-100 space-y-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.page}
                                    to={createPageUrl(link.page)}
                                    className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
                                        currentPageName === link.page
                                            ? "bg-orange-50 text-orange-600"
                                            : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-16 min-h-screen">{children}</main>

            {/* Footer */}
            <footer className="bg-gray-950 text-gray-400 py-14 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                    <span className="text-white font-black text-sm">F</span>
                                </div>
                                <span className="text-white font-black text-lg">FoodHub</span>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-500">
                                Delivering happiness, one meal at a time.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Company</h4>
                            <ul className="space-y-3 text-sm">
                                {["About Us", "Careers", "Blog", "Press"].map(item => (
                                    <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Partner</h4>
                            <ul className="space-y-3 text-sm">
                                {["Add Restaurant", "Owner Login", "Advertise", "Delivery"].map(item => (
                                    <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Support</h4>
                            <ul className="space-y-3 text-sm">
                                {["Help Center", "Privacy Policy", "Terms of Use", "Contact"].map(item => (
                                    <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-600">© 2026 FoodHub. All rights reserved.</p>
                        <div className="flex gap-4">
                            <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">🔒 Secure Checkout</span>
                            <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">⚡ Fast Delivery</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}