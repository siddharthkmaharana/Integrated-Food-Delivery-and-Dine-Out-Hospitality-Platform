import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
    const navigate = useNavigate();
    const { checkAppState } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                await api.auth.login({ email: form.email, password: form.password });
            } else {
                // The register endpoint expects role as well
                const res = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: 'customer' })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Registration failed');
                
                // Store token if it returns one
                if (data.token) {
                    localStorage.setItem('token', data.token);
                } else {
                    // Fallback to login if register doesn't auto-login
                    await api.auth.login({ email: form.email, password: form.password });
                }
            }
            // Refresh auth state in the layout/app and go home
            await checkAppState();
            window.location.href = '/';
        } catch (err) {
            setError(err.response?.data?.message || err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-8 sm:p-10">
                    <div className="flex justify-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200">
                            <span className="text-white font-black text-xl">F</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-center text-gray-900 mb-2">
                        {isLogin ? "Welcome back!" : "Create an account"}
                    </h2>
                    <p className="text-center text-gray-500 text-sm mb-8">
                        {isLogin ? "Enter your details to access your account." : "Join us and start ordering delicious food."}
                    </p>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold mb-6 flex items-center">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5" htmlFor="name">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        autoComplete="name"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-orange-500 transition-colors bg-gray-50 focus:bg-white text-sm font-medium text-gray-900"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5" htmlFor="email">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-orange-500 transition-colors bg-gray-50 focus:bg-white text-sm font-medium text-gray-900"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide" htmlFor="password">Password</label>
                                {isLogin && <a href="#" className="text-xs font-bold text-orange-500 hover:text-orange-600">Forgot password?</a>}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-orange-500 transition-colors bg-gray-50 focus:bg-white text-sm font-medium text-gray-900"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-12 rounded-xl font-bold shadow-lg shadow-orange-200 mt-2 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    {isLogin ? "Sign In" : "Create Account"}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                            <button 
                                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                                className="font-bold text-orange-500 hover:text-orange-600"
                            >
                                {isLogin ? "Sign up" : "Log in"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
