import { Search } from "lucide-react";

export default function HeroSection({ searchQuery, setSearchQuery }) {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 text-white">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 right-20 text-9xl">🍕</div>
                <div className="absolute bottom-5 right-60 text-7xl">🍔</div>
                <div className="absolute top-20 left-10 text-6xl">🌮</div>
                <div className="absolute bottom-10 left-40 text-8xl">🍜</div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold mb-5">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        1000+ restaurants online
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4">
                        Hungry? We've got <br />
                        <span className="text-yellow-300">you covered.</span>
                    </h1>
                    <p className="text-lg text-white/80 mb-8">
                        Order from 1000+ restaurants or book a table at your favorite spot.
                    </p>

                    <div className="flex gap-3 bg-white rounded-2xl p-2 shadow-2xl max-w-xl">
                        <div className="flex items-center gap-2 px-3 flex-1">
                            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Search for restaurants, cuisine..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full text-gray-900 placeholder-gray-400 outline-none text-sm font-medium bg-transparent"
                            />
                        </div>
                        <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-300 flex-shrink-0">
                            Find Food
                        </button>
                    </div>

                    <div className="flex gap-6 mt-8 text-sm font-medium text-white/80">
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-300 font-bold text-xl">4.8★</span>
                            <span>Avg. rating</span>
                        </div>
                        <div className="w-px bg-white/30" />
                        <div>⚡ 30 min avg. delivery</div>
                        <div className="hidden sm:block w-px bg-white/30" />
                        <div className="hidden sm:block">🛡️ Safe & secure</div>
                    </div>
                </div>
            </div>

            <div className="h-8 bg-gray-50" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
        </div>
    );
}