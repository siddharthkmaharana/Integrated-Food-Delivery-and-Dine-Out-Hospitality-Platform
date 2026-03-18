export default function CategoryPill({ category, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all flex-shrink-0 ${isActive
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:text-orange-500"
                }`}
        >
            <span>{category.icon}</span>
            <span>{category.name}</span>
        </button>
    );
}