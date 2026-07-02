import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { ENDPOINTS } from '../../../services/apiClient';
import { setAccessToken } from '../../../utils/storage';
import { useCustomer } from '../../../context/CustomerContext';
import { GOOGLE_CLIENT_ID } from '../../../config/env';

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  primary:       '#16A34A',
  primaryDark:   '#15803D',
  panelBg:       '#F0FDF4',
  panelBorder:   '#DCFCE7',
  surface:       '#FFFFFF',
  border:        '#D1D5DB',
  text:          '#111827',
  textSub:       '#6B7280',
  textMuted:     '#9CA3AF',
  error:         '#DC2626',
  shadow:        '0 20px 60px rgba(0,0,0,0.18)',
};

/* ─── Validation helpers ─────────────────────────────────────────────────── */
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* ─── Right-panel copy, keyed by tab ─────────────────────────────────────── */
const PANEL_COPY = {
  login: {
    heading: 'Why sign in?',
    items: [
      { icon: 'tag',    title: 'Best offers and discounts', desc: 'Get access to exclusive deals and member-only pricing.' },
      { icon: 'heart',  title: 'Save your wishlist',        desc: 'Keep track of items you love and buy them later.' },
      { icon: 'box',    title: 'Track your orders',         desc: 'Get real-time delivery updates on every purchase.' },
      { icon: 'bolt',   title: 'Faster checkout',           desc: 'Skip retyping your details every time you shop.' },
    ],
  },
  register: {
    heading: 'Why join Jhapcham?',
    items: [
      { icon: 'tag',    title: 'Welcome discount',   desc: 'New members get exclusive first-order pricing.' },
      { icon: 'heart',  title: 'Personalised picks', desc: 'Recommendations tuned to what you actually shop for.' },
      { icon: 'box',    title: 'One-tap reordering', desc: 'Buy your favorites again in a single click.' },
      { icon: 'bolt',   title: 'Priority support',   desc: 'Get help faster from verified sellers and our team.' },
    ],
  },
  forgot: {
    heading: 'Your account is safe',
    items: [
      { icon: 'lock',   title: 'Verified reset',      desc: 'We confirm it\u2019s you before anything changes.' },
      { icon: 'shield', title: 'Encrypted in transit', desc: 'Your new password is never stored in plain text.' },
      { icon: 'box',    title: 'Orders stay intact',   desc: 'Resetting your password never touches your order history.' },
      { icon: 'bolt',   title: 'Back in minutes',      desc: 'Most resets take under two minutes to complete.' },
    ],
  },
};

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
  const [rememberMe,  setRememberMe]  = useState(true);

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

  const initTimeoutRef  = useRef(null);
  const navigate        = useNavigate();
  const { refreshUser } = useCustomer();

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
      setSuccess('Password reset! Redirecting to sign in\u2026');
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

  const panel = PANEL_COPY[tab] || PANEL_COPY.login;

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Sign in to Jhapcham"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(17,24,39,0.55)', backdropFilter: 'blur(6px)',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        .lm-tab {
          padding: 4px 0 10px; margin-right: 24px;
          font-size: 14px; font-weight: 600;
          border: none; background: transparent; cursor: pointer;
          color: #6B7280; border-bottom: 2px solid transparent;
          transition: color 0.18s, border-color 0.18s;
          font-family: inherit; display: flex; align-items: center; gap: 6px;
        }
        .lm-tab:hover:not(.active) { color: #374151; }
        .lm-tab.active { color: #16A34A; border-bottom-color: #16A34A; }
        .lm-tab:focus-visible { outline: 2px solid #16A34A; outline-offset: 2px; }

        .lm-input {
          width: 100%; padding: 12px 14px;
          border-radius: 8px; border: 1.5px solid #D1D5DB;
          font-size: 14px; color: #111827;
          outline: none; font-family: inherit;
          box-sizing: border-box; background: #FFFFFF;
          transition: border-color 0.18s, box-shadow 0.18s;
          min-height: 46px;
        }
        .lm-input::placeholder { color: #9CA3AF; }
        .lm-input:focus { border-color: #16A34A; box-shadow: 0 0 0 3px rgba(22,163,74,0.12); }
        .lm-input.state-success { border-color: #16A34A; padding-right: 40px; }
        .lm-input.state-error { border-color: #EF4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); padding-right: 40px; }
        .lm-input.state-error:focus { border-color: #EF4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
        .lm-pw-input { padding-right: 48px !important; }

        .lm-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .lm-field-error { display: flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; color: #DC2626; margin-top: 5px; line-height: 1.3; }

        .lm-btn-primary {
          width: 100%; padding: 13px;
          border-radius: 8px; border: none;
          background: #16A34A; color: white;
          font-size: 14.5px; font-weight: 700; cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          min-height: 48px; font-family: inherit;
        }
        .lm-btn-primary:hover:not(:disabled) { background: #15803D; }
        .lm-btn-primary:active:not(:disabled) { transform: scale(0.99); }
        .lm-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .lm-btn-primary:focus-visible { outline: 2px solid #16A34A; outline-offset: 3px; }

        .lm-social-row { display: flex; gap: 10px; }
        .lm-btn-social {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 10px; border-radius: 8px; border: 1.5px solid #E5E7EB;
          background: #FFFFFF; cursor: pointer; font-size: 13px; font-weight: 600; color: #111827;
          transition: background 0.15s, border-color 0.15s; min-height: 46px; font-family: inherit;
        }
        .lm-btn-social:hover { background: #F9FAFB; border-color: #D1D5DB; }
        .lm-btn-social:disabled { opacity: 0.55; cursor: not-allowed; }
        .lm-btn-social:focus-visible { outline: 2px solid #16A34A; outline-offset: 2px; }

        .lm-eye {
          position: absolute; right: 0; top: 0; bottom: 0; width: 46px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; color: #6B7280;
          transition: color 0.15s;
        }
        .lm-eye:hover { color: #111827; }
        .lm-eye:focus-visible { outline: 2px solid #16A34A; outline-offset: -3px; }

        .lm-divider { display: flex; align-items: center; gap: 10px; margin: 18px 0; }
        .lm-divider::before, .lm-divider::after { content: ''; flex: 1; height: 1px; background: #E5E7EB; }
        .lm-divider span { font-size: 12px; font-weight: 500; color: #9CA3AF; white-space: nowrap; }

        .lm-alert { border-radius: 8px; padding: 10px 12px; font-size: 13px; font-weight: 600; margin-bottom: 14px; display: flex; align-items: flex-start; gap: 8px; line-height: 1.45; }
        .lm-alert-error   { background:#FEF2F2; border:1px solid #FECACA; color:#B91C1C; }
        .lm-alert-success { background:#F0FDF4; border:1px solid #BBF7D0; color:#15803D; }

        .lm-link { color: #16A34A; font-weight: 700; cursor: pointer; text-decoration: none; background: none; border: none; font-family: inherit; font-size: inherit; padding: 0; }
        .lm-link:hover { text-decoration: underline; }
        .lm-link:focus-visible { outline: 2px solid #16A34A; border-radius: 2px; }

        .lm-checkbox { width: 16px; height: 16px; accent-color: #16A34A; cursor: pointer; }

        @keyframes lm-spin { to { transform: rotate(360deg); } }
        .lm-spin { animation: lm-spin 0.85s linear infinite; display: block; flex-shrink: 0; }

        .lm-otp-input { text-align: center !important; font-size: 22px !important; letter-spacing: 10px !important; font-weight: 800 !important; }

        .lm-close {
          width: 34px; height: 34px; min-width: 34px; border-radius: 50%;
          border: 1px solid #E5E7EB; background: #FFFFFF; color: #6B7280; cursor: pointer;
          font-size: 15px; display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .lm-close:hover { background: #F3F4F6; color: #111827; }
        .lm-close:focus-visible { outline: 2px solid #16A34A; outline-offset: 2px; }

        .lm-benefit { display: flex; gap: 12px; align-items: flex-start; }
        .lm-benefit-icon {
          width: 34px; height: 34px; min-width: 34px; border-radius: 9px;
          background: #FFFFFF; border: 1px solid #DCFCE7;
          display: flex; align-items: center; justify-content: center; color: #16A34A;
        }

        @media (max-width: 720px) {
          .lm-right { display: none !important; }
          .lm-card { max-width: 440px !important; }
        }
      `}</style>

      <div
        className="lm-card"
        style={{
          background: T.surface, width: '100%', maxWidth: 860,
          borderRadius: 20, boxShadow: T.shadow, overflow: 'hidden',
          display: 'flex', position: 'relative', maxHeight: '92vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="lm-close" aria-label="Close sign-in dialog" onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>✕</button>

        {/* ── Left: form ── */}
        <div style={{ flex: '1 1 55%', padding: '32px 36px', overflowY: 'auto' }}>
          {tab !== 'forgot' && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: '0 0 6px' }}>
                {tab === 'login' ? 'Welcome back!' : 'Create your account'}
              </h2>
              <p style={{ fontSize: 13.5, color: T.textSub, margin: '0 0 20px' }}>
                {tab === 'login' ? 'Sign in to your account and continue shopping.' : 'Join Jhapcham and start shopping in minutes.'}
              </p>

              <div role="tablist" aria-label="Authentication options" style={{ display: 'flex', borderBottom: `1.5px solid ${T.border}`, marginBottom: 22 }}>
                {[{ key: 'login', label: 'Login' }, { key: 'register', label: 'Register' }].map(({ key, label }) => (
                  <button
                    key={key} className={`lm-tab${tab === key ? ' active' : ''}`}
                    role="tab" aria-selected={tab === key}
                    onClick={() => switchTab(key)}
                  >
                    {key === 'login' ? <UserIcon /> : <UserPlusIcon />} {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'forgot' && (
            <button type="button" className="lm-link" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20 }} onClick={() => switchTab('login')}>
              ← Back to sign in
            </button>
          )}

          {error   && <div className="lm-alert lm-alert-error"  role="alert"><AlertIcon type="error"  />{error}</div>}
          {success && <div className="lm-alert lm-alert-success" role="status"><AlertIcon type="success"/>{success}</div>}

          {/* ══════════════════ SIGN IN ══════════════════ */}
          {tab === 'login' && (
            <>
              <form onSubmit={handleLogin} noValidate>
                <div style={{ marginBottom: 14 }}>
                  <label className="lm-label" htmlFor="login-id">Email or Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="login-id"
                      className={`lm-input${loginErrors.identifier ? ' state-error' : loginTouched.identifier && loginData.identifier ? ' state-success' : ''}`}
                      type="text" name="identifier" autoComplete="username"
                      placeholder="Enter email or phone number"
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

                <div style={{ marginBottom: 10 }}>
                  <label className="lm-label" htmlFor="login-pw">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="login-pw"
                      className={`lm-input lm-pw-input${loginErrors.password ? ' state-error' : loginTouched.password && loginData.password ? ' state-success' : ''}`}
                      type={showLoginPw ? 'text' : 'password'}
                      name="current-password" autoComplete="current-password"
                      placeholder="Enter your password"
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

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: T.text, cursor: 'pointer' }}>
                    <input type="checkbox" className="lm-checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                    Remember me
                  </label>
                  <button type="button" className="lm-link" style={{ fontSize: 13 }} onClick={() => switchTab('forgot')}>
                    Forgot password?
                  </button>
                </div>

                <button className="lm-btn-primary" type="submit" disabled={loading}>
                  {loading ? <><Spinner />Signing in…</> : 'Login'}
                </button>
              </form>

              <div className="lm-divider"><span>वा इमेलबाट जारी राख्नुहोस्</span></div>

              <div className="lm-social-row">
                {googleLoading ? (
                  <LoadingRow text="Signing in…" />
                ) : (
                  <button type="button" className="lm-btn-social" aria-label="Continue with Google" onClick={triggerGoogleSignIn}>
                    <GoogleSVG /> Google
                  </button>
                )}
              </div>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: T.textSub }}>
                Don't have an account?{' '}
                <button type="button" className="lm-link" onClick={() => switchTab('register')}>Register now</button>
              </p>
            </>
          )}

          {/* ══════════════════ REGISTER ══════════════════ */}
          {tab === 'register' && (
            <>
              <form onSubmit={handleRegister} noValidate>
                <ValidatedField
                  id="reg-name" label="Full Name" type="text"
                  autoComplete="name" placeholder="Aarav Sharma"
                  value={regData.fullName}
                  onChange={e => setRegData(p => ({ ...p, fullName: e.target.value }))}
                  onBlur={() => setRegTouched(p => ({ ...p, fullName: true }))}
                  touched={regTouched.fullName} error={regErrors.fullName}
                  errId="err-reg-name"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                  <div>
                    <label className="lm-label" htmlFor="reg-pw">Password</label>
                    <div style={{ position: 'relative' }}>
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
                    <label className="lm-label" htmlFor="reg-cnf">Confirm</label>
                    <div style={{ position: 'relative' }}>
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

                <button className="lm-btn-primary" type="submit" disabled={loading} style={{ marginTop: 18 }}>
                  {loading ? <><Spinner />Creating account…</> : 'Create Free Account'}
                </button>
              </form>

              <div className="lm-divider"><span>वा इमेलबाट जारी राख्नुहोस्</span></div>

              <div className="lm-social-row">
                {googleLoading ? (
                  <LoadingRow text="Signing in…" />
                ) : (
                  <button type="button" className="lm-btn-social" aria-label="Continue with Google" onClick={triggerGoogleSignIn}>
                    <GoogleSVG /> Google
                  </button>
                )}
              </div>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: T.textSub }}>
                Already have an account?{' '}
                <button type="button" className="lm-link" onClick={() => switchTab('login')}>Sign in</button>
              </p>
            </>
          )}

          {/* ══════════════════ FORGOT PASSWORD ══════════════════ */}
          {tab === 'forgot' && (
            <>
              {forgotStep === 'email' ? (
                <>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 6px' }}>Reset password</h2>
                  <p style={{ fontSize: 13.5, color: T.textSub, margin: '0 0 22px' }}>
                    Enter your registered email and we'll send you a one-time code.
                  </p>
                  <form onSubmit={handleForgotSend} noValidate>
                    <div style={{ marginBottom: 16 }}>
                      <label className="lm-label" htmlFor="forgot-email">Registered Email</label>
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
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 6px' }}>Check your email</h2>
                  <p style={{ fontSize: 13.5, color: T.textSub, margin: '0 0 22px' }}>
                    We sent a 6-digit code to <strong style={{ color: T.text }}>{forgotEmail}</strong>. Enter it below.
                  </p>
                  <form onSubmit={handleForgotReset} noValidate>
                    <div style={{ marginBottom: 14 }}>
                      <label className="lm-label" htmlFor="forgot-otp">6-Digit Code</label>
                      <input id="forgot-otp" className="lm-input lm-otp-input" type="text" required
                        placeholder="000000" maxLength={6}
                        value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                      <div>
                        <label className="lm-label" htmlFor="fp-pw">New Password</label>
                        <div style={{ position: 'relative' }}>
                          <input id="fp-pw" className="lm-input lm-pw-input" type={showForgotPw ? 'text' : 'password'}
                            required autoComplete="new-password" placeholder="New password"
                            value={forgotNewPw} onChange={e => setForgotNewPw(e.target.value)} />
                          <EyeBtn id="toggle-fp-pw" show={showForgotPw} onToggle={() => setShowForgotPw(v => !v)} />
                        </div>
                      </div>
                      <div>
                        <label className="lm-label" htmlFor="fp-cnf">Confirm</label>
                        <div style={{ position: 'relative' }}>
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
                  <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: T.textSub }}>
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

        {/* ── Right: illustration + benefits ── */}
        <div className="lm-right" style={{ flex: '1 1 45%', background: T.panelBg, padding: '36px 32px', display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${T.panelBorder}` }}>
          <BagIllustration />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: '24px 0 16px' }}>{panel.heading}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {panel.items.map((item) => (
              <div className="lm-benefit" key={item.title}>
                <div className="lm-benefit-icon"><BenefitIcon name={item.icon} /></div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
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
      <label className="lm-label" htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
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
      ? <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      : <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
    }
  </button>
);

/* ─── Tiny helpers ──────────────────────────────────────────────────────── */
const Spinner = () => (
  <svg className="lm-spin" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const AlertIcon = ({ type }) => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
    {type === 'error'
      ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
      : <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
  </svg>
);

const MiniErrorIcon = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const SuccessIcon = () => (
  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
    <svg width="16" height="16" fill="none" stroke="#16A34A" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  </div>
);

const ErrorIndicatorIcon = () => (
  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
    <svg width="15" height="15" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  </div>
);

const LoadingRow = ({ text }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '12px 16px', borderRadius: 8, border: '1.5px solid #E5E7EB',
    fontSize: 13, fontWeight: 600, color: '#374151', width: '100%', background: '#FAFAFA', boxSizing: 'border-box',
  }}>
    <Spinner />{text}
  </div>
);

const UserIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/>
  </svg>
);

const UserPlusIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="9" cy="8" r="4"/><path d="M2 21v-1a7 7 0 0 1 11.5-5.33"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
  </svg>
);

/* ─── Benefit icons (right panel) ────────────────────────────────────────── */
const BenefitIcon = ({ name }) => {
  const common = { width: 17, height: 17, fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24' };
  switch (name) {
    case 'tag':    return <svg {...common}><path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.59-4.59a2 2 0 0 0 0-2.83z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>;
    case 'heart':  return <svg {...common}><path d="M20.8 4.6c-1.9-1.6-4.7-1.4-6.4.4L12 7.4l-2.4-2.4c-1.7-1.8-4.5-2-6.4-.4-2.1 1.8-2.2 5-.4 6.9L12 21l9.2-9.5c1.8-1.9 1.7-5.1-.4-6.9z"/></svg>;
    case 'box':    return <svg {...common}><path d="M21 8 12 3 3 8l9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>;
    case 'bolt':   return <svg {...common}><polygon points="13 2 3 14 11 14 11 22 21 10 13 10 13 2"/></svg>;
    case 'lock':   return <svg {...common}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case 'shield': return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    default:       return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
};

const GoogleSVG = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ─── Original bag + gift illustration for the right panel ──────────────── */
const BagIllustration = () => (
  <svg width="100%" height="150" viewBox="0 0 280 150" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="140" cy="80" r="58" fill="#DCFCE7"/>
    <rect x="58" y="72" width="34" height="30" rx="4" fill="#FFFFFF" stroke="#BBF7D0" strokeWidth="2" transform="rotate(-8 75 87)"/>
    <rect x="188" y="70" width="34" height="30" rx="4" fill="#FFFFFF" stroke="#BBF7D0" strokeWidth="2" transform="rotate(8 205 85)"/>
    <rect x="102" y="55" width="76" height="68" rx="8" fill="#16A34A"/>
    <path d="M118 55 v-10 a22 22 0 0 1 44 0 v10" stroke="#15803D" strokeWidth="6" fill="none" strokeLinecap="round"/>
    <circle cx="140" cy="88" r="16" fill="#FFFFFF" fillOpacity="0.18"/>
    <path d="M133 82h16l-2 12h-12z" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    <circle cx="135" cy="98" r="1.6" fill="#FFFFFF"/>
    <circle cx="145" cy="98" r="1.6" fill="#FFFFFF"/>
    <circle cx="60" cy="42" r="3" fill="#86EFAC"/>
    <circle cx="222" cy="48" r="2.2" fill="#86EFAC"/>
    <circle cx="205" cy="30" r="2" fill="#86EFAC"/>
  </svg>
);

export default LoginModal;
