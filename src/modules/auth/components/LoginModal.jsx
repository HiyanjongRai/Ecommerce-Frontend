import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { ENDPOINTS } from '../../../shared/api/apiClient';
import { setAccessToken } from '../../../shared/api/authStorage';
import { useCustomer } from '../../customer/contexts/CustomerContext';
import { Facebook } from 'lucide-react';

const GOOGLE_CLIENT_ID = '983073986551-a49ce7tnjh29fccqnqp1v92ma4i3b3ba.apps.googleusercontent.com';

/* ── Helper: store auth response and redirect ─────────────────────────── */
const handleAuthSuccess = (data, onClose) => {
  if (!data?.accessToken) return;
  setAccessToken(data.accessToken);
  // Navigation should be handled by the caller using React Router navigate to avoid full reloads
  onClose();
};

/* ── Main Modal ───────────────────────────────────────────────────────── */
const LoginModal = ({ isOpen, onClose, initialTab = 'login', initialRole = 'CUSTOMER' }) => {
  const [tab, setTab]                   = useState(initialTab);
  const [loginData, setLoginData]       = useState({ identifier: '', password: '', rememberMe: false });
  const [regData, setRegData]           = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotStep, setForgotStep]     = useState('email');
  const [forgotOtp, setForgotOtp]       = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]               = useState(null);
  const [success, setSuccess]           = useState(null);
  const googleBtnRef                    = useRef(null);
  const googleInitialized               = useRef(false);
  const initTimeoutRef                  = useRef(null);

  /* ── Initialize Google button (uses globally loaded script) ── */
  const initGoogle = useCallback(() => {
    if (!window.google || googleInitialized.current || !googleBtnRef.current) return;
    googleInitialized.current = true;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'pill',
        width: googleBtnRef.current.offsetWidth || 340,
        logo_alignment: 'left',
        text: 'signin_with',
      });
    } catch (err) {
      console.error('Google initialization error:', err);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      return;
    }

    setTab(initialTab);
    setError(null);
    setSuccess(null);

    // Use global Google script if already loaded
    if (window.google) {
      // Reinitialize on modal open with debounce
      googleInitialized.current = false;
      initTimeoutRef.current = setTimeout(() => {
        initGoogle();
      }, 100);
    }

    return () => {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
    };
  }, [isOpen, initGoogle, initialTab]);

  /* ── Google credential callback ── */
  const handleGoogleCredential = async (response) => {
    setGoogleLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/auth/google', {
        credential: response.credential,
        role: 'CUSTOMER',
      });
      doAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ── Email Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        usernameOrEmail: loginData.identifier,
        password:        loginData.password,
      });
      doAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Registration ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (regData.password !== regData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post(`/auth/register/customer`, {
        fullName: regData.fullName,
        username: regData.username,
        email:    regData.email,
        password: regData.password,
      });
      doAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();
  const { refreshUser } = useCustomer();

  const doAuthSuccess = async (data) => {
    if (!data?.accessToken) return;
    setAccessToken(data.accessToken);
    // Re-fetch user from server so context state is up-to-date immediately.
    // Without this, user stays as EMPTY_CUSTOMER until next full page load.
    await refreshUser();
    const role = data.role;
    if (role === 'SELLER') navigate('/seller/dashboard');
    else if (role === 'ADMIN') navigate('/admin/dashboard');
    else navigate(role === 'CUSTOMER' ? '/customer/dashboard' : '/');
    onClose();
  };

  /* ── Forgot Password: Send OTP ── */
  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post('/auth/forgot-password', { email: forgotEmail });
      setForgotStep('otp');
      setSuccess('✅ OTP sent to your email. Check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Forgot Password: Reset with OTP ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('❌ Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post('/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword,
      });
      setSuccess('✅ Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        setTab('login');
        setForgotEmail('');
        setForgotStep('email');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: 420,
        borderRadius: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        animation: 'lm-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <style>{`
          @keyframes lm-pop {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          
          .lm-tab {
            flex: 1;
            padding: 12px 0;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            border: none;
            background: transparent;
            cursor: pointer;
            color: #9ca3af;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
          }
          
          .lm-tab.active {
            color: #10b981;
            border-bottom-color: #10b981;
          }
          
          .lm-tab:hover:not(.active) {
            color: #6b7280;
          }
          
          .lm-input {
            width: 100%;
            padding: 13px 16px;
            border-radius: 10px;
            border: 1.5px solid #e5e7eb;
            font-size: 14px;
            outline: none;
            font-family: inherit;
            box-sizing: border-box;
            transition: all 0.3s ease;
            background: #fafafa;
          }
          
          .lm-input:focus {
            border-color: #10b981;
            background: #f0fdf4;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
          }
          
          .lm-label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 8px;
          }
          
          .lm-submit {
            width: 100%;
            padding: 14px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            cursor: pointer;
            margin-top: 8px;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            transition: all 0.3s ease;
          }
          
          .lm-submit:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          }
          
          .lm-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .lm-divider {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 18px 0;
          }
          
          .lm-divider::before,
          .lm-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #e5e7eb;
          }
          
          .lm-divider span {
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #9ca3af;
          }
          
          .lm-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 10px;
            padding: 12px 14px;
            font-size: 13px;
            font-weight: 600;
            color: #dc2626;
            text-align: center;
            margin-bottom: 14px;
          }
          
          .lm-success {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 12px 14px;
            font-size: 13px;
            font-weight: 600;
            color: #16a34a;
            text-align: center;
            margin-bottom: 14px;
          }
          
          .lm-link {
            color: #10b981;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            transition: color 0.2s;
          }
          
          .lm-link:hover {
            color: #059669;
            text-decoration: underline;
          }
          
          .lm-google-wrap {
            min-height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 6px;
          }
          
          .lm-google-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 13px;
            border-radius: 10px;
            border: 1.5px solid #e5e7eb;
            font-size: 13px;
            font-weight: 700;
            color: #374151;
            width: 100%;
            background: #fafafa;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .lm-spinner {
            animation: spin 1s linear infinite;
          }
          
          .lm-role-btn {
            flex: 1;
            padding: 10px 0;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            border: 1.5px solid;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        `}</style>

        {/* Brand Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative background */}
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 40,
              height: 40,
              background: 'rgba(255,255,255,0.25)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 900,
              color: 'white',
              backdropFilter: 'blur(10px)',
            }}>J</div>
            <div>
              <div style={{
                fontSize: 16,
                fontWeight: 900,
                color: 'white',
                letterSpacing: 1,
                lineHeight: 1,
              }}>JHAPCHAM</div>
              <div style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.8)',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginTop: 2,
                fontWeight: 600,
              }}>Nepal eCommerce</div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              zIndex: 1,
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >✕</button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #f3f4f6',
          background: '#fafafa',
          padding: '0 24px',
        }}>
          <button
            className={`lm-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(null); setSuccess(null); }}
          >
            Sign In
          </button>
          <button
            className={`lm-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(null); setSuccess(null); }}
          >
            Register
          </button>
          <button
            className={`lm-tab ${tab === 'forgot' ? 'active' : ''}`}
            onClick={() => { setTab('forgot'); setError(null); setSuccess(null); }}
          >
            Forgot
          </button>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>

          {/* Error / Success banners */}
          {error   && <div className="lm-error">{error}</div>}
          {success && <div className="lm-success">{success}</div>}

          {/* ══════════════ LOGIN TAB ══════════════ */}
          {tab === 'login' && (
            <>
              {/* Google Sign-In Button */}
              <div className="lm-google-wrap">
                {googleLoading ? (
                  <div className="lm-google-loading">
                    <svg className="lm-spinner" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Signing in with Google…
                  </div>
                ) : (
                  <div
                    ref={googleBtnRef}
                    id="google-signin-btn"
                    style={{ width: '100%' }}
                  />
                )}
              </div>

              <div className="lm-divider"><span>or sign in with email</span></div>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 12 }}>
                  <label className="lm-label">Email or Username</label>
                  <input
                    className="lm-input"
                    type="text"
                    name="identifier"
                    required
                    autoComplete="username"
                    placeholder="Enter email or username"
                    value={loginData.identifier}
                    onChange={e => setLoginData(p => ({ ...p, identifier: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label className="lm-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="lm-input"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {showPassword
                        ? <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                  <span
                    className="lm-link"
                    style={{ fontSize: 11, fontWeight: 700 }}
                    onClick={() => { setTab('forgot'); setError(null); }}
                  >
                    Forgot Password?
                  </span>
                </div>

                <button className="lm-submit" type="submit" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#6b7280' }}>
                New to Jhapcham?{' '}
                <span
                  className="lm-link"
                  onClick={() => { setTab('register'); setError(null); }}
                >
                  Create an account
                </span>
              </div>
            </>
          )}

          {/* ══════════════ REGISTER TAB ══════════════ */}
          {tab === 'register' && (
            <>
              {/* Google Register */}
              <button
                type="button"
                onClick={() => {
                  if (window.google) {
                    window.google.accounts.id.prompt();
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '13px 16px',
                  borderRadius: 10,
                  border: '1.5px solid #e5e7eb',
                  background: '#fafafa',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#374151',
                  transition: 'all 0.3s',
                  marginBottom: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fafafa';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <GoogleSVG />
                Continue with Google
              </button>

              <div className="lm-divider"><span>or register with email</span></div>

              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: 12 }}>
                  <label className="lm-label">Full Name</label>
                  <input
                    className="lm-input"
                    type="text"
                    required
                    placeholder="Your full name"
                    value={regData.fullName}
                    onChange={e => setRegData(p => ({ ...p, fullName: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label className="lm-label">Username</label>
                    <input
                      className="lm-input"
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Choose a username"
                      value={regData.username}
                      onChange={e => setRegData(p => ({ ...p, username: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="lm-label">Email</label>
                    <input
                      className="lm-input"
                      type="email"
                      required
                      placeholder="you@email.com"
                      value={regData.email}
                      onChange={e => setRegData(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label className="lm-label">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="lm-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regData.password}
                        onChange={e => setRegData(p => ({ ...p, password: e.target.value }))}
                        style={{ paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        style={{
                          position: 'absolute',
                          right: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#9ca3af',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <EyeIcon show={showPassword} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="lm-label">Confirm</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="lm-input"
                        type={showConfirm ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regData.confirmPassword}
                        onChange={e => setRegData(p => ({ ...p, confirmPassword: e.target.value }))}
                        style={{ paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        style={{
                          position: 'absolute',
                          right: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#9ca3af',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <EyeIcon show={showConfirm} />
                      </button>
                    </div>
                  </div>
                </div>

                <button className="lm-submit" type="submit" disabled={loading}>
                  {loading ? 'Creating Account…' : 'Create Account'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#6b7280' }}>
                Already have an account?{' '}
                <span
                  className="lm-link"
                  onClick={() => { setTab('login'); setError(null); }}
                >
                  Sign in
                </span>
              </div>
            </>
          )}

          {/* ══════════════ FORGOT TAB ══════════════ */}
          {tab === 'forgot' && (
            <>
              {forgotStep === 'email' ? (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                      <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1f2937', marginBottom: 4 }}>Reset Password</div>
                    <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                      Enter your registered email and we'll send you an OTP to reset your password.
                    </div>
                  </div>

                  <form onSubmit={handleForgot}>
                    <div style={{ marginBottom: 14 }}>
                      <label className="lm-label">Registered Email</label>
                      <input
                        className="lm-input"
                        type="email"
                        required
                        placeholder="you@email.com"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                      />
                    </div>

                    <button className="lm-submit" type="submit" disabled={loading}>
                      {loading ? 'Sending OTP…' : 'Send OTP'}
                    </button>
                  </form>

                  <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#6b7280' }}>
                    <span
                      className="lm-link"
                      onClick={() => { setTab('login'); setError(null); setSuccess(null); }}
                    >
                      ← Back to Sign In
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 18 }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>✉️</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1f2937', marginBottom: 4 }}>Verify OTP</div>
                    <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                      We've sent a 6-digit OTP to <strong>{forgotEmail}</strong>. Enter it below along with your new password.
                    </div>
                  </div>

                  <form onSubmit={handleResetPassword}>
                    <div style={{ marginBottom: 12 }}>
                      <label className="lm-label">OTP Code</label>
                      <input
                        className="lm-input"
                        type="text"
                        required
                        placeholder="000000"
                        maxLength="6"
                        value={forgotOtp}
                        onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        style={{ textAlign: 'center', fontSize: 18, letterSpacing: 4, fontWeight: 700 }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      <div>
                        <label className="lm-label">New Password</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            className="lm-input"
                            type={showForgotPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={forgotNewPassword}
                            onChange={e => setForgotNewPassword(e.target.value)}
                            style={{ paddingRight: 44 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(v => !v)}
                            style={{
                              position: 'absolute',
                              right: 14,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#9ca3af',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <EyeIcon show={showForgotPassword} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="lm-label">Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            className="lm-input"
                            type={showForgotConfirm ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={forgotConfirmPassword}
                            onChange={e => setForgotConfirmPassword(e.target.value)}
                            style={{ paddingRight: 44 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowForgotConfirm(v => !v)}
                            style={{
                              position: 'absolute',
                              right: 14,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#9ca3af',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <EyeIcon show={showForgotConfirm} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button className="lm-submit" type="submit" disabled={loading}>
                      {loading ? 'Resetting Password…' : 'Reset Password'}
                    </button>
                  </form>

                  <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#6b7280' }}>
                    <span
                      className="lm-link"
                      onClick={() => {
                        setForgotStep('email');
                        setForgotOtp('');
                        setForgotNewPassword('');
                        setForgotConfirmPassword('');
                        setError(null);
                        setSuccess(null);
                      }}
                    >
                      ← Back to Email
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Tiny helpers ─────────────────────────────────────────────────────── */
const GoogleSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const EyeIcon = ({ show }) => show
  ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

export default LoginModal;

