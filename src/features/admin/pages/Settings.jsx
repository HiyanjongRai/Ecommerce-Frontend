import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../app/layouts/AdminLayout';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { useCustomer } from '../../customer/contexts/CustomerContext';
import apiClient from '../../../shared/api/apiConfig';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

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

export default function AdminSettings() {
  const { darkMode, themeClasses } = useAdminTheme();
  const { user, setUser } = useCustomer();

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    contactNumber: '',
    address: '',
  });

  // Password Form state
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

  // Sync current user state into the form on load
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
      setProfileMsg({ type: 'success', text: 'Admin profile updated successfully!' });
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

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await apiClient.post(`/users/${user.id}/profile-image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(res.data);
      setProfileMsg({ type: 'success', text: 'Profile image updated!' });
    } catch (err) {
      console.error(err);
      setProfileMsg({ type: 'error', text: 'Failed to upload profile image.' });
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = resolveAvatarUrl(user);
  const initials = user?.fullName
    ? user?.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'A';

  return (
    <AdminLayout
      pageTitle="Settings"
      pageSubtitle="Configure your admin profile, contact settings, upload an avatar, and change your password."
    >
      <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
        
        {/* Profile Card */}
        <div className={`rounded-[20px] p-6 border space-y-6 transition-colors ${themeClasses.card}`}>
          <h2 className={`text-sm font-black uppercase tracking-wider pb-3 border-b ${themeClasses.border.primary} ${themeClasses.text.primary}`}>
            Profile Information
          </h2>

          {profileMsg && (
            <div className={`p-3.5 rounded-xl text-xs font-bold border transition-colors ${
              profileMsg.type === 'success' ? themeClasses.status.success : themeClasses.status.danger
            }`}>
              {profileMsg.text}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6 items-start">
            
            {/* Avatar Upload Column */}
            <div className="flex flex-col items-center w-full md:w-auto shrink-0 pt-2">
              <label className="cursor-pointer relative group inline-block">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user?.fullName || 'Avatar'}
                      className="object-cover w-full h-full"
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 flex items-center justify-center text-xl font-black text-white select-none"
                    style={{
                      background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #10B981 0%, #0ea5e9 100%)',
                      display: avatarUrl ? 'none' : 'flex',
                    }}
                  >
                    {initials}
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[8px] text-white font-black uppercase tracking-widest">Upload</span>
                      </>
                    )}
                  </div>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
              <p className={`text-[9px] font-bold mt-2 transition-colors ${themeClasses.text.tertiary}`}>Change Profile Image</p>
            </div>

            {/* Fields Column */}
            <form onSubmit={handleSaveProfile} className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold outline-none transition-all cursor-not-allowed ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.tertiary}`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold outline-none transition-all cursor-not-allowed ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.tertiary}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileForm.fullName}
                    onChange={handleProfileChange}
                    placeholder="Enter your full name"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary} focus:border-emerald-500`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={profileForm.contactNumber}
                    onChange={handleProfileChange}
                    placeholder="Enter contact number"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary} focus:border-emerald-500`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                  Business / Office Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={profileForm.address}
                  onChange={handleProfileChange}
                  placeholder="Enter office address"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary} focus:border-emerald-500`}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl shadow-xs transition-colors cursor-pointer ${themeClasses.button.primary}`}
                >
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* Password Card */}
        <div className={`rounded-[20px] p-6 border space-y-6 transition-colors ${themeClasses.card}`}>
          <h2 className={`text-sm font-black uppercase tracking-wider pb-3 border-b ${themeClasses.border.primary} ${themeClasses.text.primary}`}>
            Change Password
          </h2>

          {passwordMsg && (
            <div className={`p-3.5 rounded-xl text-xs font-bold border transition-colors ${
              passwordMsg.type === 'success' ? themeClasses.status.success : themeClasses.status.danger
            }`}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                required
                className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary} focus:border-emerald-500`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary} focus:border-emerald-500`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors ${themeClasses.text.tertiary}`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary} focus:border-emerald-500`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl shadow-xs transition-colors cursor-pointer ${themeClasses.button.primary}`}
              >
                {passwordLoading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </AdminLayout>
  );
}



