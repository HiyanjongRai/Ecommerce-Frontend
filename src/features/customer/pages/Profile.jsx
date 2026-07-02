import React, { useEffect, useState } from 'react';
import { useCustomer } from '../contexts/CustomerContext';
import { updateProfile, uploadProfileImage } from '../services/customerService';
import { BASE_URL } from '../../../shared/api/apiClient';
import { Camera, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';

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
  const [showResetModal, setShowResetModal] = useState(false);
  const [avatarCacheBust, setAvatarCacheBust] = useState(Date.now());
  const userId = user?.id;

  const avatarUrl = resolveAvatarUrl(user, avatarCacheBust);

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
    <div className="font-sans animate-in fade-in duration-300">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">View Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your personal information and account details.</p>
        </div>
        <button
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-2 bg-white border border-gray-300 hover:border-slate-800 text-slate-700 hover:text-slate-900 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all"
        >
          <Lock className="w-4 h-4" /> Change Password
        </button>
      </div>

      {msg && (
        <div className={`p-4 border rounded-xl text-sm font-semibold mb-6 flex items-start gap-3 ${
          msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          <span className="text-base leading-none">{msg.type === 'success' ? '✓' : '✕'}</span>
          <div>{msg.text}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Personal Information */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
          <h2 className="text-base font-bold text-slate-900 mb-6">Personal Information</h2>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6">
            {/* Avatar uploader */}
            <div>
              <label className="cursor-pointer relative group inline-block">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden relative bg-gray-100 border border-gray-200">
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
                  <div
                    className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white select-none"
                    style={{
                      background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                      display: avatarUrl ? 'none' : 'flex',
                    }}
                  >
                    {initials}
                  </div>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? (
                      <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
                <span className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <Camera className="w-4 h-4 text-slate-600" />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              <p className="text-[11px] text-slate-400 mt-3">JPG, PNG or GIF. Max size of 2MB.</p>
              <label className="mt-3 inline-flex items-center justify-center w-full border border-[#16A34A] text-[#16A34A] hover:bg-green-50 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors">
                {uploading ? 'Uploading…' : 'Upload New Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
                <input
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-green-500 transition-colors"
                  name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
                <input
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-green-500 transition-colors"
                  name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Username</label>
                  <input
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-green-500 transition-colors"
                    name="username" value={form.username} onChange={handleChange} placeholder="Username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number</label>
                  <input
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-green-500 transition-colors"
                    name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="98XXXXXXXX"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#16A34A] hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Account Details sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Account Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Role</span>
                <span className="font-semibold text-slate-900">{user?.role || '—'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                <span className="text-slate-500">Account Status</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${user?.status === 'ACTIVE' ? 'bg-green-50 text-[#16A34A] border border-green-100' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {user?.status || 'UNKNOWN'}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                <span className="text-slate-500">Email Verified</span>
                <span className="flex items-center gap-1 text-[#16A34A] font-semibold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Account Security</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Keep your account secure by resetting your password via your registered email address.
            </p>
            <button
              onClick={() => setShowResetModal(true)}
              className="w-full text-sm font-semibold py-2.5 border border-gray-300 hover:border-slate-800 rounded-lg transition-all text-slate-700 hover:text-slate-900"
            >
              Reset Password via Email
            </button>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowResetModal(false); }}
        >
          <ResetPasswordModal onClose={() => setShowResetModal(false)} userEmail={user?.email} />
        </div>
      )}
    </div>
  );
};

const ResetPasswordModal = ({ onClose, userEmail }) => {
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
    <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
        <button onClick={onClose} className="text-slate-400 hover:scale-110 active:scale-95 transition-transform text-xl">✕</button>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-semibold text-red-600 mb-5 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-xs font-semibold text-[#16A34A] mb-5">
            {success}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp}>
            <div className="mb-5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:border-green-500 bg-gray-50/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#16A34A] hover:bg-green-700 disabled:opacity-70 text-white text-xs font-bold uppercase tracking-wide py-3.5 rounded-xl transition-colors"
            >
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">OTP Code</label>
              <input
                type="text"
                required
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-4 border border-gray-300 rounded-xl text-2xl font-bold tracking-[0.3em] text-center outline-none focus:border-green-500 bg-gray-50/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-3 pr-10 border border-gray-300 rounded-xl text-sm outline-none focus:border-green-500 bg-gray-50/50 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-3 pr-10 border border-gray-300 rounded-xl text-sm outline-none focus:border-green-500 bg-gray-50/50 transition-colors"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#16A34A] hover:bg-green-700 disabled:opacity-70 text-white text-xs font-bold uppercase tracking-wide py-3.5 rounded-xl transition-colors mb-3"
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
              className="w-full border border-gray-300 hover:bg-gray-50 text-slate-600 text-xs font-bold uppercase tracking-wide py-3.5 rounded-xl transition-colors"
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