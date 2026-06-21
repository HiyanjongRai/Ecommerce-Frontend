import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../shared/api/apiConfig';

/* ─── Helpers ─────────────────────────────────────────────────── */
const PW_COLOR = ['#E5E7EB','#EF4444','#F59E0B','#16A34A','#15803D'];
const PW_LABEL = ['','Weak','Fair','Good','Strong'];
function pwScore(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const toSlug  = (v) => v.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'');
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const G_ID    = process.env.REACT_APP_GOOGLE_CLIENT_ID || '983073986551-a49ce7tnjh29fccqnqp1v92ma4i3b3ba.apps.googleusercontent.com';

/* ─── Icons ────────────────────────────────────────────────────── */
const ICheck  = ({s=10}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IAlert  = ({s=13}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IArrow  = ()       => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IEye    = ()       => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IEyeOff = ()       => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IStore  = ()       => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IMail   = ()       => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const ILock   = ()       => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const IUser   = ()       => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const ISpin   = ()       => <span style={{width:16,height:16,border:'2px solid rgba(255,255,255,.35)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'rg-spin .75s linear infinite',flexShrink:0}}/>;
const IGoog   = ()       => <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;

/* ─── Static data ──────────────────────────────────────────────── */
const FEATURES = [
  { icon:'🏷️', title:'Zero Setup Fees',       desc:'Start for free, no upfront costs'   },
  { icon:'💳', title:'Weekly Payouts',         desc:'Get paid every week, guaranteed'    },
  { icon:'📦', title:'Nationwide Delivery',    desc:'Reach buyers across all of Nepal'   },
  { icon:'🛡️', title:'Seller Protection',      desc:'Disputes handled in your favor'     },
];
const WHY = [
  { icon:'📊', title:'Live Analytics',       desc:'Real-time sales, views, and conversion data at a glance'    },
  { icon:'🚚', title:'Logistics Network',    desc:'Partnered with top couriers for fast Nepal-wide delivery'   },
  { icon:'🔒', title:'Secure Payments',      desc:'Every transaction protected with bank-grade encryption'     },
  { icon:'🌐', title:'Huge Customer Base',   desc:'12,000+ active sellers, hundreds of thousands of buyers'    },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function RegistrationPage() {
  const navigate = useNavigate();

  const [form,   setForm]   = useState({ storeName:'', email:'', password:'', confirmPassword:'' });
  const [touched,setTouched]= useState({ storeName:false, email:false, password:false, confirmPassword:false });
  const [agreed, setAgreed] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [loading,setLoad]   = useState(false);
  const [gLoad,  setGLoad]  = useState(false);
  const [error,  setError]  = useState(null);
  const [success,setOk]     = useState(null);
  const [avail,  setAvail]  = useState(null); // null|'checking'|'available'|'taken'
  const debounce = useRef(null);

  const slug  = toSlug(form.storeName);
  const score = pwScore(form.password);
  const pwRules = [
    { label:'Minimum 8 characters',  pass: form.password.length >= 8   },
    { label:'One uppercase letter',   pass: /[A-Z]/.test(form.password) },
    { label:'One number',             pass: /[0-9]/.test(form.password) },
    { label:'One special character',  pass: /[^A-Za-z0-9]/.test(form.password) },
  ];
  const pwOk = pwRules.every(r => r.pass);
  const cpOk = form.password && form.confirmPassword && form.password === form.confirmPassword;
  const cpBad= form.confirmPassword && !cpOk;

  const progress = [
    form.storeName.trim() && avail==='available' ? 25 : 0,
    form.email && isEmail(form.email)            ? 25 : 0,
    pwOk                                         ? 25 : 0,
    cpOk                                         ? 25 : 0,
  ].reduce((a,b)=>a+b,0);

  const set   = (k,v) => { setForm(p=>({...p,[k]:v})); setError(null); };
  const touch = (k)   => setTouched(p=>({...p,[k]:true}));

  const errs = {
    storeName:       touched.storeName && !form.storeName.trim()                 ? 'Store name is required.'
                   : touched.storeName && form.storeName && avail==='taken'      ? 'This store name is already taken.'
                   : null,
    email:           touched.email && !form.email                                ? 'Email is required.'
                   : touched.email && form.email && !isEmail(form.email)         ? 'Enter a valid email address.'
                   : null,
    password:        touched.password && !form.password                          ? 'Password is required.'
                   : null,
    confirmPassword: touched.confirmPassword && cpBad                            ? 'Passwords do not match.'
                   : null,
  };

  const checkAvail = useCallback((name) => {
    clearTimeout(debounce.current);
    const s = toSlug(name);
    if (!s || s.length < 3) { setAvail(null); return; }
    setAvail('checking');
    debounce.current = setTimeout(async () => {
      try { await apiClient.get(`/auth/check-store?name=${encodeURIComponent(s)}`); setAvail('available'); }
      catch (e) { setAvail(e?.response?.status===409 ? 'taken' : 'available'); }
    }, 600);
  }, []);
  useEffect(()=>{ checkAvail(form.storeName); },[form.storeName,checkAvail]);

  /* ────────────────────────────────────────────────────────────────
   * Google Sign-In — OAuth 2.0 popup + postMessage
   *
   * Flow:
   *  1. triggerGoogleSignIn() opens a small popup window to
   *     Google's OAuth authorization endpoint.
   *  2. User picks their account in Google's UI.
   *  3. Google redirects the popup to /auth/google/callback with
   *     the ID token in the URL hash (#id_token=...).
   *  4. GoogleAuthCallback.jsx reads the token and sends it back
   *     here via window.postMessage, then closes itself.
   *  5. The message listener calls handleGoogle() which posts the
   *     credential to our backend /auth/google endpoint.
   *
   * Why this beats prompt() / renderButton():
   *  - window.open always works — no library, no async load race
   *  - Shows the FULL Google account picker reliably on localhost
   *  - No GSI suppression, no hidden-div hacks, no synthetic clicks
   * ──────────────────────────────────────────────────────────────── */
  const handleGoogle = useCallback(async (idToken) => {
    setGLoad(true); setError(null);
    try {
      const r = await apiClient.post('/auth/google', { credential: idToken, role: 'SELLER' });
      if (r.data?.accessToken) {
        setOk('Signed in with Google! Redirecting…');
        setTimeout(() => navigate('/'), 1800);
      }
    } catch(e) {
      setError(e?.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally { setGLoad(false); }
  }, [navigate]);

  // Listen for postMessage from the callback popup
  useEffect(() => {
    const onMessage = (event) => {
      // Security: only accept messages from our own origin
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'GOOGLE_OAUTH_RESULT')   return;

      const { idToken, error } = event.data;
      if (error)   { setError('Google sign-in was cancelled or failed.'); setGLoad(false); return; }
      if (idToken) { handleGoogle(idToken); }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleGoogle]);

  const triggerGoogleSignIn = () => {
    // Build Google's OAuth 2.0 implicit flow URL.
    // response_type=id_token returns the JWT directly in the hash.
    const nonce  = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const params = new URLSearchParams({
      client_id:     G_ID,
      redirect_uri:  `${window.location.origin}/auth/google/callback`,
      response_type: 'id_token',
      scope:         'email profile openid',
      nonce,
      prompt:        'select_account',   // always show account picker
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    // Open a centred popup window
    const w = 500, h = 620;
    const left = Math.round((screen.width  - w) / 2);
    const top  = Math.round((screen.height - h) / 2);
    const popup = window.open(
      url,
      'google-oauth-popup',
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup || popup.closed) {
      setError('Popup was blocked. Please allow popups for this site and try again.');
      return;
    }

    setGLoad(true); // show loading state until postMessage arrives or popup closes

    // Detect if user closes the popup without completing sign-in
    const pollClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollClosed);
        // gLoad will be reset by handleGoogle or the error handler
        setGLoad(prev => { if (prev) { setError(null); } return false; });
      }
    }, 500);
  };




  const submit = async e => {
    e.preventDefault();
    setTouched({storeName:true,email:true,password:true,confirmPassword:true});
    if (!form.storeName.trim()||!form.email||!isEmail(form.email)||!form.password||!pwOk||!cpOk) return;
    if (!agreed) { setError('Please accept the Terms of Service and Commission Policy.'); return; }
    setLoad(true); setError(null); setOk(null);
    try {
      await apiClient.post('/auth/register/seller',{ username:slug||form.storeName.trim(), email:form.email, password:form.password });
      setOk('Store created! Taking you to sign in…');
      setTimeout(()=>navigate('/'),2500);
    } catch(err) { setError(err?.response?.data?.message||'Registration failed. Please try again.'); }
    finally { setLoad(false); }
  };

  const wc = (k, extra=true) => {
    if (!touched[k]) return 'fi';
    if (errs[k])     return 'fi err';
    if (extra)       return 'fi ok';
    return 'fi';
  };

  return (
    <div style={{minHeight:'100vh',fontFamily:"'Inter',system-ui,-apple-system,sans-serif",background:'#F0F4F0'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes rg-spin{to{transform:rotate(360deg)}}
        @keyframes rg-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rg-pulse{0%,100%{opacity:.65}50%{opacity:1}}

        /* ── field input wrapper ── */
        .fi {
          display:flex;align-items:center;gap:8px;
          background:#fff;border:1.5px solid #D1D5DB;border-radius:9px;
          padding:0 12px;min-height:46px;transition:border-color .16s,box-shadow .16s;
        }
        .fi:focus-within{border-color:#16A34A;box-shadow:0 0 0 3px rgba(22,163,74,.11)}
        .fi.err{border-color:#EF4444;box-shadow:0 0 0 3px rgba(239,68,68,.09)}
        .fi.ok {border-color:#16A34A}
        .fi input{
          flex:1;border:none;outline:none;background:transparent;
          font-size:13.5px;color:#111827;font-family:inherit;padding:12px 0;
        }
        .fi input::placeholder{color:#9CA3AF}

        /* ── eye button ── */
        .eye{
          background:none;border:none;cursor:pointer;color:#9CA3AF;
          display:flex;align-items:center;justify-content:center;
          width:34px;height:34px;border-radius:7px;
          transition:color .14s,background .14s;flex-shrink:0;
        }
        .eye:hover{color:#374151;background:rgba(0,0,0,.05)}
        .eye:focus-visible{outline:2px solid #16A34A}

        /* ── label ── */
        .lbl{display:block;font-size:12.5px;font-weight:700;color:#374151;margin-bottom:5px}

        /* ── inline messages ── */
        .ferr{display:flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;color:#DC2626;margin-top:4px}
        .fok {display:flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;color:#15803D;margin-top:4px}

        /* ── avail badge ── */
        .avail{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:2px 7px;border-radius:20px;white-space:nowrap;flex-shrink:0}
        .avail.ok {background:#DCFCE7;color:#15803D}
        .avail.bad{background:#FEE2E2;color:#DC2626}
        .avail.chk{background:#FEF3C7;color:#92400E;animation:rg-pulse 1s ease infinite}

        /* ── strength bar ── */
        .sbar{flex:1;height:3px;border-radius:3px;transition:background .3s;background:#E5E7EB}

        /* ── pw rules box ── */
        .pw-box{
          background:#F0FDF4;border:1px solid #BBF7D0;border-radius:9px;
          padding:10px 13px;margin-top:10px;display:grid;
          grid-template-columns:1fr 1fr;gap:5px 12px;
        }
        .pw-rule{display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:500}

        /* ── CTA button ── */
        .cta{
          width:100%;padding:14px;
          background:linear-gradient(135deg,#16A34A,#15803D);
          border:none;border-radius:10px;color:#fff;
          font-size:15px;font-weight:800;font-family:inherit;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:9px;
          transition:transform .12s,box-shadow .12s;
          box-shadow:0 4px 16px rgba(22,163,74,.3);min-height:50px;
        }
        .cta:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 26px rgba(22,163,74,.38)}
        .cta:active:not(:disabled){transform:translateY(0)}
        .cta:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .cta:focus-visible{outline:2px solid #16A34A;outline-offset:3px}

        /* ── google button ── */
        .gbtn{
          width:100%;padding:11px 14px;
          background:#fff;border:1.5px solid #D1D5DB;border-radius:9px;
          font-size:13.5px;font-weight:600;color:#374151;font-family:inherit;
          display:flex;align-items:center;justify-content:center;gap:9px;
          cursor:pointer;transition:background .14s,border-color .14s,box-shadow .14s;min-height:46px;
        }
        .gbtn:hover{background:#F9FAFB;border-color:#9CA3AF;box-shadow:0 2px 8px rgba(0,0,0,.07)}
        .gbtn:disabled{opacity:.55;cursor:not-allowed}
        .gbtn:focus-visible{outline:2px solid #16A34A;outline-offset:2px}

        /* ── divider ── */
        .dvdr{display:flex;align-items:center;gap:10px;margin:11px 0}
        .dvdr::before,.dvdr::after{content:'';flex:1;height:1px;background:#E5E7EB}
        .dvdr span{font-size:10px;font-weight:500;color:#B0B7C3;text-transform:uppercase;letter-spacing:.7px;white-space:nowrap}

        /* ── terms ── */
        .trm{
          display:flex;align-items:flex-start;gap:11px;
          background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:9px;
          padding:11px 13px;cursor:pointer;user-select:none;
          transition:border-color .16s,background .16s;
        }
        .trm:hover{border-color:#D1D5DB}
        .trm.on{border-color:#BBF7D0;background:#F0FDF4}
        .cbox{
          width:20px;height:20px;min-width:20px;border-radius:5px;
          border:1.5px solid #D1D5DB;background:#fff;
          display:flex;align-items:center;justify-content:center;
          transition:all .14s;color:white;margin-top:1px;
        }
        .cbox.on{background:#16A34A;border-color:#16A34A}
        .tlink{color:#16A34A;font-weight:700;text-decoration:underline;text-underline-offset:2px;transition:color .14s}
        .tlink:hover{color:#15803D}

        /* ── alert ── */
        .alrt{
          display:flex;align-items:flex-start;gap:7px;
          padding:10px 12px;border-radius:9px;font-size:13px;
          font-weight:600;margin-bottom:14px;line-height:1.45;animation:rg-in .2s ease;
        }
        .alrt.e{background:#FEF2F2;border:1px solid #FECACA;color:#B91C1C}
        .alrt.s{background:#F0FDF4;border:1px solid #BBF7D0;color:#15803D}

        /* ── step indicator ── */
        .steps{display:flex;align-items:center;margin-bottom:22px}
        .step-circle{
          width:32px;height:32px;border-radius:50%;border:2px solid #D1D5DB;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;font-weight:800;color:#9CA3AF;
          background:#fff;flex-shrink:0;transition:all .2s;
        }
        .step-circle.active{background:#16A34A;border-color:#16A34A;color:#fff;box-shadow:0 0 0 4px rgba(22,163,74,.15)}
        .step-circle.done {background:#DCFCE7;border-color:#16A34A;color:#16A34A}
        .step-line{flex:1;height:2px;background:#E5E7EB;margin:0 6px}
        .step-line.done{background:#16A34A}
        .step-label{font-size:11px;font-weight:600;margin-top:4px;text-align:center}

        /* ── hero dashboard mock ── */
        .dash-mock{
          background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);
          border-radius:12px;padding:14px;margin:20px 0;backdrop-filter:blur(4px);
        }
        .dash-stat{
          background:rgba(255,255,255,.14);border-radius:8px;padding:10px 12px;
          border:1px solid rgba(255,255,255,.12);
        }
        .dash-bar-bg{background:rgba(255,255,255,.15);height:5px;border-radius:4px;margin-top:6px;overflow:hidden}
        .dash-bar{background:#fff;height:100%;border-radius:4px}

        /* ── why section ── */
        .why-card{
          background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:18px 16px;
          flex:1;min-width:180px;transition:box-shadow .2s,transform .2s;
        }
        .why-card:hover{box-shadow:0 6px 20px rgba(0,0,0,.08);transform:translateY(-2px)}

        /* ── progress strip ── */
        .prog-wrap{height:4px;background:#E5E7EB;border-radius:4px;overflow:hidden;margin-bottom:20px}
        .prog-fill{height:100%;background:linear-gradient(90deg,#16A34A,#15803D);border-radius:4px;transition:width .4s ease}

        /* ── responsive ── */
        @media(max-width:900px){
          .left-panel{display:none!important}
          .right-area{width:100%!important}
          .form-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:540px){
          .right-area{padding:24px 14px 36px!important}
          .form-grid{grid-template-columns:1fr!important}
          .cta{font-size:14px;min-height:48px}
        }
      `}</style>

      {/* ══════ TOP SECTION — hero split ══════ */}
      <div style={{display:'flex',minHeight:'100vh',position:'relative'}}>

        {/* ── LEFT HERO PANEL ── */}
        <div
          className="left-panel"
          style={{
            width:'38%',flexShrink:0,
            background:'linear-gradient(155deg,#052E16 0%,#064E3B 45%,#16A34A 100%)',
            position:'sticky',top:0,height:'100vh',overflowY:'auto',
            display:'flex',flexDirection:'column',padding:'36px 32px',
          }}
        >
          {/* Decorative circles */}
          <div style={{position:'absolute',top:-60,right:-60,width:240,height:240,background:'rgba(255,255,255,.05)',borderRadius:'50%',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:-80,left:-40,width:200,height:200,background:'rgba(255,255,255,.04)',borderRadius:'50%',pointerEvents:'none'}}/>
          <div style={{position:'absolute',top:'35%',right:20,width:80,height:80,background:'rgba(255,255,255,.06)',borderRadius:'50%',pointerEvents:'none'}}/>

          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32,position:'relative',zIndex:1}}>
            <div style={{width:38,height:38,borderRadius:10,background:'rgba(255,255,255,.2)',border:'1px solid rgba(255,255,255,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:'white'}}>J</div>
            <div>
              <div style={{fontSize:14,fontWeight:900,color:'white',letterSpacing:1.8,lineHeight:1}}>JHAPCHAM</div>
              <div style={{fontSize:9,color:'rgba(255,255,255,.55)',letterSpacing:2,textTransform:'uppercase',marginTop:2.5,fontWeight:600}}>Nepal's Marketplace</div>
            </div>
          </div>

          {/* Headline */}
          <div style={{position:'relative',zIndex:1,marginBottom:20}}>
            <h1 style={{fontSize:28,fontWeight:900,color:'white',lineHeight:1.18,letterSpacing:'-0.5px',marginBottom:10}}>
              Grow Your Business<br/>Across Nepal
            </h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,.72)',lineHeight:1.7,maxWidth:280}}>
              Create your store, list products, manage orders, and receive payments securely — all in one place.
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="dash-mock" style={{position:'relative',zIndex:1}}>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.7)',letterSpacing:.5,marginBottom:10,textTransform:'uppercase'}}>Your Dashboard Preview</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
              {[{label:'Total Sales',val:'रू 1,24,500',pct:'↑ 18%'},{label:'Orders',val:'345',pct:'↑ 12%'},{label:'Products',val:'82',pct:'Active'},{label:'Rating',val:'4.8 ★',pct:'Excellent'}].map(s=>(
                <div key={s.label} className="dash-stat">
                  <div style={{fontSize:9,color:'rgba(255,255,255,.55)',fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>{s.label}</div>
                  <div style={{fontSize:15,fontWeight:800,color:'white',marginTop:2,letterSpacing:'-0.3px'}}>{s.val}</div>
                  <div style={{fontSize:9,color:'#86EFAC',fontWeight:600,marginTop:1}}>{s.pct}</div>
                </div>
              ))}
            </div>
            {/* Mini bar chart */}
            <div style={{display:'flex',gap:4,alignItems:'flex-end',height:32,marginTop:2}}>
              {[40,65,50,80,60,90,75].map((h,i)=>(
                <div key={i} style={{flex:1,height:`${h}%`,background:i===5?'rgba(255,255,255,.9)':'rgba(255,255,255,.28)',borderRadius:3,transition:'height .3s'}}/>
              ))}
            </div>
            <div style={{fontSize:9,color:'rgba(255,255,255,.4)',marginTop:5,textAlign:'right',fontWeight:500}}>Sales — Last 7 days</div>
          </div>

          {/* Features 2×2 */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,position:'relative',zIndex:1}}>
            {FEATURES.map(f=>(
              <div key={f.title} style={{background:'rgba(255,255,255,.09)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'10px 11px'}}>
                <div style={{fontSize:18,marginBottom:4,lineHeight:1}}>{f.icon}</div>
                <div style={{fontSize:12,fontWeight:700,color:'white',lineHeight:1.2}}>{f.title}</div>
                <div style={{fontSize:10.5,color:'rgba(255,255,255,.58)',marginTop:2,lineHeight:1.35}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT FORM AREA ── */}
        <div
          className="right-area"
          style={{
            flex:1,background:'#F0F4F0',
            display:'flex',alignItems:'flex-start',justifyContent:'center',
            padding:'36px 40px 48px',overflowY:'auto',
          }}
        >
          <div style={{width:'100%',maxWidth:560,animation:'rg-in .3s ease both'}}>

            {/* Form card */}
            <div style={{background:'#fff',borderRadius:16,boxShadow:'0 2px 8px rgba(0,0,0,.05),0 20px 50px rgba(0,0,0,.09)',padding:'28px 32px 32px'}}>

              {/* Card header */}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22}}>
                <div>
                  <h2 style={{fontSize:22,fontWeight:900,color:'#111827',letterSpacing:'-0.4px',lineHeight:1.15}}>Seller Registration</h2>
                  <p style={{fontSize:12.5,color:'#6B7280',marginTop:4,lineHeight:1.5}}>Create your seller account and start selling today.</p>
                </div>
                <div style={{textAlign:'right',flexShrink:0,marginLeft:16}}>
                  <span style={{fontSize:12,color:'#6B7280'}}>Already registered?{' '}</span>
                  <Link to="/" style={{color:'#16A34A',fontWeight:700,fontSize:12.5,textDecoration:'none'}}>Sign In</Link>
                </div>
              </div>

              {/* Step indicator */}
              <div className="steps">
                <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div className="step-circle active">1</div>
                  <span className="step-label" style={{color:'#16A34A'}}>Account Info</span>
                </div>
                <div className="step-line"/>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div className="step-circle">2</div>
                  <span className="step-label" style={{color:'#9CA3AF'}}>Store Setup</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="prog-wrap">
                <div className="prog-fill" style={{width:`${progress}%`}}/>
              </div>

              {/* Alerts */}
              {error   && <div className="alrt e" role="alert" ><IAlert/>{error}</div>}
              {success && <div className="alrt s" role="status"><ICheck s={13}/>{success}</div>}

              {/* ── Google sign-in — opens account picker popup ── */}
              <button
                className="gbtn"
                type="button"
                aria-label="Continue registration with Google"
                disabled={gLoad}
                onClick={triggerGoogleSignIn}
              >
                {gLoad
                  ? <><ISpin/><span style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:13.5,fontWeight:600,color:'#374151'}}>Connecting…</span></>
                  : <><IGoog/><span style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:13.5,fontWeight:600,color:'#374151'}}>Continue with Google</span></>
                }
              </button>

              <div className="dvdr"><span>or register with email</span></div>

              <form onSubmit={submit} noValidate>

                {/* ── 2-col grid: Store Name | Email ── */}
                <div className="form-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px 16px',marginBottom:14}}>

                  {/* Store Name */}
                  <div>
                    <label className="lbl" htmlFor="r-store">Store Name <span style={{color:'#DC2626'}}>*</span></label>
                    <div className={wc('storeName', form.storeName.trim()&&avail==='available')}>
                      <span style={{color:'#9CA3AF',flexShrink:0}}><IStore/></span>
                      <input id="r-store" type="text" required placeholder="e.g. Himalayan Crafts"
                        autoComplete="organization" value={form.storeName}
                        onChange={e=>set('storeName',e.target.value)} onBlur={()=>touch('storeName')}
                        aria-invalid={!!errs.storeName}/>
                      {form.storeName.trim().length>=3&&(
                        <span className={`avail${avail==='available'?' ok':avail==='taken'?' bad':' chk'}`}>
                          {avail==='checking'&&'…'}
                          {avail==='available'&&<><ICheck s={8}/>OK</>}
                          {avail==='taken'&&<>✕</>}
                        </span>
                      )}
                    </div>
                    {errs.storeName
                      ? <p className="ferr" role="alert"><IAlert s={11}/>{errs.storeName}</p>
                      : <div style={{fontSize:11,color:'#9CA3AF',marginTop:4,display:'flex',alignItems:'center',gap:3}}>
                          <span>jhapcham.com/store/</span>
                          <span style={{color:'#16A34A',fontWeight:700}}>{slug||'your-store'}</span>
                        </div>
                    }
                  </div>

                  {/* Email */}
                  <div>
                    <label className="lbl" htmlFor="r-email">Business Email <span style={{color:'#DC2626'}}>*</span></label>
                    <div className={wc('email', form.email&&!errs.email)}>
                      <span style={{color:'#9CA3AF',flexShrink:0}}><IMail/></span>
                      <input id="r-email" type="email" required placeholder="merchant@business.com"
                        autoComplete="email" value={form.email}
                        onChange={e=>set('email',e.target.value)} onBlur={()=>touch('email')}
                        aria-invalid={!!errs.email}/>
                      {touched.email&&form.email&&!errs.email&&<span style={{color:'#16A34A',flexShrink:0}}><ICheck s={13}/></span>}
                    </div>
                    {errs.email&&<p className="ferr" role="alert"><IAlert s={11}/>{errs.email}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="lbl" htmlFor="r-pw">Create Password <span style={{color:'#DC2626'}}>*</span></label>
                    <div className={wc('password', pwOk)}>
                      <span style={{color:'#9CA3AF',flexShrink:0}}><ILock/></span>
                      <input id="r-pw" type={showPw?'text':'password'} required placeholder="Min. 8 characters"
                        autoComplete="new-password" value={form.password}
                        onChange={e=>set('password',e.target.value)} onBlur={()=>touch('password')}
                        aria-invalid={!!errs.password} aria-describedby="pw-rules"/>
                      <button type="button" className="eye" aria-label={showPw?'Hide':'Show'} onClick={()=>setShowPw(v=>!v)}>
                        {showPw?<IEyeOff/>:<IEye/>}
                      </button>
                    </div>
                    {/* Strength bars */}
                    {form.password&&(
                      <div style={{display:'flex',gap:3,marginTop:6,alignItems:'center'}}>
                        {[1,2,3,4].map(n=><div key={n} className="sbar" style={{background:n<=score?PW_COLOR[score]:'#E5E7EB'}}/>)}
                        <span style={{fontSize:10,fontWeight:800,color:PW_COLOR[score],marginLeft:6,whiteSpace:'nowrap'}}>{PW_LABEL[score]}</span>
                      </div>
                    )}
                    {errs.password&&!form.password&&<p className="ferr" role="alert"><IAlert s={11}/>{errs.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="lbl" htmlFor="r-cpw">Confirm Password <span style={{color:'#DC2626'}}>*</span></label>
                    <div className={`fi${cpBad?' err':cpOk?' ok':''}`}>
                      <span style={{color:'#9CA3AF',flexShrink:0}}><ILock/></span>
                      <input id="r-cpw" type={showCp?'text':'password'} required placeholder="Repeat password"
                        autoComplete="new-password" value={form.confirmPassword}
                        onChange={e=>set('confirmPassword',e.target.value)} onBlur={()=>touch('confirmPassword')}
                        aria-invalid={!!cpBad}/>
                      {cpOk&&<span style={{color:'#16A34A',flexShrink:0}}><ICheck s={13}/></span>}
                      <button type="button" className="eye" aria-label={showCp?'Hide':'Show'} onClick={()=>setShowCp(v=>!v)}>
                        {showCp?<IEyeOff/>:<IEye/>}
                      </button>
                    </div>
                    {cpBad&&<p className="ferr" role="alert"><IAlert s={11}/>Passwords do not match.</p>}
                    {cpOk &&<p className="fok"><ICheck s={10}/>Passwords match</p>}
                  </div>
                </div>

                {/* Password requirements box */}
                {form.password&&(
                  <div className="pw-box" id="pw-rules" aria-label="Password requirements">
                    <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#15803D',marginBottom:3}}>Password must contain:</div>
                    {pwRules.map(r=>(
                      <div key={r.label} className="pw-rule" style={{color:r.pass?'#15803D':'#6B7280'}}>
                        <div style={{width:14,height:14,borderRadius:'50%',background:r.pass?'#DCFCE7':'#F3F4F6',border:`1px solid ${r.pass?'#86EFAC':'#E5E7EB'}`,display:'flex',alignItems:'center',justifyContent:'center',color:r.pass?'#16A34A':'#D1D5DB',flexShrink:0}}>
                          {r.pass?<ICheck s={8}/>:<span style={{width:3,height:3,borderRadius:'50%',background:'#D1D5DB',display:'block'}}/>}
                        </div>
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}

                {/* Terms */}
                <div style={{marginTop:14}}>
                  <div
                    className={`trm${agreed?' on':''}`}
                    onClick={()=>setAgreed(v=>!v)}
                    role="checkbox" aria-checked={agreed} tabIndex={0}
                    onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();setAgreed(v=>!v);}}}
                  >
                    <div className={`cbox${agreed?' on':''}`} aria-hidden="true">{agreed&&<ICheck s={11}/>}</div>
                    <span style={{fontSize:12,color:'#4B5563',lineHeight:1.6}}>
                      I agree to Jhapcham's{' '}
                      <a href="#terms" className="tlink" onClick={e=>e.stopPropagation()}>Terms of Service</a>
                      {' '}and{' '}
                      <a href="#commission" className="tlink" onClick={e=>e.stopPropagation()}>Seller Commission Policy</a>
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <button type="submit" className="cta" style={{marginTop:18}} disabled={loading} aria-busy={loading}>
                  {loading?<><ISpin/>Creating Your Store…</>:<>Continue to Next Step <IArrow/></>}
                </button>

                {/* Trust strip */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginTop:14,flexWrap:'wrap'}}>
                  {[
                    {icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, label:'SSL Secured'},
                    {icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label:'Free to Join'},
                    {icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, label:'Verified Platform'},
                  ].map(t=>(
                    <span key={t.label} style={{display:'flex',alignItems:'center',gap:4,fontSize:10.5,fontWeight:600,color:'#6B7280'}}>
                      {t.icon}{t.label}
                    </span>
                  ))}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ WHY SELL WITH JHAPCHAM? ══════ */}
      <div style={{background:'#fff',padding:'48px 40px',borderTop:'1px solid #E5E7EB'}}>
        <h2 style={{textAlign:'center',fontSize:20,fontWeight:900,color:'#111827',letterSpacing:'-0.3px',marginBottom:6}}>Why Sell With Jhapcham?</h2>
        <p style={{textAlign:'center',fontSize:13,color:'#6B7280',marginBottom:28}}>Everything you need to run a successful online store in Nepal</p>
        <div style={{display:'flex',gap:16,flexWrap:'wrap',maxWidth:900,margin:'0 auto'}}>
          {WHY.map(w=>(
            <div key={w.title} className="why-card">
              <div style={{fontSize:26,marginBottom:10,lineHeight:1}}>{w.icon}</div>
              <div style={{fontSize:14,fontWeight:700,color:'#111827',marginBottom:5}}>{w.title}</div>
              <div style={{fontSize:12.5,color:'#6B7280',lineHeight:1.6}}>{w.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════ FOOTER ══════ */}
      <div style={{background:'#F9FAFB',borderTop:'1px solid #E5E7EB',padding:'16px 40px',textAlign:'center'}}>
        <span style={{fontSize:13,color:'#6B7280'}}>
          Need help?{' '}
          <a href="mailto:support@jhapcham.com" style={{color:'#16A34A',fontWeight:700,textDecoration:'none'}}>Contact Seller Support</a>
        </span>
      </div>
    </div>
  );
}
