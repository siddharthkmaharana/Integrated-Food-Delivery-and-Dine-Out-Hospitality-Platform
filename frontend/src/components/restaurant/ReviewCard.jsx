import { format } from "date-fns";

export default function ReviewCard({ review }) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(review.user_name || review.user_email || "U")[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm">{review.user_name || "Anonymous"}</p>
                        <p className="text-xs text-gray-400">
                            {review.created_date ? format(new Date(review.created_date), "MMM d, yyyy") : ""}
                        </p>
                    </div>
                </div>
                <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} className={`text-sm ${s <= review.rating ? "text-yellow-500" : "text-gray-200"}`}>★</span>
                    ))}
                </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
        </div>
    );
}