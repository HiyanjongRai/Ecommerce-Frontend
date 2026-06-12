import React, { useState, useEffect } from 'react';
import { getSellerProfile, updateSellerProfile } from '../services/sellerService';
import { BASE_URL } from '../../../shared/api/apiConfig';

const toImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const SellerProfile = () => {
  const [profile, setProfile] = useState({
    storeName: '',
    description: '',
    about: '',
    address: '',
    contactNumber: '',
    insideValleyDeliveryFee: 100,
    outsideValleyDeliveryFee: 150,
    freeShippingEnabled: false,
    freeShippingMinOrder: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getSellerProfile();
      if (res.data) {
        setProfile({
          storeName: res.data.storeName || '',
          description: res.data.description || '',
          about: res.data.about || '',
          address: res.data.address || '',
          contactNumber: res.data.contactNumber || '',
          insideValleyDeliveryFee: res.data.insideValleyDeliveryFee ?? 100,
          outsideValleyDeliveryFee: res.data.outsideValleyDeliveryFee ?? 150,
          freeShippingEnabled: Boolean(res.data.freeShippingEnabled),
          freeShippingMinOrder: res.data.freeShippingMinOrder ?? '',
        });
        setLogoPreview(toImageUrl(res.data.logoImagePath));
      }
    } catch (error) {
      console.error("Failed to load seller profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, type, checked, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('storeName', profile.storeName);
      formData.append('description', profile.description);
      formData.append('about', profile.about);
      formData.append('address', profile.address);
      formData.append('contactNumber', profile.contactNumber);
      formData.append('insideValleyDeliveryFee', profile.insideValleyDeliveryFee);
      formData.append('outsideValleyDeliveryFee', profile.outsideValleyDeliveryFee);
      formData.append('freeShippingEnabled', profile.freeShippingEnabled);
      if (profile.freeShippingMinOrder !== '') {
        formData.append('freeShippingMinOrder', profile.freeShippingMinOrder);
      }

      if (logoFile) {
        formData.append('logoImage', logoFile);
      }

      const res = await updateSellerProfile(formData);
      if (res.data?.logoImagePath && !logoFile) {
        setLogoPreview(toImageUrl(res.data.logoImagePath));
      }
      setMessage({ type: 'success', text: 'Store profile updated successfully!' });
    } catch (error) {
      console.error("Failed to update profile", error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3.5">
      
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)] border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-[#2B3674] tracking-tight">Store Profile</h2>
          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Manage your public store details, logo, and delivery configurations.</p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={saving}
          className="bg-[#2B3674] hover:bg-black text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all shadow-md flex items-center gap-1.5"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg text-xs font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        
        {/* Left Col: Basic Info & Logo */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="bg-white rounded-xl p-4 md:p-5 shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)] border border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-100 pb-2">
              Basic Information
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Store Name</label>
                <input
                  type="text"
                  name="storeName"
                  value={profile.storeName}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2B3674] focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="e.g. Tech World Nepal"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Store Description</label>
                <textarea
                  name="description"
                  value={profile.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2B3674] focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                  placeholder="Describe your store and what you sell..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Business Address</label>
                  <input
                    type="text"
                    name="address"
                    value={profile.address}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2B3674] focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="e.g. New Road, Kathmandu"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={profile.contactNumber}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2B3674] focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="e.g. 9800000000"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Logo & Delivery Settings */}
        <div className="space-y-3.5">
          
          {/* Logo Upload */}
          <div className="bg-white rounded-xl p-4 shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)] border border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-100 pb-2">
              Store Logo
            </h3>
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full border-2 border-gray-50 bg-gray-100 flex items-center justify-center overflow-hidden mb-2.5 shadow-sm relative group cursor-pointer">
                {logoPreview ? (
                  <img src={logoPreview} alt="Store Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-gray-300">🏪</span>
                )}
                
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="text-white text-[8px] font-black uppercase tracking-widest">Change</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
              </div>
              <p className="text-[9px] text-gray-400 font-semibold text-center px-2">
                Recommended: 400x400px. Max 2MB.
              </p>
            </div>
          </div>

          {/* Delivery Configuration */}
          <div className="bg-white rounded-xl p-4 shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)] border border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-100 pb-2">
              Delivery Config
            </h3>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Inside Valley (Rs.)</label>
                <input
                  type="number"
                  name="insideValleyDeliveryFee"
                  value={profile.insideValleyDeliveryFee}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2B3674] focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Outside Valley (Rs.)</label>
                <input
                  type="number"
                  name="outsideValleyDeliveryFee"
                  value={profile.outsideValleyDeliveryFee}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2B3674] focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <div className="pt-1.5">
                <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-600 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="freeShippingEnabled"
                    checked={profile.freeShippingEnabled}
                    onChange={handleInputChange}
                    className="h-3.5 w-3.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  Enable Free Shipping
                </label>
                <label className="block text-[9px] font-black uppercase tracking-widest text-blue-600 mb-1">Free Shipping Threshold</label>
                <input
                  type="number"
                  name="freeShippingMinOrder"
                  value={profile.freeShippingMinOrder}
                  onChange={handleInputChange}
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-900 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="e.g. 5000"
                />
                <p className="text-[8px] text-gray-400 mt-1 font-semibold leading-relaxed">
                  Orders above this amount will get free shipping automatically. Set to 0 to disable.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SellerProfile;


