import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { ENDPOINTS } from '../../../shared/api/apiClient';
import { setAccessToken } from '../../../shared/api/authStorage';
import { useCustomer } from '../../customer/contexts/CustomerContext';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '983073986551-a49ce7tnjh29fccqnqp1v92ma4i3b3ba.apps.googleusercontent.com';

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  primary:       '#16A34A',
  primaryDark:   '#15803D',
  primaryRing:   'rgba(22,163,74,0.15)',
  surface:       '#FFFFFF',
  bg:            '#F9FAFB',
  border:        '#D1D5DB',          // gray-300 — neutral default
  borderFocus:   '#16A34A',
  borderSuccess: '#16A34A',
  borderError:   '#EF4444',
  text:          '#111827',
  textSub:       '#6B7280',
  textMuted:     '#9CA3AF',
  error:         '#DC2626',
  errorBg:       '#FEF2F2',
  errorBorder:   '#FECACA',
  successText:   '#15803D',
  shadow:        '0 20px 60px rgba(0,0,0,0.18)',
};

/* ─── Validation helpers ─────────────────────────────────────────────────── */
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* ─── Main Modal ─────────────────────────────────────────────────────────── */
const LoginModal = ({ isOpen, onClose, initialTab = 'login' }) => {
  const [tab,        setTab]        = useState(initialTab);
  const [forgotStep, setForgotStep] = useState('email');

  /* form data */
  const [loginData,   setLoginData]   = useState({ identifier: '', password: '' });
  const [regData,     setRegData]     = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp,   setForgotOtp]   = useState('');
  const [forgotNewPw, setForgotNewPw] = useState('');
  const [forgotCnfPw, setForgotCnfPw] = useState('');

  /* touched — for inline validation */
  const [loginTouched, setLoginTouched] = useState({ identifier: false, password: false });
  const [regTouched,   setRegTouched]   = useState({ fullName: false, username: false, email: false, password: false, confirmPassword: false });

  /* password visibility */
  const [showLoginPw,   setShowLoginPw]   = useState(false);
  const [showRegPw,     setShowRegPw]     = useState(false);
  const [showRegCnf,    setShowRegCnf]    = useState(false);
  const [showForgotPw,  setShowForgotPw]  = useState(false);
  const [showForgotCnf, setShowForgotCnf] = useState(false);

  /* async */
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState(null);
  const [success,       setSuccess]       = useState(null);

  const googleInitialized = useRef(false);
  const initTimeoutRef    = useRef(null);
  const navigate          = useNavigate();
  const { refreshUser }   = useCustomer();

  /* ── Direct Google OAuth 2.0 Popup + postMessage flow ── */
  const triggerGoogleSignIn = () => {
    setGoogleLoading(true); setError(null);
    const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const params = new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      redirect_uri:  `${window.location.origin}/auth/google/callback`,
      response_type: 'id_token',
      scope:         'email profile openid',
      nonce,
      prompt:        'select_account',
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    const w = 500, h = 620;
    const left = Math.round((window.screen.width - w) / 2);
    const top = Math.round((window.screen.height - h) / 2);
    const popup = window.open(
      url,
      'google-oauth-popup',
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup || popup.closed) {
      setError('Popup was blocked. Please allow popups for this site and try again.');
      setGoogleLoading(false);
      return;
    }

    const pollClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollClosed);
        setGoogleLoading(prev => { if (prev) { setError(null); } return false; });
      }
    }, 500);
  };

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'GOOGLE_OAUTH_RESULT') return;

      const { idToken, error } = event.data;
      if (error) {
        setError('Google sign-in was cancelled or failed.');
        setGoogleLoading(false);
        return;
      }
      if (idToken) {
        handleGoogleCredential({ credential: idToken });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!isOpen) { clearTimeout(initTimeoutRef.current); return; }
    setTab(initialTab);
    setError(null); setSuccess(null);
    setLoginTouched({ identifier: false, password: false });
    setRegTouched({ fullName: false, username: false, email: false, password: false, confirmPassword: false });
  }, [isOpen, initialTab]);

  /* ── Auth success ── */
  const doAuthSuccess = async (data) => {
    if (!data?.accessToken) return;
    setAccessToken(data.accessToken);
    await refreshUser();
    const role = data.role;
    if (role === 'SELLER')      navigate('/seller/dashboard');
    else if (role === 'ADMIN')  navigate('/admin/dashboard');
    else navigate(role === 'CUSTOMER' ? '/customer/dashboard' : '/');
    onClose();
  };

  /* ── Google credential callback ── */
  const handleGoogleCredential = async (response) => {
    setGoogleLoading(true); setError(null);
    try {
      const res = await apiClient.post('/auth/google', { credential: response.credential, role: 'CUSTOMER' });
      doAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally { setGoogleLoading(false); }
  };

  /* ── Email login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginTouched({ identifier: true, password: true });
    if (!loginData.identifier || !loginData.password) return;
    setLoading(true); setError(null);
    try {
      const res = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        usernameOrEmail: loginData.identifier,
        password:        loginData.password,
      });
      doAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect email or password. Please try again.');
    } finally { setLoading(false); }
  };

  /* ── Registration ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegTouched({ fullName: true, username: true, email: true, password: true, confirmPassword: true });
    if (!regData.fullName || !regData.username || !regData.email || !regData.password || !regData.confirmPassword) return;
    if (regData.password !== regData.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await apiClient.post('/auth/register/customer', {
        fullName: regData.fullName, username: regData.username,
        email:    regData.email,    password: regData.password,
      });
      doAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  /* ── Forgot: send OTP ── */
  const handleForgotSend = async (e) => {
    e.preventDefault(); setLoading(true); setError(null); setSuccess(null);
    try {
      await apiClient.post('/auth/forgot-password', { email: forgotEmail });
      setForgotStep('otp');
      setSuccess('Code sent! Check your inbox and enter the 6-digit code below.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send code. Please try again.');
    } finally { setLoading(false); }
  };

  /* ── Forgot: reset ── */
  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (forgotNewPw !== forgotCnfPw) { setError('Passwords do not match.'); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      await apiClient.post('/auth/reset-password', { email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPw });
      setSuccess('Password reset! Redirecting to sign in…');
      setTimeout(() => {
        switchTab('login');
        setForgotEmail(''); setForgotStep('email');
        setForgotOtp(''); setForgotNewPw(''); setForgotCnfPw('');
        setSuccess(null);
      }, 2200);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password. Please try again.');
    } finally { setLoading(false); }
  };

  const switchTab = (t) => {
    setTab(t); setError(null); setSuccess(null); setForgotStep('email');
    setLoginTouched({ identifier: false, password: false });
    setRegTouched({ fullName: false, username: false, email: false, password: false, confirmPassword: false });
  };

  if (!isOpen) return null;

  /* ── Inline validation errors ── */
  const loginErrors = {
    identifier: loginTouched.identifier && !loginData.identifier ? 'Email or username is required.' : null,
    password:   loginTouched.password   && !loginData.password   ? 'Password is required.' : null,
  };
  const regErrors = {
    fullName:        regTouched.fullName        && !regData.fullName        ? 'Full name is required.' : null,
    username:        regTouched.username        && !regData.username        ? 'Username is required.' : null,
    email:           regTouched.email           && !regData.email           ? 'Email is required.'
                   : regTouched.email           && regData.email && !isValidEmail(regData.email) ? 'Enter a valid email address.' : null,
    password:        regTouched.password        && !regData.password        ? 'Password is required.'
                   : regTouched.password        && regData.password && regData.password.length < 8 ? 'Minimum 8 characters.' : null,
    confirmPassword: regTouched.confirmPassword && !regData.confirmPassword ? 'Please confirm your password.'
                   : regTouched.confirmPassword && regData.confirmPassword && regData.confirmPassword !== regData.password ? 'Passwords do not match.' : null,
  };

  /* ── Input state helper ── */
  const getInputState = (value, touched, errorMsg) => {
    if (!touched)    return 'default';
    if (errorMsg)    return 'error';
    if (value)       return 'success';
    return 'default';
  };

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Sign in to Jhapcham"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(10px)',
        padding: '12px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        /* ── Entrance ── */
        @keyframes lm-rise {
          from { opacity:0; transform:scale(0.95) translateY(20px); }
          to   { opacity:1; transform:scale(1)    translateY(0); }
        }

        /* ── Tabs ── */
        .lm-tab {
          flex: 1; padding: 13px 0;
          font-size: 13px; font-weight: 600; letter-spacing: 0.2px;
          border: none; background: transparent; cursor: pointer;
          color: #6B7280; border-bottom: 2px solid transparent;
          transition: color 0.18s, border-color 0.18s, background 0.18s;
          font-family: inherit;
        }
        .lm-tab:hover:not(.active) { color: #374151; background: rgba(0,0,0,0.02); }
        .lm-tab.active { color: #16A34A; border-bottom-color: #16A34A; font-weight: 700; }
        .lm-tab:focus-visible {
          outline: 2px solid #16A34A; outline-offset: -2px;
        }

        /* ── Base input ── */
        .lm-input {
          width: 100%; padding: 12px 14px;
          border-radius: 10px; border: 1.5px solid #D1D5DB;
          font-size: 14px; color: #111827;
          outline: none; font-family: inherit;
          box-sizing: border-box;
          background: #FFFFFF;              /* always white in default */
          transition: border-color 0.18s, box-shadow 0.18s;
          min-height: 46px;
        }
        .lm-input::placeholder { color: #9CA3AF; }

        /* Focus — green border, NO fill */
        .lm-input:focus {
          border-color: #16A34A;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.12);
          background: #FFFFFF;
        }

        /* Success state */
        .lm-input.state-success {
          border-color: #16A34A;
          background: #FFFFFF;
          padding-right: 40px;
        }

        /* Error state */
        .lm-input.state-error {
          border-color: #EF4444;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
          padding-right: 40px;
        }
        .lm-input.state-error:focus {
          border-color: #EF4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.12);
        }

        /* Password input with eye icon space */
        .lm-pw-input { padding-right: 48px !important; }

        /* ── Labels ── */
        .lm-label {
          display: block; font-size: 12px; font-weight: 700;
          letter-spacing: 0.3px; color: #374151;
          margin-bottom: 6px;
        }

        /* ── Field error text ── */
        .lm-field-error {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 600; color: #DC2626;
          margin-top: 5px; line-height: 1.3;
        }

        /* ── Primary button ── */
        .lm-btn-primary {
          width: 100%; padding: 14px;
          border-radius: 10px; border: none;
          background: linear-gradient(135deg, #16A34A 0%, #15803D 100%);
          color: white; font-size: 14px; font-weight: 700;
          letter-spacing: 0.3px; cursor: pointer;
          box-shadow: 0 4px 16px rgba(22,163,74,0.26);
          transition: transform 0.14s, box-shadow 0.14s, opacity 0.14s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          min-height: 48px; font-family: inherit;
        }
        .lm-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(22,163,74,0.34);
        }
        .lm-btn-primary:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 3px 8px rgba(22,163,74,0.2);
        }
        .lm-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .lm-btn-primary:focus-visible { outline: 2px solid #16A34A; outline-offset: 3px; }

        /* ── Google custom button ── */
        .lm-btn-google {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 12px 16px;
          border-radius: 10px; border: 1.5px solid #D1D5DB;
          background: #FFFFFF; cursor: pointer;
          font-size: 13.5px; font-weight: 600; color: #111827;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
          min-height: 48px; font-family: inherit;
          letter-spacing: 0.1px;
        }
        .lm-btn-google:hover {
          background: #F9FAFB; border-color: #9CA3AF;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .lm-btn-google:active { background: #F3F4F6; }
        .lm-btn-google:focus-visible { outline: 2px solid #16A34A; outline-offset: 2px; }
        .lm-btn-google:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── Eye toggle — 44x44 touch target ── */
        .lm-eye {
          position: absolute; right: 0; top: 0; bottom: 0;
          width: 46px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          color: #6B7280; border-radius: 0 10px 10px 0;
          transition: color 0.15s, background 0.15s;
          touch-action: manipulation;
        }
        .lm-eye:hover { color: #111827; background: rgba(0,0,0,0.04); }
        .lm-eye:active { background: rgba(0,0,0,0.07); }
        .lm-eye:focus-visible {
          outline: 2px solid #16A34A;
          outline-offset: -3px; border-radius: 0 10px 10px 0;
        }

        /* ── Divider — reduced dominance ── */
        .lm-divider {
          display: flex; align-items: center; gap: 10px; margin: 14px 0;
        }
        .lm-divider::before, .lm-divider::after {
          content: ''; flex: 1; height: 1px; background: #E5E7EB;
        }
        .lm-divider span {
          font-size: 11px; font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.5px; color: #9CA3AF;
          white-space: nowrap;
        }

        /* ── Alerts ── */
        .lm-alert {
          border-radius: 8px; padding: 10px 12px;
          font-size: 13px; font-weight: 600; margin-bottom: 12px;
          display: flex; align-items: flex-start; gap: 8px; line-height: 1.45;
        }
        .lm-alert-error   { background:#FEF2F2; border:1px solid #FECACA; color:#B91C1C; }
        .lm-alert-success { background:#F0FDF4; border:1px solid #BBF7D0; color:#15803D; }

        /* ── Link ── */
        .lm-link {
          color: #16A34A; font-weight: 700; cursor: pointer;
          text-decoration: none; transition: color 0.15s;
          background: none; border: none; font-family: inherit;
          font-size: inherit; padding: 0;
        }
        .lm-link:hover { color: #15803D; text-decoration: underline; }
        .lm-link:focus-visible { outline: 2px solid #16A34A; border-radius: 2px; }

        /* ── Trust bar ── */
        .lm-trust {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; padding: 10px 0 0;
          border-top: 1px solid #F3F4F6; margin-top: 14px;
          flex-wrap: wrap;
        }
        .lm-trust-item {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.3px;
          text-transform: uppercase; color: #6B7280;
        }
        .lm-trust-item svg { color: #16A34A; flex-shrink: 0; }

        /* ── Spinner ── */
        @keyframes lm-spin { to { transform: rotate(360deg); } }
        .lm-spin { animation: lm-spin 0.85s linear infinite; display: block; flex-shrink: 0; }

        /* ── OTP field ── */
        .lm-otp-input {
          text-align: center !important;
          font-size: 22px !important;
          letter-spacing: 10px !important;
          font-weight: 800 !important;
        }

        /* ── Close button ── */
        .lm-close {
          width: 34px; height: 34px; min-width: 34px;
          border-radius: 50%; border: 1px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.15); backdropFilter: blur(12px);
          color: white; cursor: pointer; font-size: 15px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
          line-height: 1; position: relative; z-index: 1;
        }
        .lm-close:hover {
          background: rgba(255,255,255,0.28);
          border-color: rgba(255,255,255,0.5);
        }
        .lm-close:active { transform: scale(0.94); }
        .lm-close:focus-visible {
          outline: 2px solid white; outline-offset: 2px;
        }

        /* ── Responsive ── */
        @media (max-width: 400px) {
          .lm-label { font-size: 11px; }
          .lm-input, .lm-btn-primary, .lm-btn-google { font-size: 13px; }
        }
      `}</style>

      {/* ── Card ── */}
      <div
        style={{
          background: T.surface,
          width: '100%', maxWidth: 420,
          borderRadius: 20,
          boxShadow: T.shadow,
          overflow: 'hidden',
          animation: 'lm-rise 0.26s cubic-bezier(0.34,1.4,0.64,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header — compact (−15% height) ── */}
        <div style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #16A34A 100%)',
          padding: '15px 20px 14px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* decorative blobs */}
          <div style={{ position:'absolute', top:-44, right:-44, width:150, height:150, background:'rgba(255,255,255,0.06)', borderRadius:'50%', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-50, left:-16, width:110, height:110, background:'rgba(255,255,255,0.04)', borderRadius:'50%', pointerEvents:'none' }} />

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', zIndex:1 }}>
            {/* Logo + brand */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:36, height:36, borderRadius:9,
                background:'rgba(255,255,255,0.18)', backdropFilter:'blur(12px)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:15, fontWeight:900, color:'white',
                border:'1px solid rgba(255,255,255,0.22)', flexShrink:0,
              }}>J</div>
              <div>
                <div style={{ fontSize:15, fontWeight:900, color:'white', letterSpacing:1.4, lineHeight:1 }}>JHAPCHAM</div>
                <div style={{ fontSize:8.5, color:'rgba(255,255,255,0.68)', letterSpacing:1.8, textTransform:'uppercase', marginTop:2.5, fontWeight:600 }}>Nepal eCommerce</div>
              </div>
            </div>

            {/* Close button */}
            <button
              className="lm-close"
              aria-label="Close sign-in dialog"
              onClick={onClose}
            >✕</button>
          </div>

          {/* Contextual tagline */}
          <div style={{ position:'relative', zIndex:1, marginTop:10, color:'rgba(255,255,255,0.65)', fontSize:11.5, fontWeight:500, lineHeight:1.45 }}>
            {tab === 'login'    && 'Welcome back — sign in to your account.'}
            {tab === 'register' && 'Create your free account and start shopping.'}
            {tab === 'forgot'   && 'Recover access to your account securely.'}
          </div>
        </div>

        {/* ── Tab bar — equal width, 2 tabs only ── */}
        {tab !== 'forgot' && (
          <div
            role="tablist"
            aria-label="Authentication options"
            style={{
              display:'flex',
              borderBottom:`1.5px solid ${T.border}`,
              background:'#FAFAFA',
            }}
          >
            {[
              { key:'login',    label:'Sign In' },
              { key:'register', label:'Create Account' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`lm-tab${tab === key ? ' active' : ''}`}
                role="tab"
                aria-selected={tab === key}
                aria-controls={`panel-${key}`}
                onClick={() => switchTab(key)}
              >{label}</button>
            ))}
          </div>
        )}

        {/* ── Body ── */}
        <div
          id={`panel-${tab}`}
          role="tabpanel"
          style={{ padding:'20px 20px 22px' }}
        >

          {/* Global alerts */}
          {error   && <div className="lm-alert lm-alert-error"  role="alert"><AlertIcon type="error"  />{error}</div>}
          {success && <div className="lm-alert lm-alert-success" role="status"><AlertIcon type="success"/>{success}</div>}

          {/* ══════════════════ SIGN IN ══════════════════ */}
          {tab === 'login' && (
            <>
              {/* Google button — custom, Nepali text */}
              {googleLoading
                ? <LoadingRow text="Signing in with Google…" />
                : (
                  <button
                    type="button"
                    className="lm-btn-google"
                    aria-label="Continue with Google"
                    onClick={triggerGoogleSignIn}
                  >
                    <GoogleSVG />
                    <span>Google मार्फत जारी राख्नुहोस्</span>
                  </button>
                )
              }

              <div className="lm-divider"><span>वा इमेलबाट</span></div>

              <form onSubmit={handleLogin} noValidate>
                {/* Email / Username */}
                <div style={{ marginBottom:12 }}>
                  <label className="lm-label" htmlFor="login-id">
                    Email or Username<Req />
                  </label>
                  <div style={{ position:'relative' }}>
                    <input
                      id="login-id"
                      className={`lm-input${loginErrors.identifier ? ' state-error' : loginTouched.identifier && loginData.identifier ? ' state-success' : ''}`}
                      type="text" name="identifier" autoComplete="username"
                      placeholder="Email or username"
                      value={loginData.identifier}
                      onChange={e => setLoginData(p => ({ ...p, identifier: e.target.value }))}
                      onBlur={() => setLoginTouched(p => ({ ...p, identifier: true }))}
                      aria-invalid={!!loginErrors.identifier}
                      aria-describedby={loginErrors.identifier ? 'err-login-id' : undefined}
                    />
                    {loginTouched.identifier && loginData.identifier && !loginErrors.identifier && <SuccessIcon />}
                    {loginErrors.identifier && <ErrorIndicatorIcon />}
                  </div>
                  {loginErrors.identifier && <p className="lm-field-error" id="err-login-id" role="alert"><MiniErrorIcon />{loginErrors.identifier}</p>}
                </div>

                {/* Password */}
                <div style={{ marginBottom:6 }}>
                  <label className="lm-label" htmlFor="login-pw">
                    Password<Req />
                  </label>
                  <div style={{ position:'relative' }}>
                    <input
                      id="login-pw"
                      className={`lm-input lm-pw-input${loginErrors.password ? ' state-error' : loginTouched.password && loginData.password ? ' state-success' : ''}`}
                      type={showLoginPw ? 'text' : 'password'}
                      name="current-password" autoComplete="current-password"
                      placeholder="Your password"
                      value={loginData.password}
                      onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                      onBlur={() => setLoginTouched(p => ({ ...p, password: true }))}
                      aria-invalid={!!loginErrors.password}
                      aria-describedby={loginErrors.password ? 'err-login-pw' : undefined}
                    />
                    <EyeBtn id="toggle-login-pw" show={showLoginPw} onToggle={() => setShowLoginPw(v => !v)} />
                  </div>
                  {loginErrors.password && <p className="lm-field-error" id="err-login-pw" role="alert"><MiniErrorIcon />{loginErrors.password}</p>}
                </div>

                <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
                  <button type="button" className="lm-link" style={{ fontSize:12 }}
                    onClick={() => switchTab('forgot')}>
                    Forgot password?
                  </button>
                </div>

                <button className="lm-btn-primary" type="submit" disabled={loading}>
                  {loading ? <><Spinner />Signing in…</> : 'Sign In'}
                </button>
              </form>

              <TrustBar />

              <p style={{ textAlign:'center', marginTop:12, fontSize:12, color:T.textSub, margin:'12px 0 0' }}>
                No account yet?{' '}
                <button type="button" className="lm-link" onClick={() => switchTab('register')}>
                  Create one free
                </button>
              </p>
            </>
          )}

          {/* ══════════════════ REGISTER ══════════════════ */}
          {tab === 'register' && (
            <>
              {/* Google — Nepali */}
              <button
                type="button"
                className="lm-btn-google"
                aria-label="Continue with Google"
                onClick={triggerGoogleSignIn}
              >
                <GoogleSVG />
                <span>Google मार्फत जारी राख्नुहोस्</span>
              </button>

              <div className="lm-divider"><span>वा इमेलबाट</span></div>

              <form onSubmit={handleRegister} noValidate>
                {/* Full Name */}
                <ValidatedField
                  id="reg-name" label="Full Name" type="text"
                  autoComplete="name" placeholder="Aarav Sharma"
                  value={regData.fullName}
                  onChange={e => setRegData(p => ({ ...p, fullName: e.target.value }))}
                  onBlur={() => setRegTouched(p => ({ ...p, fullName: true }))}
                  touched={regTouched.fullName} error={regErrors.fullName}
                  errId="err-reg-name"
                />

                {/* Username + Email */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
                  <ValidatedField
                    id="reg-user" label="Username" type="text"
                    autoComplete="off" placeholder="aaravsharma"
                    value={regData.username}
                    onChange={e => setRegData(p => ({ ...p, username: e.target.value }))}
                    onBlur={() => setRegTouched(p => ({ ...p, username: true }))}
                    touched={regTouched.username} error={regErrors.username}
                    errId="err-reg-user"
                  />
                  <ValidatedField
                    id="reg-email" label="Email" type="email"
                    autoComplete="email" placeholder="you@email.com"
                    value={regData.email}
                    onChange={e => setRegData(p => ({ ...p, email: e.target.value }))}
                    onBlur={() => setRegTouched(p => ({ ...p, email: true }))}
                    touched={regTouched.email} error={regErrors.email}
                    errId="err-reg-email"
                  />
                </div>

                {/* Password + Confirm */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
                  <div>
                    <label className="lm-label" htmlFor="reg-pw">Password<Req /></label>
                    <div style={{ position:'relative' }}>
                      <input
                        id="reg-pw"
                        className={`lm-input lm-pw-input${regErrors.password ? ' state-error' : regTouched.password && regData.password && !regErrors.password ? ' state-success' : ''}`}
                        type={showRegPw ? 'text' : 'password'} autoComplete="new-password" placeholder="Min 8 chars"
                        value={regData.password}
                        onChange={e => setRegData(p => ({ ...p, password: e.target.value }))}
                        onBlur={() => setRegTouched(p => ({ ...p, password: true }))}
                        aria-invalid={!!regErrors.password} aria-describedby={regErrors.password ? 'err-reg-pw' : undefined}
                      />
                      <EyeBtn id="toggle-reg-pw" show={showRegPw} onToggle={() => setShowRegPw(v => !v)} />
                    </div>
                    {regErrors.password && <p className="lm-field-error" id="err-reg-pw" role="alert"><MiniErrorIcon />{regErrors.password}</p>}
                  </div>
                  <div>
                    <label className="lm-label" htmlFor="reg-cnf">Confirm<Req /></label>
                    <div style={{ position:'relative' }}>
                      <input
                        id="reg-cnf"
                        className={`lm-input lm-pw-input${regErrors.confirmPassword ? ' state-error' : regTouched.confirmPassword && regData.confirmPassword && !regErrors.confirmPassword ? ' state-success' : ''}`}
                        type={showRegCnf ? 'text' : 'password'} autoComplete="new-password" placeholder="Repeat"
                        value={regData.confirmPassword}
                        onChange={e => setRegData(p => ({ ...p, confirmPassword: e.target.value }))}
                        onBlur={() => setRegTouched(p => ({ ...p, confirmPassword: true }))}
                        aria-invalid={!!regErrors.confirmPassword} aria-describedby={regErrors.confirmPassword ? 'err-reg-cnf' : undefined}
                      />
                      <EyeBtn id="toggle-reg-cnf" show={showRegCnf} onToggle={() => setShowRegCnf(v => !v)} />
                    </div>
                    {regErrors.confirmPassword && <p className="lm-field-error" id="err-reg-cnf" role="alert"><MiniErrorIcon />{regErrors.confirmPassword}</p>}
                  </div>
                </div>

                <button className="lm-btn-primary" type="submit" disabled={loading} style={{ marginTop:16 }}>
                  {loading ? <><Spinner />Creating account…</> : 'Create Free Account'}
                </button>
              </form>

              <TrustBar />

              <p style={{ textAlign:'center', marginTop:12, fontSize:12, color:T.textSub }}>
                Already have an account?{' '}
                <button type="button" className="lm-link" onClick={() => switchTab('login')}>Sign in</button>
              </p>
            </>
          )}

          {/* ══════════════════ FORGOT PASSWORD ══════════════════ */}
          {tab === 'forgot' && (
            <>
              <button type="button" className="lm-link"
                style={{ fontSize:12, display:'flex', alignItems:'center', gap:4, marginBottom:16 }}
                onClick={() => switchTab('login')}>
                ← Back to Sign In
              </button>

              {forgotStep === 'email' ? (
                <>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:18 }}>
                    <div style={{ width:52, height:52, borderRadius:14, background:'#F0FDF4', border:'1.5px solid #BBF7D0', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                      <LockSVG />
                    </div>
                    <div style={{ fontSize:16, fontWeight:800, color:T.text, marginBottom:4 }}>Reset Password</div>
                    <div style={{ fontSize:12, color:T.textSub, textAlign:'center', lineHeight:1.6, maxWidth:270 }}>
                      Enter your registered email and we'll send you a one-time code.
                    </div>
                  </div>
                  <form onSubmit={handleForgotSend} noValidate>
                    <div style={{ marginBottom:14 }}>
                      <label className="lm-label" htmlFor="forgot-email">Registered Email<Req /></label>
                      <input id="forgot-email" className="lm-input" type="email" required
                        autoComplete="email" placeholder="you@email.com"
                        value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                    </div>
                    <button className="lm-btn-primary" type="submit" disabled={loading}>
                      {loading ? <><Spinner />Sending code…</> : 'Send Reset Code'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:18 }}>
                    <div style={{ fontSize:38, marginBottom:8 }}>✉️</div>
                    <div style={{ fontSize:16, fontWeight:800, color:T.text, marginBottom:4 }}>Check Your Email</div>
                    <div style={{ fontSize:12, color:T.textSub, textAlign:'center', lineHeight:1.6, maxWidth:290 }}>
                      We sent a 6-digit code to <strong style={{ color:T.text }}>{forgotEmail}</strong>. Enter it below.
                    </div>
                  </div>
                  <form onSubmit={handleForgotReset} noValidate>
                    <div style={{ marginBottom:12 }}>
                      <label className="lm-label" htmlFor="forgot-otp">6-Digit Code<Req /></label>
                      <input id="forgot-otp" className="lm-input lm-otp-input" type="text" required
                        placeholder="000000" maxLength={6}
                        value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                      <div>
                        <label className="lm-label" htmlFor="fp-pw">New Password<Req /></label>
                        <div style={{ position:'relative' }}>
                          <input id="fp-pw" className="lm-input lm-pw-input" type={showForgotPw ? 'text' : 'password'}
                            required autoComplete="new-password" placeholder="New password"
                            value={forgotNewPw} onChange={e => setForgotNewPw(e.target.value)} />
                          <EyeBtn id="toggle-fp-pw" show={showForgotPw} onToggle={() => setShowForgotPw(v => !v)} />
                        </div>
                      </div>
                      <div>
                        <label className="lm-label" htmlFor="fp-cnf">Confirm<Req /></label>
                        <div style={{ position:'relative' }}>
                          <input id="fp-cnf" className="lm-input lm-pw-input" type={showForgotCnf ? 'text' : 'password'}
                            required autoComplete="new-password" placeholder="Confirm"
                            value={forgotCnfPw} onChange={e => setForgotCnfPw(e.target.value)} />
                          <EyeBtn id="toggle-fp-cnf" show={showForgotCnf} onToggle={() => setShowForgotCnf(v => !v)} />
                        </div>
                      </div>
                    </div>
                    <button className="lm-btn-primary" type="submit" disabled={loading}>
                      {loading ? <><Spinner />Resetting…</> : 'Reset Password'}
                    </button>
                  </form>
                  <p style={{ textAlign:'center', marginTop:12, fontSize:12, color:T.textSub }}>
                    Didn't receive the code?{' '}
                    <button type="button" className="lm-link" onClick={() => { setForgotStep('email'); setError(null); setSuccess(null); }}>
                      Try again
                    </button>
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Reusable field with validation ────────────────────────────────────── */
const ValidatedField = ({ id, label, type, autoComplete, placeholder, value, onChange, onBlur, touched, error, errId }) => {
  const stateClass = error ? ' state-error' : (touched && value && !error ? ' state-success' : '');
  return (
    <div>
      <label className="lm-label" htmlFor={id}>{label}<Req /></label>
      <div style={{ position:'relative' }}>
        <input
          id={id} className={`lm-input${stateClass}`} type={type}
          autoComplete={autoComplete} placeholder={placeholder}
          value={value} onChange={onChange} onBlur={onBlur}
          aria-invalid={!!error} aria-describedby={error ? errId : undefined}
        />
        {touched && value && !error && <SuccessIcon />}
        {error && <ErrorIndicatorIcon />}
      </div>
      {error && <p className="lm-field-error" id={errId} role="alert"><MiniErrorIcon />{error}</p>}
    </div>
  );
};

/* ─── Eye toggle button ─────────────────────────────────────────────────── */
const EyeBtn = ({ id, show, onToggle }) => (
  <button type="button" id={id} className="lm-eye"
    aria-label={show ? 'Hide password' : 'Show password'}
    onClick={onToggle}>
    {show
      ? <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      : <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
    }
  </button>
);

/* ─── Trust bar ─────────────────────────────────────────────────────────── */
const TrustBar = () => (
  <div className="lm-trust" aria-label="Security trust signals">
    <span className="lm-trust-item">
      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>SSL Secured
    </span>
    <span style={{ color:'#D1D5DB' }}>·</span>
    <span className="lm-trust-item">
      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>Secure Login
    </span>
    <span style={{ color:'#D1D5DB' }}>·</span>
    <span className="lm-trust-item">
      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>Trusted Platform
    </span>
  </div>
);

/* ─── Tiny helpers ──────────────────────────────────────────────────────── */
const Req     = () => <span style={{ color:'#DC2626', marginLeft:2 }} aria-hidden="true">*</span>;
const Spinner = () => (
  <svg className="lm-spin" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const AlertIcon = ({ type }) => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink:0, marginTop:1 }}>
    {type === 'error'
      ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
      : <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
  </svg>
);

const MiniErrorIcon = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* Success icon — overlaid inside input, right side */
const SuccessIcon = () => (
  <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
    <svg width="16" height="16" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  </div>
);

/* Error indicator icon inside input (for non-password fields) */
const ErrorIndicatorIcon = () => (
  <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
    <svg width="15" height="15" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  </div>
);

const LoadingRow = ({ text }) => (
  <div style={{
    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
    padding:'13px 16px', borderRadius:10, border:'1.5px solid #E5E7EB',
    fontSize:13, fontWeight:600, color:'#374151', width:'100%', background:'#FAFAFA', boxSizing:'border-box',
  }}>
    <Spinner />{text}
  </div>
);

const LockSVG = () => (
  <svg width="22" height="22" fill="none" stroke="#16A34A" strokeWidth="1.8" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const GoogleSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default LoginModal;
