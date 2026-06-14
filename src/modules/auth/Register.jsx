import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../shared/api/apiConfig';

/* ── Styles (module-level) ──────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  .rg-page {
    min-height: 100vh; background: #f1f5f9;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Inter', sans-serif; padding: 28px 16px;
  }
  .rg-card {
    width: 100%; max-width: 420px;
    background: #fff; border: 1px solid #e5e7eb;
    border-radius: 18px; overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 12px 40px rgba(0,0,0,0.08);
  }
  /* Top strip */
  .rg-strip {
    background: #059669; padding: 14px 22px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .rg-brand { display: flex; align-items: center; gap: 7px; }
  .rg-brand-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.7); }
  .rg-brand-name { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #fff; }
  .rg-steps { display: flex; gap: 5px; }
  .rg-step { height: 3px; width: 26px; border-radius: 3px; background: rgba(255,255,255,0.25); }
  .rg-step.on { background: #fff; }
  /* Body */
  .rg-body { padding: 22px 22px 18px; }
  .rg-title { font-size: 17px; font-weight: 800; color: #111827; letter-spacing: -0.02em; margin: 0 0 2px; }
  .rg-sub   { font-size: 11px; color: #9ca3af; margin: 0 0 18px; }
  /* Field */
  .rg-label { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; margin-bottom: 5px; }
  .rg-wrap  {
    display: flex; align-items: center; gap: 7px;
    background: #f9fafb; border: 1.5px solid #e5e7eb;
    border-radius: 9px; padding: 9px 12px; transition: all 0.16s;
  }
  .rg-wrap:focus-within { border-color: #10b981; background: #fff; box-shadow: 0 0 0 3px rgba(16,185,129,0.09); }
  .rg-wrap.err { border-color: #fca5a5; }
  .rg-wrap.ok  { border-color: #6ee7b7; }
  .rg-wrap input {
    flex: 1; border: none; outline: none; background: transparent;
    font-size: 13px; color: #111827; font-family: inherit;
  }
  .rg-wrap input::placeholder { color: #d1d5db; }
  .rg-prefix { font-size: 12px; font-weight: 700; color: #d1d5db; flex-shrink: 0; }
  .rg-ico { flex-shrink: 0; color: #d1d5db; width: 14px; height: 14px; }
  .rg-eye { background: none; border: none; cursor: pointer; padding: 0; color: #d1d5db; display: flex; align-items: center; }
  /* Password strength */
  .rg-bars { display: flex; gap: 3px; margin: 6px 0 2px; }
  .rg-bar  { flex: 1; height: 2px; border-radius: 2px; background: #e5e7eb; transition: all 0.3s; }
  /* Terms */
  .rg-terms {
    display: flex; align-items: flex-start; gap: 9px;
    background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 9px;
    padding: 10px 12px; cursor: pointer; margin-top: 4px;
  }
  .rg-check {
    width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0; margin-top: 1px;
    border: 1.5px solid #e5e7eb; background: #fff; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .rg-check.on { background: #059669; border-color: #059669; }
  /* Submit */
  .rg-submit {
    width: 100%; padding: 11px; background: #059669; border: none;
    border-radius: 9px; color: #fff; font-size: 13px; font-weight: 700;
    letter-spacing: 0.03em; font-family: inherit; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: all 0.18s; box-shadow: 0 2px 10px rgba(5,150,105,0.22);
    margin-top: 14px;
  }
  .rg-submit:hover:not(:disabled) { background: #047857; transform: translateY(-1px); box-shadow: 0 4px 18px rgba(5,150,105,0.3); }
  .rg-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  /* Alert */
  .rg-alert { display: flex; align-items: center; gap: 7px; padding: 9px 12px; border-radius: 9px; font-size: 12px; margin-bottom: 12px; }
  .rg-alert.err { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
  .rg-alert.ok  { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
  /* Footer */
  .rg-foot {
    background: #f9fafb; border-top: 1px solid #f3f4f6;
    padding: 12px 22px; display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 12px;
  }
  @keyframes rg-spin { to { transform: rotate(360deg); } }
`;

/* ── Icons ──────────────────────────────────────────────────────── */
const IEye    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IEyeOff = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const ICheck  = () => <svg width="9"  height="9"  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"   strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IAlert  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IArrow  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

/* ── Password strength ──────────────────────────────────────────── */
const PW_C = ['#e5e7eb','#ef4444','#f59e0b','#10b981','#059669'];
const PW_L = ['','Weak','Fair','Good','Strong'];
function pwScore(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

/* ══════════════════════════════════════════════════════════════════ */
export default function RegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState(null);
  const [success, setOk]    = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const score  = pwScore(form.password);
  const match  = form.password && form.confirmPassword && form.password === form.confirmPassword;
  const bad    = form.confirmPassword && form.password !== form.confirmPassword;

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(null); };

  const submit = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (!agreed) { setError('Please accept the Terms of Service.'); return; }
    setLoad(true); setError(null); setOk(null);
    try {
      await apiClient.post('/auth/register/seller', { username: form.username, email: form.email, password: form.password });
      setOk('Account created! Taking you to sign in…');
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoad(false); }
  };

  return (
    <div className="rg-page">
      <style>{STYLES}</style>
      <div className="rg-card">

        {/* Top strip */}
        <div className="rg-strip">
          <div className="rg-brand">
            <div className="rg-brand-dot" />
            <span className="rg-brand-name">Jhapcham</span>
          </div>
          <div className="rg-steps">
            <div className="rg-step on" />
            <div className="rg-step" />
          </div>
        </div>

        {/* Body */}
        <div className="rg-body">
          <p className="rg-title">Create your account</p>
          <p className="rg-sub">Step 1 of 2 — Basic credentials</p>

          {error   && <div className="rg-alert err"><IAlert />{error}</div>}
          {success && <div className="rg-alert ok"><ICheck />{success}</div>}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>

            {/* Username */}
            <div>
              <label className="rg-label">Store Username</label>
              <div className="rg-wrap">
                <span className="rg-prefix">@</span>
                <input type="text" placeholder="craftstudio" required value={form.username} onChange={e => set('username', e.target.value)} autoComplete="username" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="rg-label">Business Email</label>
              <div className="rg-wrap">
                <svg className="rg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input type="email" placeholder="merchant@company.com" required value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="rg-label">Password</label>
              <div className="rg-wrap">
                <svg className="rg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" required value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password" />
                <button type="button" className="rg-eye" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <IEyeOff /> : <IEye />}
                </button>
              </div>
              {form.password && (
                <div>
                  <div className="rg-bars">
                    {[1,2,3,4].map(n => <div key={n} className="rg-bar" style={{ background: n <= score ? PW_C[score] : '#e5e7eb' }} />)}
                  </div>
                  <span style={{ fontSize: 10, color: PW_C[score], fontWeight: 600 }}>{PW_L[score]}</span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="rg-label">Confirm Password</label>
              <div className={`rg-wrap${bad ? ' err' : match ? ' ok' : ''}`}>
                <svg className="rg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input type={showCp ? 'text' : 'password'} placeholder="Repeat password" required value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} autoComplete="new-password" />
                {match && <div style={{ color: '#10b981', flexShrink: 0, width: 14, height: 14 }}><ICheck /></div>}
                <button type="button" className="rg-eye" onClick={() => setShowCp(v => !v)}>
                  {showCp ? <IEyeOff /> : <IEye />}
                </button>
              </div>
              {bad && <p style={{ fontSize: 10, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>Passwords do not match</p>}
            </div>

            {/* Terms */}
            <div className="rg-terms" onClick={() => setAgreed(v => !v)}>
              <div className={`rg-check${agreed ? ' on' : ''}`} style={{ color: '#fff' }}>
                {agreed && <ICheck />}
              </div>
              <span style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
                I agree to{' '}
                <a href="#terms" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>Terms of Service</a>
                {' '}and{' '}
                <a href="#commission" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>Commission Policy</a>.
              </span>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="rg-submit">
              {loading
                ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rg-spin 0.7s linear infinite', display: 'inline-block' }} /> Creating…</>
                : <>Create Seller Account <IArrow /></>
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="rg-foot">
          <span style={{ color: '#9ca3af' }}>Already have a store?</span>
          <Link to="/" style={{ color: '#059669', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Sign In <IArrow />
          </Link>
        </div>

      </div>
    </div>
  );
}
