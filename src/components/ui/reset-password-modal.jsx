import React, { useState } from 'react';
import apiClient from '../../services/apiConfig';

export default function ResetPasswordModal({ isDarkMode, onClose, userEmail }) {
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
      await apiClient.post('/auth/forgot-password', { email });
      setSuccess('✅ OTP sent to your email');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP');
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
      await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      setSuccess('✅ Password reset successfully!');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: isDarkMode ? '#1f2937' : '#ffffff',
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          fontFamily: '"Segoe UI", "Roboto", sans-serif',
        }}
        className="border border-gray-250/30"
      >
        <div
          style={{
            background: isDarkMode ? '#111827' : '#f3f4f6',
            padding: '20px 24px',
            borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 800, color: isDarkMode ? '#f3f4f6' : '#1f2937', margin: 0 }}>
            Reset Password
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                background: isDarkMode ? '#7f1d1d' : '#fee2e2',
                border: `1px solid ${isDarkMode ? '#991b1b' : '#fecaca'}`,
                borderRadius: 8,
                padding: '12px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: isDarkMode ? '#fca5a5' : '#dc2626',
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                background: isDarkMode ? '#064e3b' : '#dcfce7',
                border: `1px solid ${isDarkMode ? '#047857' : '#bbf7d0'}`,
                borderRadius: 8,
                padding: '12px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: isDarkMode ? '#86efac' : '#16a34a',
                marginBottom: 14,
              }}
            >
              {success}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: isDarkMode ? '#d1d5db' : '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                    padding: '12px 14px',
                    border: `1.5px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    background: isDarkMode ? '#111827' : '#fafafa',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: isDarkMode ? '#d1d5db' : '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                    padding: '12px 14px',
                    border: `1.5px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: 8,
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: 4,
                    textAlign: 'center',
                    outline: 'none',
                    background: isDarkMode ? '#111827' : '#fafafa',
                    color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: isDarkMode ? '#d1d5db' : '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                        border: `1.5px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                        background: isDarkMode ? '#111827' : '#fafafa',
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        boxSizing: 'border-box',
                      }}
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
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: isDarkMode ? '#d1d5db' : '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                        border: `1.5px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                        background: isDarkMode ? '#111827' : '#fafafa',
                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                        boxSizing: 'border-box',
                      }}
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
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: loading ? 0.6 : 1,
                  marginBottom: 10,
                }}
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
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: `1.5px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                  background: 'transparent',
                  color: isDarkMode ? '#d1d5db' : '#6b7280',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ← Back to Email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


