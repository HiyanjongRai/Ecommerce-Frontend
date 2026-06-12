import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../shared/components/Navbar/Navbar';
import ProductCard from '../product/components/ProductCard';
import { getSellerProfileById, sendMessage } from '../../shared/api/customerApi';
import { BASE_URL } from '../../shared/api/apiClient';
import { useCustomer } from '../customer/contexts/CustomerContext';

const SellerPublicProfile = () => {
  const { id } = useParams();
  const { user } = useCustomer();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Message Modal state
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgContent, setMsgContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);
  const [msgError, setMsgError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getSellerProfileById(id);
        setProfile(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Seller profile not found.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      setMsgError('Please log in first to send messages.');
      return;
    }
    if (!msgContent.trim()) {
      setMsgError('Message content cannot be empty.');
      return;
    }

    setSendingMsg(true);
    setMsgError('');
    setMsgSuccess(false);
    try {
      await sendMessage({
        receiverId: profile.userId,
        content: msgContent.trim(),
      });
      setMsgSuccess(true);
      setMsgContent('');
      setTimeout(() => {
        setIsMsgModalOpen(false);
        setMsgSuccess(false);
      }, 2500);
    } catch (err) {
      setMsgError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <div className="flex flex-col justify-center items-center h-[60vh] text-center px-4">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">{error || 'Store profile not found'}</h2>
          <Link to="/" className="mt-4 text-xs font-bold text-blue-600 hover:underline uppercase tracking-wider">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16">
      <Navbar />

      {/* Header Banner Section */}
      <div className="bg-[#222529] text-white py-12 px-6 md:px-12 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20" />
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Logo */}
          <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-700/50 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
            {profile.logoImagePath || profile.profileImagePath ? (
              <img 
                src={(profile.logoImagePath || profile.profileImagePath).startsWith('http') 
                  ? (profile.logoImagePath || profile.profileImagePath) 
                  : `${BASE_URL}${(profile.logoImagePath || profile.profileImagePath).startsWith('/') ? '' : '/'}${profile.logoImagePath || profile.profileImagePath}`} 
                alt={profile.storeName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl">🏪</span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{profile.storeName || 'Jhapcham Store'}</h1>
              {profile.isVerified && (
                <span className="bg-blue-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  ✓ Verified Seller
                </span>
              )}
            </div>
            
            <p className="text-slate-300 text-xs font-medium mt-2 max-w-2xl leading-relaxed">
              {profile.description || 'Welcome to our official store on Jhapcham. Discover premium quality products, great deals, and stellar service.'}
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>📍 {profile.address || 'Nepal'}</span>
              <span>•</span>
              <span>Joined: {profile.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'Recently'}</span>
              <span>•</span>
              <span>Followers: <strong className="text-white">{profile.followerCount || 0}</strong></span>
            </div>
          </div>

          {/* Action button */}
          <div className="shrink-0 flex gap-3">
            <button
              onClick={() => setIsMsgModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              ✉ Inquiry / Message
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-[3.5fr_8.5fr] gap-8">
        
        {/* Left Side: Store Policy Card */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#222529] mb-4 pb-2 border-b border-gray-100">
              Store Information
            </h3>
            
            <div className="space-y-4 text-xs">
              {profile.about && (
                <div>
                  <span className="text-gray-400 block text-[9px] font-black uppercase tracking-widest mb-0.5">About Us</span>
                  <p className="text-gray-600 leading-relaxed font-medium">{profile.about}</p>
                </div>
              )}

              <div>
                <span className="text-gray-400 block text-[9px] font-black uppercase tracking-widest mb-0.5">Contact Email</span>
                <span className="text-[#222529] font-bold">{profile.email || 'N/A'}</span>
              </div>

              {profile.contactNumber && (
                <div>
                  <span className="text-gray-400 block text-[9px] font-black uppercase tracking-widest mb-0.5">Support Phone</span>
                  <span className="text-[#222529] font-bold">{profile.contactNumber}</span>
                </div>
              )}

              <div>
                <span className="text-gray-400 block text-[9px] font-black uppercase tracking-widest mb-2">Delivery Policy</span>
                <div className="bg-slate-50 border border-gray-150 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Inside Valley:</span>
                    <strong className="text-[#222529]">
                      {profile.insideValleyDeliveryFee > 0 ? `Rs. ${profile.insideValleyDeliveryFee}` : 'FREE'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Outside Valley:</span>
                    <strong className="text-[#222529]">
                      {profile.outsideValleyDeliveryFee > 0 ? `Rs. ${profile.outsideValleyDeliveryFee}` : 'FREE'}
                    </strong>
                  </div>
                  {profile.freeShippingEnabled && (
                    <div className="pt-2 border-t border-gray-200 mt-2 text-[10px] text-emerald-600 font-bold text-center">
                      🚚 Free Shipping on orders over Rs. {profile.freeShippingMinOrder || 0}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Product Gallery */}
        <div>
          <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-sm min-h-[400px]">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#222529] mb-6 pb-3 border-b border-gray-150 flex items-center justify-between">
              <span>Catalog Products</span>
              <span className="text-xs font-bold text-gray-400">({profile.products?.length || 0} items)</span>
            </h3>

            {!profile.products || profile.products.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-4xl block mb-2">📦</span>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">This seller hasn't posted any products yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {profile.products.map(p => (
                  <ProductCard 
                    key={p.id} 
                    product={{
                      productId: p.id,
                      name: p.name,
                      slug: p.slug,
                      price: p.price,
                      discountPrice: p.discountPrice,
                      salePrice: p.salePrice,
                      saleLabel: p.saleLabel,
                      imagePaths: p.imagePaths || (p.imagePath ? [p.imagePath] : []),
                      averageRating: p.averageRating || 0,
                      totalReviews: p.totalReviews || 0,
                      onSale: p.onSale,
                      salePercentage: p.salePercentage
                    }} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message / Inquiry Modal */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[8px] font-black bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                  Store Inquiry
                </span>
                <h3 className="text-xs font-black text-gray-900 mt-1 uppercase tracking-wider">
                  Send Message to {profile.storeName}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsMsgModalOpen(false);
                  setMsgError('');
                  setMsgSuccess(false);
                }}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              {msgError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[11px] font-semibold">
                  ⚠️ {msgError}
                </div>
              )}
              {msgSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-[11px] font-semibold">
                  🎉 Message sent successfully! Close modal...
                </div>
              )}

              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Your Message
                </label>
                <textarea
                  rows="4"
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder="Ask about store inventory, delivery updates, or specific negotiations..."
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-800 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500/80 resize-none transition-all"
                  disabled={sendingMsg || msgSuccess}
                />
              </div>

              {/* Submit buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMsgModalOpen(false);
                    setMsgError('');
                    setMsgSuccess(false);
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex-1 transition-all"
                  disabled={sendingMsg || msgSuccess}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMsg || msgSuccess}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex-1 transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50"
                >
                  {sendingMsg ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerPublicProfile;
