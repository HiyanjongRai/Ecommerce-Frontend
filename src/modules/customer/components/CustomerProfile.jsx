import React, { useEffect, useState } from 'react';
import { useCustomer } from '../contexts/CustomerContext';
import { updateProfile, uploadProfileImage } from '../services/customerService';
import { BASE_URL } from '../../../shared/api/apiClient';

/** Resolve the profile image URL from any of the known field names the API might return */
const resolveAvatarUrl = (user, cacheBust) => {
  const raw =
    user?.profileImagePath ||
    user?.profileImage ||
    user?.image ||
    user?.avatar ||
    null;
  if (!raw) return null;
  const base = raw.startsWith('http') ? raw : `${BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
  return cacheBust ? `${base}?t=${cacheBust}` : base;
};

const CustomerProfile = () => {
  const { user, setUser } = useCustomer();
  const [form, setForm]   = useState({ fullName: '', email: '', username: '', contactNumber: '' });
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]     = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [avatarCacheBust, setAvatarCacheBust] = useState(Date.now());
  const userId = user?.id;

  const avatarUrl = resolveAvatarUrl(user, avatarCacheBust);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(localStorage.getItem('customer-theme') === 'dark');
    };
    checkDarkMode();
    window.addEventListener('storage', checkDarkMode);
    return () => window.removeEventListener('storage', checkDarkMode);
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        fullName:      user?.fullName || '',
        email:         user?.email || '',
        username:      user?.username || '',
        contactNumber: user.contactNumber || '',
      });
    }
  }, [user]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true); setMsg(null);
    try {
      const res = await updateProfile(userId, form);
      setUser(res.data);
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
    setSaving(false);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!userId) return;
    setUploading(true);
    setMsg(null);
    try {
      const res = await uploadProfileImage(userId, file);
      setUser(res.data);
      setAvatarCacheBust(Date.now()); // force img src refresh
      setMsg({ type: 'success', text: 'Profile image updated!' });
    } catch {
      setMsg({ type: 'error', text: 'Image upload failed. Please try again.' });
    }
    setUploading(false);
    // reset file input so the same file can be re-selected
    e.target.value = '';
  };

  const initials = user?.fullName
    ? user?.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300 font-sans">
      {/* Avatar & security summary */}
      <div className="space-y-6">
        <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} border rounded-2xl p-8 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]`}>
          {/* ── Avatar upload ── */}
          <label className="cursor-pointer relative group inline-block mb-6">
            <div className="relative w-32 h-32 mx-auto">
              {/* Outer ring that pulses while uploading */}
              <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                uploading
                  ? 'ring-4 ring-[#10B981] ring-offset-4 animate-pulse'
                  : 'ring-2 ring-offset-4 ' + (isDarkMode ? 'ring-gray-700' : 'ring-emerald-100')
              }`} />

              {/* Avatar image or gradient-initials fallback */}
              <div className="w-32 h-32 rounded-full overflow-hidden relative shadow-sm">
                {avatarUrl ? (
                  <img
                    key={avatarCacheBust}
                    src={avatarUrl}
                    alt={user?.fullName || user?.username || 'avatar'}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                    }}
                  />
                ) : null}

                {/* Gradient initials — shown when no image or image errors */}
                <div
                  className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white select-none"
                  style={{
                    background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                    display: avatarUrl ? 'none' : 'flex',
                  }}
                  id="avatar-initials-fallback"
                >
                  {initials}
                </div>

                {/* Hover overlay with camera icon */}
                <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 backdrop-blur-sm transition-all duration-200">
                  {uploading ? (
                    <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <>
                      {/* Camera icon */}
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[10px] text-white font-bold uppercase tracking-widest mt-1">Change</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>

          <h3 className={`text-lg font-black uppercase tracking-tight mb-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {user?.fullName || user?.username}
          </h3>
          <p className={`text-xs font-semibold mb-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{user?.email}</p>

          <div className="flex justify-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${isDarkMode ? 'bg-emerald-900/50 border-emerald-700/50 text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-[#10B981]'}`}>
              {user?.role}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${user?.status === 'ACTIVE' ? (isDarkMode ? 'bg-emerald-900/50 border-emerald-700/50 text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-[#10B981]') : (isDarkMode ? 'bg-red-900 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-600')}`}>
              {user?.status}
            </span>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} border rounded-2xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]`}>
          <h3 className={`text-xs font-black uppercase tracking-wider pb-4 border-b mb-4 ${isDarkMode ? 'text-gray-100 border-gray-700' : 'text-gray-800 border-gray-100'}`}>
            Account Security
          </h3>
          <p className={`text-xs font-semibold mb-5 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Keep your account secure by resetting your password via your registered email address.
          </p>
          <button 
            onClick={() => setShowResetModal(true)}
            className={`w-full text-xs font-black uppercase tracking-wider py-3 border rounded-xl transition-all duration-200 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700' : 'bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 border-gray-200 shadow-sm'}`}>
            Reset Password via Email
          </button>
        </div>
      </div>

      {/* Profile form */}
      <div className={`lg:col-span-2 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} border rounded-2xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]`}>
        <div className={`pb-5 border-b mb-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-[22px] font-black tracking-tight leading-tight ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Account Details
          </h3>
          <p className={`text-xs font-semibold mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your personal information and contact details.</p>
        </div>

        {msg && (
          <div
            className={`
              p-4 border rounded-xl text-xs font-bold mb-6 flex items-start gap-3 shadow-sm
              ${msg.type === 'success'
                ? isDarkMode ? 'bg-emerald-900/50 border-emerald-700/50 text-emerald-300' : 'bg-[#e6f7ec] border-[#10B981]/20 text-[#10B981]'
                : isDarkMode ? 'bg-red-900 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-600'
              }
            `}
          >
            <span className="text-base leading-none">{msg.type === 'success' ? '✓' : '✕'}</span>
            <div>{msg.text}</div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Full Name</label>
              <input
                className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all duration-200 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-[#10B981]' : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:border-[#10B981] focus:bg-white focus:ring-4 focus:ring-emerald-50'}`}
                name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name"
              />
            </div>

            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
              <input
                className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all duration-200 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-[#10B981]' : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:border-[#10B981] focus:bg-white focus:ring-4 focus:ring-emerald-50'}`}
                name="username" value={form.username} onChange={handleChange} placeholder="Username"
              />
            </div>

            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</label>
              <input
                className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all duration-200 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-[#10B981]' : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:border-[#10B981] focus:bg-white focus:ring-4 focus:ring-emerald-50'}`}
                name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email address"
              />
            </div>

            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone Number</label>
              <input
                className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all duration-200 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-[#10B981]' : 'bg-gray-50/50 border-gray-200 text-gray-900 focus:border-[#10B981] focus:bg-white focus:ring-4 focus:ring-emerald-50'}`}
                name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="98XXXXXXXX"
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="w-full text-xs font-black uppercase tracking-wider py-4 rounded-xl transition-all duration-200 bg-[#10B981] hover:bg-[#059669] text-white shadow-sm hover:shadow-md active:scale-[0.98]"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowResetModal(false); }}
        >
          <ResetPasswordModal isDarkMode={isDarkMode} onClose={() => setShowResetModal(false)} userEmail={user?.email} />
        </div>
      )}
    </div>
  );
};

const ResetPasswordModal = ({ isDarkMode, onClose, userEmail }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(userEmail || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to send OTP');
      setSuccess('✅ OTP sent to your email');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      if (!res.ok) throw new Error('Failed to reset password');
      setSuccess('✅ Password reset successfully!');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: isDarkMode ? '#1f2937' : '#ffffff',
        width: '100%',
        maxWidth: 420,
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        overflow: 'hidden',
      }}
      className="animate-in zoom-in-95 duration-200"
    >
      <div
        style={{
          background: isDarkMode ? '#111827' : '#ffffff',
          padding: '24px 28px',
          borderBottom: `1px solid ${isDarkMode ? '#374151' : '#f3f4f6'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 900, color: isDarkMode ? '#f3f4f6' : '#111827', margin: 0, letterSpacing: '-0.02em' }}>
          Reset Password
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: isDarkMode ? '#9ca3af' : '#9ca3af',
          }}
          className="hover:scale-110 active:scale-95 transition-transform"
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '28px' }}>
        {error && (
          <div
            style={{
              background: isDarkMode ? '#7f1d1d' : '#fef2f2',
              border: `1px solid ${isDarkMode ? '#991b1b' : '#fee2e2'}`,
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: isDarkMode ? '#fca5a5' : '#ef4444',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{fontSize: '16px'}}>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div
            style={{
              background: isDarkMode ? '#064e3b' : '#ecfdf5',
              border: `1px solid ${isDarkMode ? '#047857' : '#d1fae5'}`,
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: isDarkMode ? '#86efac' : '#10b981',
              marginBottom: 20,
            }}
          >
            {success}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, marginBottom: 8, color: isDarkMode ? '#9ca3af' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: 12,
                  fontSize: 14,
                  outline: 'none',
                  background: isDarkMode ? '#1f2937' : '#f9fafb',
                  color: isDarkMode ? '#f3f4f6' : '#1f2937',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
                }}
                onFocus={(e) => { if (!isDarkMode) e.target.style.borderColor = '#10B981'; }}
                onBlur={(e) => { if (!isDarkMode) e.target.style.borderColor = '#e5e7eb'; }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: 'none',
                background: '#10b981',
                color: 'white',
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#059669'}
              onMouseOut={(e) => e.target.style.background = '#10b981'}
            >
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, marginBottom: 8, color: isDarkMode ? '#9ca3af' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                OTP Code
              </label>
              <input
                type="text"
                required
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={{
                  width: '100%',
                  padding: '16px',
                  border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: 12,
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: '0.3em',
                  textAlign: 'center',
                  outline: 'none',
                  background: isDarkMode ? '#1f2937' : '#f9fafb',
                  color: isDarkMode ? '#f3f4f6' : '#1f2937',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { if (!isDarkMode) e.target.style.borderColor = '#10B981'; }}
                onBlur={(e) => { if (!isDarkMode) e.target.style.borderColor = '#e5e7eb'; }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 900, marginBottom: 8, color: isDarkMode ? '#9ca3af' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      paddingRight: 40,
                      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: 12,
                      fontSize: 14,
                      outline: 'none',
                      background: isDarkMode ? '#1f2937' : '#f9fafb',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { if (!isDarkMode) e.target.style.borderColor = '#10B981'; }}
                    onBlur={(e) => { if (!isDarkMode) e.target.style.borderColor = '#e5e7eb'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isDarkMode ? '#9ca3af' : '#9ca3af',
                      padding: 0,
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 900, marginBottom: 8, color: isDarkMode ? '#9ca3af' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      paddingRight: 40,
                      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: 12,
                      fontSize: 14,
                      outline: 'none',
                      background: isDarkMode ? '#1f2937' : '#f9fafb',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { if (!isDarkMode) e.target.style.borderColor = '#10B981'; }}
                    onBlur={(e) => { if (!isDarkMode) e.target.style.borderColor = '#e5e7eb'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isDarkMode ? '#9ca3af' : '#9ca3af',
                      padding: 0,
                    }}
                  >
                    {showConfirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: 'none',
                background: '#10b981',
                color: 'white',
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
                marginBottom: 12,
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#059669'}
              onMouseOut={(e) => e.target.style.background = '#10b981'}
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                setError(null);
                setSuccess(null);
              }}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
                background: 'transparent',
                color: isDarkMode ? '#d1d5db' : '#6b7280',
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = isDarkMode ? '#374151' : '#f9fafb'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              ← Back to Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
