export default function OfferBanner({ color, icon, title, subtitle, code }) {
    return (
        <div className={`bg-gradient-to-r ${color} rounded-2xl p-5 text-white cursor-pointer hover:scale-[1.02] transition-transform`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-2xl font-black">{title}</div>
                    <div className="text-sm text-white/80 mt-0.5">{subtitle}</div>
                    <div className="mt-3 bg-white/20 rounded-full px-3 py-1 text-xs font-bold w-fit">
                        Use: {code}
                    </div>
                </div>
                <div className="text-5xl">{icon}</div>
            </div>
        </div>
    );
}