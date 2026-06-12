import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../shared/api/apiConfig';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form Fields State for Seller Registration
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password
    };

    try {
      await apiClient.post('/auth/register/seller', payload);
      setSuccess('Account created successfully! Redirecting you to login modal...');
      
      // Clear form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      // Redirect back home after registration so they can sign in
      setTimeout(() => {
        navigate('/');
      }, 2500);
    } catch (err) {
      console.error('Seller registration failed:', err);
      setError(err.response?.data?.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090a0f] via-[#12131a] to-[#0c0d12] text-white font-sans">
      <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Premium Selling Props */}
        <div className="md:col-span-7 space-y-8">
          <div className="space-y-4">
            <span className="text-purple-400 text-xs font-black uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Jhapcham Merchant Studio
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Start Selling <br />Across Nepal Today
            </h1>
            <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
              Join thousands of local artisans, manufacturers, and merchants reaching millions of active shoppers on Nepal's premier premium eCommerce marketplace.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            {[
              { title: 'Zero Setup Cost', desc: 'No storefront setup fees or hidden activation costs.', icon: '💸' },
              { title: 'Secure Escrow', desc: 'Protected payment verification cycles and safe payouts.', icon: '🛡️' },
              { title: 'Express Logistics', desc: 'Leverage our integrated delivery network across key cities.', icon: '🚚' },
              { title: '24/7 Support Desk', desc: 'Direct merchant portal support for seamless shop operations.', icon: '🤝' }
            ].map((benefit, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/[0.04] p-5 rounded-2xl flex gap-4 items-start hover:border-purple-500/20 transition-all duration-300">
                <span className="text-2xl">{benefit.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">{benefit.title}</h4>
                  <p className="text-[11px] text-gray-500 leading-normal">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Dedicated Seller Registration Form */}
        <div className="md:col-span-5 relative">
          {/* Neon Glow decorations */}
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.08] rounded-3xl p-8 shadow-2xl relative z-10">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white">Merchant Registration</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Step 1 of 2: Create Account</p>
            </div>

            {/* Alert Notifications */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 mb-5 text-xs text-red-400 font-medium flex items-center gap-2">
                <span>✕</span> {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 mb-5 text-xs text-emerald-400 font-medium flex items-center gap-2">
                <span>✓</span> {success}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1.5">
                  Select Username
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="e.g. craftstudio"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-700 outline-none transition-all duration-200"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1.5">
                  Business Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. merchant@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-700 outline-none transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1.5">
                  Create Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-700 outline-none transition-all duration-200"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-700 outline-none transition-all duration-200"
                />
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 py-1">
                <input type="checkbox" required className="mt-1 accent-purple-500" />
                <span className="text-[10px] text-gray-500 leading-normal">
                  I agree to the Jhapcham <a href="#terms" className="underline text-purple-400">Merchant Terms of Service</a> and <a href="#privacy" className="underline text-purple-400">Commission Policy</a>.
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 hover:shadow-purple-500/20`}
              >
                {loading ? 'Registering Merchant...' : 'Create Seller Account'}
              </button>
            </form>

            <div className="text-center mt-6 text-xs text-gray-500">
              Already have a Jhapcham store?{' '}
              <Link to="/" className="text-purple-400 hover:text-purple-300 font-bold underline transition-colors">
                Return Home to Sign In
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegistrationPage;
