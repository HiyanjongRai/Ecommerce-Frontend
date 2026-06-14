import React, { useEffect, useState, useRef } from 'react';
import { getSellerProfile } from '../services/sellerService';
import { LoadingState, SectionHeader, resolveImageUrl } from './SellerSectionUtils';
import { useCustomer } from '../../customer/contexts/CustomerContext';
import apiClient from '../../../shared/api/apiConfig';
import { Toast, createToaster } from "@ark-ui/react/toast";
import { Portal } from "@ark-ui/react/portal";
import { X, Loader2, Eye, EyeOff } from "lucide-react";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const [SettingsToaster, settingsToaster] = createToaster({
  placement: "bottom-end",
  gap: 16,
  overlap: true,
});

const resolveAvatarUrl = (user) => {
  const raw = user?.profileImagePath || user?.profileImage || user?.image || user?.avatar || null;
  if (!raw) return null;
  return raw.startsWith('http') ? raw : `${BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls = 'w-full bg-white border border-gray-200 rounded-sm px-3 py-2 text-xs font-semibold text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors';
const inputDisabledCls = 'w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-xs font-semibold text-gray-400 cursor-not-allowed outline-none';
const labelCls = 'block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1';

// ── Alert banner ──────────────────────────────────────────────────────────────
const Alert = ({ msg }) => {
  if (!msg) return null;
  const isSuccess = msg.type === 'success';
  return (
    <div className={`p-3 rounded-sm border text-xs font-bold flex items-center gap-2 mb-4 ${
      isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        {isSuccess
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        }
      </svg>
      {msg.text}
    </div>
  );
};

// ── Card wrapper ──────────────────────────────────────────────────────────────
const Card = ({ title, children }) => (
  <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100">
      <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">{title}</p>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

// ── Save button ───────────────────────────────────────────────────────────────
const SaveBtn = ({ loading, label, loadingLabel }) => (
  <button
    type="submit"
    disabled={loading}
    className="flex items-center gap-1.5 bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-[9px] font-black uppercase tracking-wider px-4 py-1.5 rounded-sm transition-colors"
  >
    {loading ? (
      <>
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        {loadingLabel}
      </>
    ) : label}
  </button>
);

// ── Password field with show/hide ─────────────────────────────────────────────
const PasswordField = ({ label, name, value, onChange, show, onToggle }) => (
  <div>
    <label className={labelCls}>{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        name={name} value={value} onChange={onChange}
        placeholder="••••••••" required
        className={`${inputCls} pr-10`}
      />
      <button
        type="button" onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff size={14}/> : <Eye size={14}/>}
      </button>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const SellerSettings = () => {
  const { user, setUser } = useCustomer();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({ fullName: '', contactNumber: '', address: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const uploadToastId = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getSellerProfile();
        setProfile(res.data || null);
      } catch { setProfile(null); }
      finally { setLoading(false); }
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

  const handleProfileChange = (e) => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

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
      setProfileMsg({ type: 'success', text: 'Personal profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally { setProfileLoading(false); }
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
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally { setPasswordLoading(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    setProfileMsg(null);
    uploadToastId.current = settingsToaster.create({
      title: 'Uploading avatar…',
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
      if (uploadToastId.current) {
        settingsToaster.update(uploadToastId.current, {
          title: 'Upload complete!',
          description: 'Profile picture updated successfully.',
          type: 'success', duration: 4000,
        });
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Failed to upload profile picture.' });
      if (uploadToastId.current) {
        settingsToaster.update(uploadToastId.current, {
          title: 'Upload failed',
          description: err.response?.data?.message || 'Failed to upload profile picture.',
          type: 'error', duration: 4000,
        });
      }
    } finally { setUploading(false); }
  };

  if (loading) return <LoadingState label="Loading settings…" />;

  const logo = resolveImageUrl(profile?.logoImagePath || profile?.profileImagePath);
  const avatarUrl = resolveAvatarUrl(user);
  const initials = user?.fullName
    ? user.fullName.split(' ').map(w => w?.[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'S';

  return (
    <div className="space-y-4 max-w-[1400px]">
      <SectionHeader title="Settings" subtitle="Review store info, update personal profile and change your password." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left: Store Summary ── */}
        <div className="space-y-4">

          {/* Store identity */}
          <Card title="Store Summary">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-sm border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
                {logo
                  ? <img src={logo} alt={profile?.storeName || 'Store'} className="w-full h-full object-cover"/>
                  : <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/></svg>
                }
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">{profile?.storeName || 'Seller Store'}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Merchant Account</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider border ${
                (profile?.status || 'APPROVED') === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {profile?.status || 'APPROVED'}
              </span>
            </div>
          </Card>

          {/* Store config */}
          <Card title="Store Config">
            <div className="space-y-2.5">
              {[
                ['Store Name', profile?.storeName || '—'],
                ['Inside Valley', `Rs. ${Number(profile?.insideValleyDeliveryFee || 0).toLocaleString()}`],
                ['Outside Valley', `Rs. ${Number(profile?.outsideValleyDeliveryFee || 0).toLocaleString()}`],
                ['Free Shipping', profile?.freeShippingEnabled ? `Rs. ${Number(profile.freeShippingMinOrder).toLocaleString()}+` : 'Disabled'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-semibold">{label}</span>
                  <span className="text-[10px] text-gray-900 font-black">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-gray-400 font-medium mt-4 pt-3 border-t border-gray-100 leading-relaxed">
              Store config is managed via the Store Profile page.
            </p>
          </Card>
        </div>

        {/* ── Right: Profile + Password ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Personal Profile */}
          <Card title="Personal Profile Info">
            <Alert msg={profileMsg} />
            <form onSubmit={handleSaveProfile}>
              <div className="flex flex-col md:flex-row gap-5 items-start">

                {/* Avatar upload */}
                <div className="flex flex-col items-center shrink-0 gap-2">
                  <label className="cursor-pointer relative group inline-block">
                    <div className="relative w-20 h-20 rounded-sm overflow-hidden border-2 border-emerald-500">
                      {avatarUrl
                        ? <img src={avatarUrl} alt="avatar" className="object-cover w-full h-full"/>
                        : null
                      }
                      <div
                        className="absolute inset-0 flex items-center justify-center text-lg font-black text-white select-none"
                        style={{
                          background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #28c76f 0%, #0ea5e9 100%)',
                          display: avatarUrl ? 'none' : 'flex',
                        }}
                      >
                        {initials}
                      </div>
                      <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {uploading
                          ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/>
                          : <>
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                              <span className="text-[8px] text-white font-black uppercase tracking-widest">Upload</span>
                            </>
                        }
                      </div>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading}/>
                  </label>
                  <p className="text-[9px] font-bold text-gray-400">Change Avatar</p>
                </div>

                {/* Fields */}
                <div className="flex-1 w-full space-y-3.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Username</label>
                      <input
                        type="text"
                        value={profile?.username || profile?.sellerUsername || user?.username || ''}
                        disabled className={inputDisabledCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <input
                        type="email"
                        value={profile?.email || user?.email || ''}
                        disabled className={inputDisabledCls}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input type="text" name="fullName" value={profileForm.fullName} onChange={handleProfileChange} className={inputCls}/>
                    </div>
                    <div>
                      <label className={labelCls}>Contact Number</label>
                      <input type="text" name="contactNumber" value={profileForm.contactNumber} onChange={handleProfileChange} className={inputCls}/>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Home / Business Address</label>
                    <input type="text" name="address" value={profileForm.address} onChange={handleProfileChange} className={inputCls}/>
                  </div>
                  <div className="flex justify-end pt-1">
                    <SaveBtn loading={profileLoading} label="Save Profile" loadingLabel="Saving…"/>
                  </div>
                </div>
              </div>
            </form>
          </Card>

          {/* Change Password */}
          <Card title="Security & Password">
            <Alert msg={passwordMsg} />
            <form onSubmit={handleSavePassword} className="space-y-3.5">
              <PasswordField
                label="Current Password" name="currentPassword"
                value={passwordForm.currentPassword} onChange={handlePasswordChange}
                show={showCurrent} onToggle={() => setShowCurrent(v => !v)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <PasswordField
                  label="New Password" name="newPassword"
                  value={passwordForm.newPassword} onChange={handlePasswordChange}
                  show={showNew} onToggle={() => setShowNew(v => !v)}
                />
                <PasswordField
                  label="Confirm Password" name="confirmPassword"
                  value={passwordForm.confirmPassword} onChange={handlePasswordChange}
                  show={showConfirm} onToggle={() => setShowConfirm(v => !v)}
                />
              </div>
              <div className="flex justify-end pt-1">
                <SaveBtn loading={passwordLoading} label="Change Password" loadingLabel="Updating…"/>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Toast */}
      <Portal>
        <SettingsToaster toaster={settingsToaster}>
          {(toast) => (
            <Toast.Root className="bg-white rounded-sm shadow-xl min-w-80 p-4 border border-gray-200 relative overflow-hidden transition-all duration-300 ease-default will-change-transform h-(--height) opacity-(--opacity) translate-x-(--x) translate-y-(--y) scale-(--scale) z-(--z-index)"
                        style={{ borderLeft: '4px solid #111827' }}>
              <div className="flex items-start gap-3">
                {toast.type === 'loading' && <Loader2 className="w-4 h-4 mt-0.5 text-gray-500 animate-spin shrink-0"/>}
                {toast.type === 'success' && (
                  <div className="w-4 h-4 mt-0.5 bg-emerald-500 rounded-sm flex items-center justify-center text-white shrink-0">
                    <span className="text-[9px] font-bold">✓</span>
                  </div>
                )}
                {toast.type === 'error' && (
                  <div className="w-4 h-4 mt-0.5 bg-red-500 rounded-sm flex items-center justify-center text-white shrink-0">
                    <X className="w-3 h-3"/>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Toast.Title className="text-gray-900 font-black text-xs uppercase tracking-wider">{toast.title}</Toast.Title>
                  <Toast.Description className="text-gray-500 text-[11px] mt-1 font-medium">{toast.description}</Toast.Description>
                  {toast.type === 'loading' && (
                    <div className="mt-2.5 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                      <div className="bg-gray-900 h-1 rounded-full animate-pulse w-3/4"/>
                    </div>
                  )}
                </div>
              </div>
              <Toast.CloseTrigger className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-sm transition-colors text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5"/>
              </Toast.CloseTrigger>
            </Toast.Root>
          )}
        </SettingsToaster>
      </Portal>
    </div>
  );
};

export default SellerSettings;
