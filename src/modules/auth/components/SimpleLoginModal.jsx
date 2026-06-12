import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { ENDPOINTS } from '../../../shared/api/apiClient';
import { setAccessToken } from '../../../shared/api/authStorage';
import { useCustomer } from '../../customer/contexts/CustomerContext';

const GOOGLE_CLIENT_ID = '983073986551-a49ce7tnjh29fccqnqp1v92ma4i3b3ba.apps.googleusercontent.com';

const SimpleLoginModal = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState('login');
  const [loginData, setLoginData] = useState({ identifier: '', password: '', rememberMe: false });
  const [regData, setRegData] = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const googleBtnRef = useRef(null);
  const googleInitialized = useRef(false);

  const navigate = useNavigate();
  const { refreshUser } = useCustomer();

  const handleAuthSuccess = async (data) => {
    if (!data.accessToken) return;
    setAccessToken(data.accessToken);
    // Reload user in context immediately — avoids needing a full page refresh.
    await refreshUser();
    const role = data.role;
    if (role === 'SELLER') {
      navigate('/seller/dashboard');
    } else if (role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      navigate('/customer/dashboard');
    }
    onClose();
  };

  const handleGoogleCredential = async (response) => {
    setGoogleLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/auth/google', {
        credential: response.credential,
        role: 'CUSTOMER',
      });
      handleAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const initGoogle = useCallback(() => {
    if (!window.google || googleInitialized.current || !googleBtnRef.current) return;
    googleInitialized.current = true;

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
  }, [handleGoogleCredential]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccess(null);

    if (window.google) {
      initGoogle();
      return;
    }

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogle();
      document.head.appendChild(script);
    }
  }, [isOpen, initGoogle]);

  useEffect(() => {
    if (isOpen && tab === 'login' && window.google) {
      googleInitialized.current = false;
      setTimeout(initGoogle, 100);
    }
  }, [tab, isOpen, initGoogle]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        usernameOrEmail: loginData.identifier,
        password: loginData.password,
      });
      handleAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        email: regData.email,
        password: regData.password,
      });
      handleAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post('/auth/forgot-password', { email: forgotEmail });
      setSuccess('✅ Password reset link sent to your email. Please check your inbox.');
      setTimeout(() => {
        setTab('login');
        setForgotEmail('');
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send reset email. Please try again.');
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
        background: 'rgba(0,0,0,0.5)',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: 480,
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        fontFamily: '"Segoe UI", "Roboto", sans-serif',
      }}>
        <style>{`
          .login-input {
            width: 100%;
            padding: 14px 16px;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
            font-size: 15px;
            outline: none;
            font-family: inherit;
            box-sizing: border-box;
            transition: all 0.2s ease;
            background: #ffffff;
          }
          
          .login-input:focus {
            border-color: #84cc16;
            box-shadow: 0 0 0 3px rgba(132, 204, 22, 0.1);
          }
          
          .login-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
          }
          
          .login-btn {
            width: 100%;
            padding: 14px;
            border-radius: 50px;
            border: none;
            background: #84cc16;
            color: white;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .login-btn:hover:not(:disabled) {
            background: #65a30d;
            transform: translateY(-1px);
          }
          
          .login-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .login-social-btn {
            width: 100%;
            padding: 14px;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
            background: #f9fafb;
            color: #374151;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.2s ease;
          }
          
          .login-social-btn:hover {
            background: #f3f4f6;
            border-color: #d1d5db;
          }

          .login-google-loading {
            width: 100%;
            padding: 14px 16px;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
            background: #f9fafb;
            color: #374151;
            font-size: 15px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            min-height: 52px;
          }
          
          .login-link {
            color: #84cc16;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: color 0.2s;
          }
          
          .login-link:hover {
            color: #65a30d;
            text-decoration: underline;
          }
          
          .login-divider {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 20px 0;
          }
          
          .login-divider::before,
          .login-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #e5e7eb;
          }
          
          .login-divider span {
            font-size: 13px;
            font-weight: 600;
            color: #9ca3af;
            text-transform: uppercase;
          }
          
          .login-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 12px;
            font-size: 14px;
            font-weight: 500;
            color: #dc2626;
            text-align: center;
            margin-bottom: 16px;
          }
          
          .login-success {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 12px;
            font-size: 14px;
            font-weight: 500;
            color: #16a34a;
            text-align: center;
            margin-bottom: 16px;
          }
        `}</style>

        <div style={{ padding: '40px 32px' }}>
          
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8
            }}>
              <div style={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 900,
                color: 'white',
              }}>J</div>
              <span style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#1f2937',
                letterSpacing: -0.5
              }}>JHAPCHAM</span>
            </div>
          </div>

          {/* Tab Title */}
          {tab === 'login' && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>Login</h2>
              <p style={{ fontSize: 15, color: '#6b7280' }}>To get full profile and unlimited searches, please login or register.</p>
            </div>
          )}
          
          {tab === 'register' && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>Create Account</h2>
              <p style={{ fontSize: 15, color: '#6b7280' }}>Join Jhapcham to start shopping today!</p>
            </div>
          )}
          
          {tab === 'forgot' && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>Forgot Password</h2>
              <p style={{ fontSize: 15, color: '#6b7280' }}>Enter your email to receive a password reset link.</p>
            </div>
          )}

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          {/* LOGIN TAB */}
          {tab === 'login' && (
            <>
              <div style={{ marginBottom: 16 }}>
                {googleLoading ? (
                  <div className="login-google-loading">Signing in with Google…</div>
                ) : (
                  <div ref={googleBtnRef} style={{ width: '100%' }} />
                )}
              </div>

              <div className="login-divider"><span>or</span></div>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 16 }}>
                  <label className="login-label">Email <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    className="login-input"
                    type="text"
                    required
                    placeholder="Enter your email"
                    value={loginData.identifier}
                    onChange={e => setLoginData(p => ({ ...p, identifier: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="login-label">Password <span style={{ color: '#dc2626' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="login-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                      style={{ paddingRight: 50 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280',
                        padding: 0,
                      }}
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {showPassword ? (
                          <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                        ) : (
                          <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6b7280', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={loginData.rememberMe}
                      onChange={e => setLoginData(p => ({ ...p, rememberMe: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: '#84cc16', cursor: 'pointer' }}
                    />
                    <span>Remember Me</span>
                  </label>
                  <span
                    className="login-link"
                    style={{ fontSize: 14 }}
                    onClick={() => { setTab('forgot'); setError(null); }}
                  >
                    Forgot Password?
                  </span>
                </div>

                <button className="login-btn" type="submit" disabled={loading}>
                  {loading ? 'Signing in…' : 'Login'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 15, color: '#6b7280' }}>
                Don't have an Account yet?{' '}
                <span
                  className="login-link"
                  onClick={() => { setTab('register'); setError(null); }}
                >
                  Register
                </span>
              </div>
            </>
          )}

          {/* REGISTER TAB */}
          {tab === 'register' && (
            <>
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: 16 }}>
                  <label className="login-label">Full Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    className="login-input"
                    type="text"
                    required
                    placeholder="Your full name"
                    value={regData.fullName}
                    onChange={e => setRegData(p => ({ ...p, fullName: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="login-label">Username <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    className="login-input"
                    type="text"
                    required
                    placeholder="username"
                    value={regData.username}
                    onChange={e => setRegData(p => ({ ...p, username: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="login-label">Email <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    className="login-input"
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={regData.email}
                    onChange={e => setRegData(p => ({ ...p, email: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="login-label">Password <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    className="login-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regData.password}
                    onChange={e => setRegData(p => ({ ...p, password: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label className="login-label">Confirm Password <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    className="login-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regData.confirmPassword}
                    onChange={e => setRegData(p => ({ ...p, confirmPassword: e.target.value }))}
                  />
                </div>

                <button className="login-btn" type="submit" disabled={loading}>
                  {loading ? 'Creating Account…' : 'Create Account'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 15, color: '#6b7280' }}>
                Already have an account?{' '}
                <span
                  className="login-link"
                  onClick={() => { setTab('login'); setError(null); }}
                >
                  Sign in
                </span>
              </div>
            </>
          )}

          {/* FORGOT TAB */}
          {tab === 'forgot' && (
            <>
              <form onSubmit={handleForgot}>
                <div style={{ marginBottom: 24 }}>
                  <label className="login-label">Email Address <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    className="login-input"
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                  />
                </div>

                <button className="login-btn" type="submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 15, color: '#6b7280' }}>
                <span
                  className="login-link"
                  onClick={() => { setTab('login'); setError(null); setSuccess(null); }}
                >
                  ← Back to Login
                </span>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default SimpleLoginModal;
