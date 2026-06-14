import React, { useState, useEffect } from 'react';
import { getSellerProfile, updateSellerProfile } from '../services/sellerService';
import { BASE_URL } from '../../../shared/api/apiConfig';
import { LoadingState, SectionHeader } from './SellerSectionUtils';

const toImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const inputCls = 'w-full bg-white border border-gray-200 rounded-sm px-3 py-2 text-xs font-semibold text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors';
const labelCls = 'block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1';

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

  useEffect(() => { fetchProfile(); }, []);

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
      console.error('Failed to load seller profile', error);
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
      reader.onloadend = () => setLogoPreview(reader.result);
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
      if (logoFile) formData.append('logoImage', logoFile);

      const res = await updateSellerProfile(formData);
      if (res.data?.logoImagePath && !logoFile) {
        setLogoPreview(toImageUrl(res.data.logoImagePath));
      }
      setMessage({ type: 'success', text: 'Store profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading store profile…" />;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-[1400px]">

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Store Profile"
          subtitle="Manage your public store details, logo, and delivery configuration."
        />
        <button
          type="submit"
          disabled={saving}
          className="flex-shrink-0 flex items-center gap-1.5 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-[9px] font-black uppercase tracking-wider px-4 py-1.5 rounded-sm transition-colors"
        >
          {saving ? (
            <>
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Alert */}
      {message.text && (
        <div className={`p-3 rounded-sm border text-xs font-bold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {message.type === 'success'
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            }
          </svg>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left: Basic Info ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Basic Information</p>
            </div>
            <div className="p-4 space-y-3.5">
              <div>
                <label className={labelCls}>Store Name</label>
                <input
                  type="text" name="storeName"
                  value={profile.storeName} onChange={handleInputChange}
                  className={inputCls} placeholder="e.g. Tech World Nepal"
                />
              </div>
              <div>
                <label className={labelCls}>Store Description</label>
                <textarea
                  name="description"
                  value={profile.description} onChange={handleInputChange}
                  rows="3" className={`${inputCls} resize-none`}
                  placeholder="Describe your store and what you sell…"
                />
              </div>
              <div>
                <label className={labelCls}>About Store</label>
                <textarea
                  name="about"
                  value={profile.about} onChange={handleInputChange}
                  rows="3" className={`${inputCls} resize-none`}
                  placeholder="Tell customers more about your story and values…"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Business Address</label>
                  <input
                    type="text" name="address"
                    value={profile.address} onChange={handleInputChange}
                    className={inputCls} placeholder="e.g. New Road, Kathmandu"
                  />
                </div>
                <div>
                  <label className={labelCls}>Contact Number</label>
                  <input
                    type="tel" name="contactNumber"
                    value={profile.contactNumber} onChange={handleInputChange}
                    className={inputCls} placeholder="e.g. 9800000000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Configuration */}
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Delivery Configuration</p>
            </div>
            <div className="p-4 space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Inside Valley Delivery (Rs.)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">Rs.</span>
                    <input
                      type="number" name="insideValleyDeliveryFee"
                      value={profile.insideValleyDeliveryFee} onChange={handleInputChange}
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Outside Valley Delivery (Rs.)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">Rs.</span>
                    <input
                      type="number" name="outsideValleyDeliveryFee"
                      value={profile.outsideValleyDeliveryFee} onChange={handleInputChange}
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                </div>
              </div>

              {/* Free Shipping Toggle */}
              <label className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-sm px-4 py-3 cursor-pointer hover:bg-gray-100/70 transition-colors">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox" name="freeShippingEnabled"
                    checked={profile.freeShippingEnabled} onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-emerald-500 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-900">Enable Free Shipping</span>
                  <span className="block text-[10px] text-gray-400 font-medium">Automatically waive delivery fee above a minimum order</span>
                </div>
              </label>

              {profile.freeShippingEnabled && (
                <div>
                  <label className={labelCls}>Free Shipping Minimum Order (Rs.)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">Rs.</span>
                    <input
                      type="number" name="freeShippingMinOrder"
                      value={profile.freeShippingMinOrder} onChange={handleInputChange}
                      className={`${inputCls} pl-8 bg-emerald-50/40 border-emerald-200`}
                      placeholder="e.g. 5000"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium mt-1.5">
                    Orders above this amount get free shipping automatically. Set to 0 to disable.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Logo ── */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Store Logo</p>
            </div>
            <div className="p-4 flex flex-col items-center gap-3">
              {/* Logo preview */}
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-sm border-2 border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Store Logo" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/>
                    </svg>
                  )}
                </div>
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-sm">
                  <span className="text-white text-[8px] font-black uppercase tracking-widest">Change</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
              </div>

              {/* Upload button */}
              <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-gray-600 border border-gray-200 px-3 py-1.5 rounded-sm hover:bg-gray-50 transition-colors cursor-pointer">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                </svg>
                Upload Logo
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
              </label>

              <p className="text-[9px] text-gray-400 font-medium text-center">
                Recommended: 400×400px · Max 2MB
              </p>

              {logoFile && (
                <p className="text-[9px] text-emerald-700 font-black text-center border border-emerald-200 bg-emerald-50 rounded-sm px-2 py-1">
                  ✓ New logo selected
                </p>
              )}
            </div>
          </div>

          {/* Quick Tips card */}
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Tips</p>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                'Use a clear, high-res logo for better brand recognition.',
                'Keep your description concise and keyword-rich.',
                'Set delivery fees that cover your actual courier costs.',
                'Enable free shipping above a threshold to boost conversion.',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0 mt-1.5" />
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default SellerProfile;
