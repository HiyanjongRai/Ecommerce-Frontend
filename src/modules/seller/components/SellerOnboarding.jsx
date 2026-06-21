import React, { useState, useEffect, useCallback } from 'react';
import { getSellerApplicationStatus, submitSellerApplication } from '../services/sellerService';
import { useCustomer } from '../../customer/contexts/CustomerContext';

/* ─── Module-level styles (injected once, never recreated) ──────── */
const STYLES = `
  .sob-in {
    width: 100%; background: #fff;
    border: 1.5px solid #e5e7eb; border-radius: 9px;
    padding: 10px 12px 10px 36px; font-size: 13px; color: #111827;
    font-family: inherit; outline: none; transition: border-color 0.18s, box-shadow 0.18s;
  }
  .sob-in::placeholder { color: #d1d5db; }
  .sob-in:focus {
    border-color: #16A34A;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
  }
  .sob-submit-btn {
    width: 100%; padding: 11px; background: #059669;
    border: none; border-radius: 9px; color: #fff;
    font-size: 13px; font-weight: 700; letter-spacing: 0.03em;
    font-family: inherit; cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    box-shadow: 0 2px 10px rgba(5,150,105,0.2);
  }
  .sob-submit-btn:hover:not(:disabled) {
    background: #047857; box-shadow: 0 4px 18px rgba(5,150,105,0.3);
    transform: translateY(-1px);
  }
  .sob-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .sob-upload-lbl {
    cursor: pointer; display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 11px; font-size: 10px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    border-radius: 7px; transition: all 0.15s;
    border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280;
    flex-shrink: 0;
  }
  .sob-upload-lbl:hover { border-color: #16A34A; color: #059669; background: #f0fdf4; }
  .sob-upload-lbl.done  { border-color: #6ee7b7; background: #f0fdf4; color: #059669; }
  .sob-doc-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f9fafb; }
  .sob-doc-badge {
    width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 800; font-family: monospace;
    background: #f3f4f6; color: #9ca3af; transition: all 0.2s;
  }
  .sob-doc-badge.done { background: #d1fae5; color: #059669; }
  @keyframes sob-spin { to { transform: rotate(360deg); } }
  @keyframes sob-pulse { 0%,100%{opacity:0.85;transform:scale(1);} 50%{opacity:1;transform:scale(1.05);} }
`;

/* ─── Icons (module-level) ───────────────────────────────────────── */
const ICheck   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IAlert   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IClock   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IUpload  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IFile    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>;
const IArrow   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IRefresh = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;

/* ─── DocRow — module-level, stable reference ────────────────────── */
function DocRow({ number, title, desc, file, onChange, required }) {
  return (
    <div className="sob-doc-row">
      <div className={`sob-doc-badge${file ? ' done' : ''}`}>
        {file ? <ICheck /> : number}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{desc}</div>
        {file && <div style={{ fontSize: 10, color: '#059669', fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>}
      </div>
      <label className={`sob-upload-lbl${file ? ' done' : ''}`}>
        {file ? <IFile /> : <IUpload />}
        {file ? 'Change' : 'Upload'}
        <input type="file" required={required} onChange={onChange} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" />
      </label>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
const SellerOnboarding = ({ onApproved }) => {
  const { user, logoutUser } = useCustomer();
  const [appStatus, setApp]   = useState(null);
  const [loading, setLoad]    = useState(true);
  const [submitting, setSub]  = useState(false);
  const [error, setError]     = useState(null);
  const [success, setOk]      = useState(null);
  const [storeName, setStore] = useState('');
  const [address, setAddr]    = useState('');
  const [idDoc, setId]        = useState(null);
  const [bizLic, setBiz]      = useState(null);
  const [taxCert, setTax]     = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoad(true);
      const res = await getSellerApplicationStatus(user.id);
      if (res.data) { setApp(res.data); if (res.data.status === 'APPROVED' && onApproved) onApproved(); }
    } catch { setError('Could not fetch status. Please refresh.'); }
    finally { setLoad(false); }
  }, [user, onApproved]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!storeName.trim() || !address.trim()) { setError('Store name and address are required.'); return; }
    setSub(true); setError(null); setOk(null);
    const fd = new FormData();
    fd.append('userId', user.id); fd.append('storeName', storeName); fd.append('address', address);
    if (idDoc)   fd.append('idDocument', idDoc);
    if (bizLic)  fd.append('businessLicense', bizLic);
    if (taxCert) fd.append('taxCertificate', taxCert);
    try {
      const res = await submitSellerApplication(fd);
      setOk(res.data?.message || 'Submitted! Our team reviews in 12–24 hours.');
      setTimeout(fetchStatus, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Check document formats.');
    } finally { setSub(false); }
  };

  const uploaded   = [idDoc, bizLic, taxCert].filter(Boolean).length;
  const isRejected = appStatus?.status === 'REJECTED';

  /* Shared card shell — just a div, NOT a component */
  const card = (title, subtitle, children) => (
    <div style={{ padding: '8px 0' }}>
      <style>{STYLES}</style>

      {/* Page header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>{subtitle}</p>
        </div>
        <button
          onClick={logoutUser}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Log Out
        </button>
      </div>

      {/* Two-column layout: form left, info panel right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
        {/* Main card */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {children}
        </div>

        {/* Info sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Step indicator */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 12 }}>Progress</div>
            {[['Account Created', true], ['Submit Documents', appStatus?.status === 'APPROVED'], ['Store Approved', appStatus?.status === 'APPROVED']].map(([lbl, done], i) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 9, paddingBottom: i < 2 ? 10 : 0, marginBottom: i < 2 ? 10 : 0, borderBottom: i < 2 ? '1px solid #f9fafb' : 'none' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? '#059669' : i === 1 ? '#fbbf24' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {done ? <ICheck /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: i === 1 ? '#f59e0b' : '#d1d5db', display: 'block' }} />}
                </div>
                <span style={{ fontSize: 12, fontWeight: done ? 700 : 500, color: done ? '#111827' : i === 1 ? '#92400e' : '#9ca3af' }}>{lbl}</span>
              </div>
            ))}
          </div>

          {/* What to prepare */}
          <div style={{ background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#059669', marginBottom: 10 }}>What to prepare</div>
            {['Government ID or Passport', 'Business Registration Certificate', 'PAN / VAT Tax Document'].map((item, i) => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: i < 2 ? 8 : 0 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, color: '#059669' }}><ICheck /></div>
                <span style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Review timeline */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Review Timeline</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', letterSpacing: '-0.03em' }}>12–24h</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Average admin review time</div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Loading ── */
  if (loading) return card('Seller Onboarding', 'Step 2 of 2 — Store credentials & documents',
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid #e5e7eb', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'sob-spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Loading…</p>
    </div>
  );

  /* ── Pending ── */
  if (appStatus?.status === 'PENDING') return card('Application Under Review', 'Pending admin verification',
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: 11, marginBottom: 18 }}>
        <div style={{ color: '#059669', animation: 'sob-pulse 2.5s ease infinite', flexShrink: 0 }}><IClock /></div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>Documents Filed Successfully</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            Hi <strong style={{ color: '#111827' }}>{user?.username}</strong>! Your application is being reviewed. Expect a response within <strong style={{ color: '#059669' }}>12–24 hours</strong>.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        {[['Submitted', appStatus.submittedAt ? new Date(appStatus.submittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Just now'], ['Application ID', `#APP-${appStatus.applicationId || 'NEW'}`]].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f9fafb', fontSize: 12 }}>
            <span style={{ color: '#9ca3af', fontWeight: 500 }}>{k}</span>
            <span style={{ color: '#111827', fontWeight: 700, fontFamily: 'monospace' }}>{v}</span>
          </div>
        ))}
      </div>

      <button onClick={fetchStatus} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
        <IRefresh /> Check Status
      </button>
    </div>
  );

  /* ── Main form ── */
  return card('Seller Onboarding', 'Step 2 of 2 — Store credentials & documents',
    <>
      {/* Rejection */}
      {isRejected && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', marginBottom: 4 }}>Application Rejected</div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{appStatus.message || 'Please re-upload corrected documents.'}</div>
          {appStatus.reviewNote && <div style={{ marginTop: 8, padding: '8px 10px', background: '#fff', borderRadius: 7, border: '1px solid #fecaca', fontSize: 11, color: '#6b7280' }}><strong>Admin Note:</strong> {appStatus.reviewNote}</div>}
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 13px', marginBottom: 14, fontSize: 12, color: '#b91c1c' }}>
          <IAlert />{error}
        </div>
      )}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, padding: '10px 13px', marginBottom: 14, fontSize: 12, color: '#15803d' }}>
          <ICheck />{success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Store info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>Store Name</label>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#d1d5db', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <input className="sob-in" type="text" required placeholder="Nepal Crafts Studio" value={storeName} onChange={e => setStore(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>Physical Address</label>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#d1d5db', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <input className="sob-in" type="text" required placeholder="Thamel, Kathmandu" value={address} onChange={e => setAddr(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>Required Documents</span>
          <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: uploaded === 3 ? '#059669' : '#9ca3af' }}>{uploaded}/3</span>
        </div>

        <DocRow number="01" title="Owner Identity"      desc="Govt ID, Passport or Citizenship"  file={idDoc}   onChange={e => setId(e.target.files[0])}  required={!isRejected} />
        <DocRow number="02" title="Business License"    desc="Official registration document"    file={bizLic}  onChange={e => setBiz(e.target.files[0])} required={!isRejected} />
        <DocRow number="03" title="PAN / VAT Certificate" desc="Valid tax filing certificate"    file={taxCert} onChange={e => setTax(e.target.files[0])} required={!isRejected} />

        {/* Progress bar */}
        <div style={{ marginTop: 14, marginBottom: 16 }}>
          <div style={{ height: 3, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(uploaded / 3) * 100}%`, background: '#16A34A', borderRadius: 4, transition: 'width 0.4s ease' }} />
          </div>
          <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 5 }}>
            {uploaded === 3 ? '✓ All documents ready — submit when ready' : `${3 - uploaded} document${3 - uploaded !== 1 ? 's' : ''} still needed`}
          </p>
        </div>

        <button type="submit" disabled={submitting} className="sob-submit-btn">
          {submitting ? (
            <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'sob-spin 0.7s linear infinite', display: 'inline-block' }} /> Filing…</>
          ) : (
            <>Submit for Review <IArrow /></>
          )}
        </button>
        <p style={{ textAlign: 'center', fontSize: 10, color: '#d1d5db', marginTop: 8 }}>PDF, JPG, PNG · Max 10MB per file</p>
      </form>
    </>
  );
};

export default SellerOnboarding;
