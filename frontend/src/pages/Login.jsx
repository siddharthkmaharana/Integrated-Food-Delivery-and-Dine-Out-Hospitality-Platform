import { useState } from 'react';
import { api } from '@/api/client';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await api.auth.login({ email: form.email, password: form.password });
      } else {
        await api.auth.register(form);
      }
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const roles = [
    { value: 'customer', label: '🛒 Customer', desc: 'Order food & book tables' },
    { value: 'restaurant', label: '🍽️ Restaurant Owner', desc: 'Manage your restaurant' },
    { value: 'courier', label: '🚴 Courier', desc: 'Deliver orders' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-orange-100">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white font-black text-2xl">F</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            Food<span className="text-orange-500">Hub</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              isLogin ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              !isLogin ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="Min 6 characters"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {/* Role Selection — only on register */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Register As
              </label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map(role => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: role.value })}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      form.role === role.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-200'
                    }`}
                  >
                    <span className="text-xl">{role.label.split(' ')[0]}</span>
                    <div>
                      <p className={`text-sm font-bold ${form.role === role.value ? 'text-orange-600' : 'text-gray-700'}`}>
                        {role.label.split(' ').slice(1).join(' ')}
                      </p>
                      <p className="text-xs text-gray-400">{role.desc}</p>
                    </div>
                    {form.role === role.value && (
                      <span className="ml-auto text-orange-500 font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Please wait...
              </span>
            ) : isLogin ? 'Sign In' : `Register as ${roles.find(r => r.value === form.role)?.label.split(' ').slice(1).join(' ')}`}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            className="text-orange-500 font-bold hover:underline"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Register here' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}