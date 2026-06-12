import React, { useEffect, useState, useRef } from 'react';
import { getSellerProfile } from '../services/sellerService';
import { LoadingState, SectionHeader, resolveImageUrl } from './SellerSectionUtils';
import { useCustomer } from '../../customer/contexts/CustomerContext';
import apiClient from '../../../shared/api/apiConfig';
import { Toast, createToaster } from "@ark-ui/react/toast";
import { Portal } from "@ark-ui/react/portal";
import { X, Loader2 } from "lucide-react";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const [SettingsToaster, settingsToaster] = createToaster({
  placement: "bottom-end",
  gap: 16,
  overlap: true,
});

const resolveAvatarUrl = (user) => {
  const raw =
    user?.profileImagePath ||
    user?.profileImage ||
    user?.image ||
    user?.avatar ||
    null;
  if (!raw) return null;
  return raw.startsWith('http') ? raw : `${BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

const SellerSettings = () => {
  const { user, setUser } = useCustomer();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    contactNumber: '',
    address: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const uploadToastId = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getSellerProfile();
        setProfile(res.data || null);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user?.fullName || '',
        contactNumber: user.contactNumber || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setProfileLoading(true);
    setProfileMsg(null);

    try {
      const res = await apiClient.put(`/users/${user.id}`, {
        fullName: profileForm.fullName,
        contactNumber: profileForm.contactNumber,
        address: profileForm.address,
      });
      setUser(res.data);
      setProfileMsg({ type: 'success', text: 'Personal profile details updated successfully!' });
    } catch (err) {
      console.error(err);
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile. Please try again.',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg(null);

    try {
      await apiClient.put(`/users/${user.id}`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password. Please verify current password.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    setProfileMsg(null);

    // Create the updatable toast
    uploadToastId.current = settingsToaster.create({
      title: 'Uploading avatar to Cloudinary...',
      description: 'Please wait while we update your profile picture.',
      type: 'loading',
      duration: Infinity,
    });

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await apiClient.post(`/users/${user.id}/profile-image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(res.data);
      setProfileMsg({ type: 'success', text: 'Profile picture updated!' });
      
      // Complete toast with success
      if (uploadToastId.current) {
        settingsToaster.update(uploadToastId.current, {
          title: 'Upload complete!',
          description: 'Profile picture updated successfully.',
          type: 'success',
          duration: 4000,
        });
      }
    } catch (err) {
      console.error(err);
      setProfileMsg({ type: 'error', text: 'Failed to upload profile picture.' });
      
      // Update toast with error
      if (uploadToastId.current) {
        settingsToaster.update(uploadToastId.current, {
          title: 'Upload failed',
          description: err.response?.data?.message || 'Failed to upload profile picture.',
          type: 'error',
          duration: 4000,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingState label="Loading settings..." />;

  const logo = resolveImageUrl(profile?.logoImagePath || profile?.profileImagePath);
  const avatarUrl = resolveAvatarUrl(user);
  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w?.[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'S';

  return (
    <div className="space-y-6">
      <SectionHeader title="Settings" subtitle="Review store info, update operational profile and change security passwords." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Store Summary (Read-Only) */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)] flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full border border-gray-100 overflow-hidden flex items-center justify-center text-gray-300 font-bold bg-gray-50 shadow-inner">
              {logo ? <img src={logo} alt={profile?.storeName || 'Store Logo'} className="w-full h-full object-cover" /> : '🏪'}
            </div>
            <h3 className="text-sm font-bold text-[#2B3674] mt-4">{profile?.storeName || 'Seller Store'}</h3>
            <p className="text-[11px] font-semibold text-gray-400 mt-1">Merchant Account</p>
            <span className="inline-flex mt-3 px-3 py-1 rounded-full border border-green-150 bg-[#E6FAF5] text-[#05CD99] text-[9px] font-black uppercase tracking-wider">
              {profile?.status || 'APPROVED'}
            </span>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-100 pb-2">
              Store Config Summary
            </h3>
            <div className="space-y-2.5">
              {[
                ['Store Name', profile?.storeName || '-'],
                ['Inside Valley Delivery', `Rs. ${Number(profile?.insideValleyDeliveryFee || 0).toLocaleString()}`],
                ['Outside Valley Delivery', `Rs. ${Number(profile?.outsideValleyDeliveryFee || 0).toLocaleString()}`],
                ['Free Shipping Threshold', profile?.freeShippingEnabled ? `Rs. ${Number(profile.freeShippingMinOrder).toLocaleString()}` : 'Disabled'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-semibold">{label}</span>
                  <span className="text-[#2B3674] font-bold">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-[8px] text-gray-400 font-semibold mt-4 text-center leading-relaxed">
              💡 Store configuration changes must be made via the Store Profile screen.
            </p>
          </div>
        </div>

        {/* Profile and Password Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Edit Card */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-100 pb-2">
              Personal Profile Info
            </h3>

            {profileMsg && (
              <div className={`p-3 rounded-lg text-xs font-bold mb-4 border ${
                profileMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {profileMsg.text}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-6 items-start">
              
              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center shrink-0 w-full md:w-auto pt-2">
                <label className="cursor-pointer relative group inline-block">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        className="object-cover w-full h-full"
                      />
                    ) : null}
                    <div
                      className="absolute inset-0 flex items-center justify-center text-xl font-black text-white select-none"
                      style={{
                        background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #28c76f 0%, #0ea5e9 100%)',
                        display: avatarUrl ? 'none' : 'flex',
                      }}
                    >
                      {initials}
                    </div>

                    {/* Hover Overlay / Loading Spinner */}
                    <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 transition-opacity duration-200 ${
                      uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      {uploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-[8px] text-white font-black uppercase tracking-widest font-sans">Upload</span>
                        </>
                      )}
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                <p className="text-[9px] font-bold text-gray-400 mt-2">Change Avatar</p>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleSaveProfile} className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-not-allowed outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={profileForm.fullName}
                      onChange={handleProfileChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2B3674] focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      name="contactNumber"
                      value={profileForm.contactNumber}
                      onChange={handleProfileChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2B3674] focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                    Home / Business Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={profileForm.address}
                    onChange={handleProfileChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2B3674] focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="bg-[#2B3674] hover:bg-black text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-md"
                  >
                    {profileLoading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>

            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_2px_8px_-3px_rgba(6,81,237,0.08)]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-100 pb-2">
              Security & Password
            </h3>

            {passwordMsg && (
              <div className={`p-3 rounded-lg text-xs font-bold mb-4 border ${
                passwordMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2B3674] focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2B3674] focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2B3674] focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="bg-[#2B3674] hover:bg-black text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-md"
                >
                  {passwordLoading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Toast Alert Feedback */}
      <Portal>
        <SettingsToaster toaster={settingsToaster}>
          {(toast) => (
            <Toast.Root className="bg-white rounded-xl shadow-xl min-w-80 p-4 border border-black/5 relative overflow-anywhere transition-all duration-300 ease-default will-change-transform h-(--height) opacity-(--opacity) translate-x-(--x) translate-y-(--y) scale-(--scale) z-(--z-index)"
                        style={{ borderLeft: "5px solid #3B82F6" }}>
              <div className="flex items-start gap-3">
                {toast.type === "loading" && (
                  <Loader2 className="w-5 h-5 mt-0.5 text-blue-500 animate-spin shrink-0" />
                )}
                {toast.type === "success" && (
                  <div className="w-5 h-5 mt-0.5 bg-[#05CD99] rounded-full flex items-center justify-center text-white shrink-0">
                    <span className="text-xs font-bold font-sans">✓</span>
                  </div>
                )}
                {toast.type === "error" && (
                  <div className="w-5 h-5 mt-0.5 bg-[#EE5D50] rounded-full flex items-center justify-center text-white shrink-0">
                    <X className="w-3 h-3" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Toast.Title className="text-gray-900 font-bold text-sm">
                    {toast.title}
                  </Toast.Title>
                  <Toast.Description className="text-gray-600 text-xs mt-1 font-medium font-sans">
                    {toast.description}
                  </Toast.Description>
                  {toast.type === "loading" && (
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-1.5 rounded-full animate-pulse w-[75%]"></div>
                    </div>
                  )}
                </div>
              </div>
              <Toast.CloseTrigger className="absolute top-3 right-3 p-1 hover:bg-black/5 rounded transition-colors text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </Toast.CloseTrigger>
            </Toast.Root>
          )}
        </SettingsToaster>
      </Portal>
    </div>
  );
};

export default SellerSettings;



