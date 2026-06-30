import React, { useEffect, useState, useCallback } from 'react';
import { getAddresses, addAddress, updateAddress, deleteAddress } from '../../../shared/api/customerApi';
import { useCustomer } from '../contexts/CustomerContext';

const ADDRESS_TYPES = ['Home', 'Office', 'Other'];

const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];

// Nepal mobile numbers: 10 digits starting with 9 (landlines vary, so keep this permissive-but-sane)
const PHONE_RE = /^9\d{9}$/;
const POSTAL_RE = /^\d{4,6}$/;

const BLANK = {
  label: 'Home',
  fullName: '',
  phone: '',
  street: '',
  landmark: '',
  city: '',
  district: '',
  province: '',
  postalCode: '',
  country: 'Nepal',
  isDefault: false,
};

/* Small reusable field wrapper: icon chip + input/select, matches the reference's pill-icon style */
const FieldIcon = ({ children }) => (
  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-[#10B981] flex-shrink-0">
    {children}
  </span>
);

const HomeSvg = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
  </svg>
);
const OfficeSvg = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const OtherSvg = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const TYPE_ICON = { Home: HomeSvg, Office: OfficeSvg, Other: OtherSvg };

const PhoneSvg = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);
const UserSvg = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const PinSvg = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const CitySvg = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const DistrictSvg = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" />
  </svg>
);
const MapSvg = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);
const MailSvg = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const GlobeSvg = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
  </svg>
);
const ChevronSvg = (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const inputCls =
  'flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-gray-400 outline-none';
const fieldWrapCls =
  'flex items-center gap-3 px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white focus-within:border-[#10B981] focus-within:ring-2 focus-within:ring-emerald-50 transition-all';

const CustomerAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null=closed
  const [editing, setEditing] = useState(null); // id or null
  const [saving, setSaving] = useState(false);
  const [showLandmark, setShowLandmark] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const { user } = useCustomer();
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getAddresses(userId);
      setAddresses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAddresses([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...BLANK, userId: Number(userId) });
    setShowLandmark(false);
    setFieldErrors({});
  };
  const openEdit = (addr) => {
    setEditing(addr.id);
    setForm({ ...BLANK, ...addr });
    setShowLandmark(!!addr.landmark);
    setFieldErrors({});
  };
  const closeForm = () => {
    setForm(null);
    setEditing(null);
    setFieldErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setFieldErrors((p) => (p[name] ? { ...p, [name]: undefined } : p));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName?.trim()) errs.fullName = 'Full name is required.';
    if (!PHONE_RE.test(String(form.phone || '').trim())) errs.phone = 'Enter a valid 10-digit number starting with 9.';
    if (!form.street?.trim()) errs.street = 'Street address is required.';
    if (!form.city?.trim()) errs.city = 'City is required.';
    if (!form.district?.trim()) errs.district = 'District is required.';
    if (!form.province) errs.province = 'Select a province.';
    if (!POSTAL_RE.test(String(form.postalCode || '').trim())) errs.postalCode = 'Enter a valid postal code.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setSaving(true);
    try {
      if (editing) await updateAddress(editing, form);
      else await addAddress(userId, form);
      await load();
      closeForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    setDeletingId(id);
    try {
      await deleteAddress(id);
      await load();
    } catch {
      alert('Delete failed');
    }
    setDeletingId(null);
  };

  // Close the modal on Escape
  useEffect(() => {
    if (!form) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeForm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [form]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
        <svg className="animate-spin w-6 h-6 text-[#10B981] mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-xs font-black uppercase tracking-wider text-gray-400">Loading addresses...</p>
      </div>
    );
  }

  return (
    <div className="pb-10 animate-in fade-in duration-300 font-sans text-gray-900">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-[22px] font-black tracking-tight leading-tight mb-1">My Addresses</h2>
          <p className="text-xs text-gray-500 font-semibold">Manage your shipping and billing locations.</p>
        </div>
        <button
          className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
          onClick={openAdd}
        >
          + Add New Address
        </button>
      </div>

      {/* ── Address Form Modal ── */}
      {form && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className="bg-white border-2 border-[#0a2e16] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-7 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-start gap-4">
                <span className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-[#10B981] flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{editing ? 'Edit Address' : 'Add New Address'}</h3>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                    {editing ? 'Update the details for this address.' : 'Fill in the details below to add a new address.'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeForm}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-[#10B981] hover:bg-emerald-50 transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body (scrollable) */}
            <form id="address-form" onSubmit={handleSubmit} className="px-7 py-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Address Type <span className="text-red-500">*</span>
                  </label>
                  <div className={fieldWrapCls}>
                    <FieldIcon>{TYPE_ICON[form.label] || HomeSvg}</FieldIcon>
                    <select name="label" value={form.label || 'Home'} onChange={handleChange} className={`${inputCls} appearance-none cursor-pointer`}>
                      {ADDRESS_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {ChevronSvg}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className={`${fieldWrapCls} ${fieldErrors.phone ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-50' : ''}`}>
                    <FieldIcon>{PhoneSvg}</FieldIcon>
                    <input
                      className={inputCls}
                      name="phone"
                      inputMode="numeric"
                      value={form.phone || ''}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  {fieldErrors.phone && <p className="text-xs text-red-500 font-semibold mt-1.5">{fieldErrors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className={`${fieldWrapCls} ${fieldErrors.fullName ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-50' : ''}`}>
                  <FieldIcon>{UserSvg}</FieldIcon>
                  <input className={inputCls} name="fullName" value={form.fullName || ''} onChange={handleChange} placeholder="Enter full name" required />
                </div>
                {fieldErrors.fullName && <p className="text-xs text-red-500 font-semibold mt-1.5">{fieldErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <div className={`${fieldWrapCls} ${fieldErrors.street ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-50' : ''}`}>
                  <FieldIcon>{PinSvg}</FieldIcon>
                  <input
                    className={inputCls}
                    name="street"
                    value={form.street || ''}
                    onChange={handleChange}
                    placeholder="House no., Building, Street, Area"
                    required
                  />
                </div>
                {fieldErrors.street && <p className="text-xs text-red-500 font-semibold mt-1.5">{fieldErrors.street}</p>}

                {showLandmark ? (
                  <div className="mt-2.5">
                    <div className={fieldWrapCls}>
                      <FieldIcon>{PinSvg}</FieldIcon>
                      <input
                        className={inputCls}
                        name="landmark"
                        value={form.landmark || ''}
                        onChange={handleChange}
                        placeholder="Nearby landmark (optional)"
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLandmark(true)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-bold text-[#16A34A] hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Landmarks (Optional)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className={`${fieldWrapCls} ${fieldErrors.city ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-50' : ''}`}>
                    <FieldIcon>{CitySvg}</FieldIcon>
                    <input className={inputCls} name="city" value={form.city || ''} onChange={handleChange} placeholder="Enter city" required />
                  </div>
                  {fieldErrors.city && <p className="text-xs text-red-500 font-semibold mt-1.5">{fieldErrors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    District <span className="text-red-500">*</span>
                  </label>
                  <div className={`${fieldWrapCls} ${fieldErrors.district ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-50' : ''}`}>
                    <FieldIcon>{DistrictSvg}</FieldIcon>
                    <input className={inputCls} name="district" value={form.district || ''} onChange={handleChange} placeholder="Enter district" required />
                  </div>
                  {fieldErrors.district && <p className="text-xs text-red-500 font-semibold mt-1.5">{fieldErrors.district}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    State / Province <span className="text-red-500">*</span>
                  </label>
                  <div className={`${fieldWrapCls} ${fieldErrors.province ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-50' : ''}`}>
                    <FieldIcon>{MapSvg}</FieldIcon>
                    <select name="province" value={form.province || ''} onChange={handleChange} className={`${inputCls} appearance-none cursor-pointer`} required>
                      <option value="" disabled>
                        Select state
                      </option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {ChevronSvg}
                  </div>
                  {fieldErrors.province && <p className="text-xs text-red-500 font-semibold mt-1.5">{fieldErrors.province}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <div className={`${fieldWrapCls} ${fieldErrors.postalCode ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-50' : ''}`}>
                    <FieldIcon>{MailSvg}</FieldIcon>
                    <input
                      className={inputCls}
                      name="postalCode"
                      inputMode="numeric"
                      value={form.postalCode || ''}
                      onChange={handleChange}
                      placeholder="Enter postal code"
                      required
                    />
                  </div>
                  {fieldErrors.postalCode && <p className="text-xs text-red-500 font-semibold mt-1.5">{fieldErrors.postalCode}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <div className={fieldWrapCls}>
                    <FieldIcon>{GlobeSvg}</FieldIcon>
                    <select name="country" value={form.country || 'Nepal'} onChange={handleChange} className={`${inputCls} appearance-none cursor-pointer`}>
                      <option value="Nepal">Nepal</option>
                      <option value="India">India</option>
                      <option value="China">China</option>
                      <option value="Other">Other</option>
                    </select>
                    {ChevronSvg}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={form.isDefault || false}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#10B981] focus:ring-[#10B981] cursor-pointer"
                />
                <div>
                  <span className="text-sm font-bold text-slate-800 inline-flex items-center gap-2">
                    Set as default shipping address
                    <span className="bg-emerald-50 text-[#16A34A] text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">Recommended</span>
                  </span>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">This address will be selected at checkout by default.</p>
                </div>
              </label>
            </form>

            {/* Footer */}
            <div className="flex gap-3 px-7 py-5 border-t border-gray-100 flex-shrink-0">
              <button
                type="button"
                className="flex-1 bg-white hover:bg-gray-50 text-[#16A34A] text-sm font-bold py-3 border border-[#16A34A] rounded-xl transition-colors cursor-pointer"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="address-form"
                className="flex-1 bg-[#0e6b34] hover:bg-emerald-800 text-white text-sm font-bold py-3 px-5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                disabled={saving}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8M7 3v5h8M5 21h14a2 2 0 002-2V7l-4-4H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {saving ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Address List ── */}
      {addresses.length === 0 ? (
        <div className="text-center py-20 px-6 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <span className="text-3xl">📍</span>
          </div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">No addresses saved</h3>
          <p className="text-xs text-gray-500 font-semibold mb-6">Add a delivery address to use during checkout.</p>
          <button
            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition-colors shadow-sm"
            onClick={openAdd}
          >
            + Add New Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative bg-white border p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                addr.isDefault
                  ? 'border-[#10B981]/40 shadow-md ring-1 ring-[#10B981]/20 bg-[#f0fdf4]/30'
                  : 'border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-gray-200'
              }`}
            >
              {addr.isDefault && (
                <span className="absolute top-5 right-5 bg-[#e6f7ec] border border-[#10B981]/30 text-[#10B981] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                  Default
                </span>
              )}
              <div className="pr-16">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-[#10B981] text-sm shadow-sm">
                    {addr.label?.toLowerCase() === 'home' ? '🏠' : addr.label?.toLowerCase() === 'office' ? '🏢' : '📍'}
                  </div>
                  <span className="text-[13px] font-black uppercase tracking-wider text-gray-900">{addr.label ? addr.label : 'Saved Address'}</span>
                </div>

                {addr.fullName && <p className="text-sm font-bold text-slate-800 mb-1.5">{addr.fullName}</p>}

                <div className="text-[13px] text-gray-600 leading-relaxed font-semibold bg-white p-3 rounded-xl border border-gray-50">
                  <span className="text-gray-900 font-black block mb-1">{addr.street}</span>
                  {addr.landmark && <span className="block text-gray-500 text-xs font-semibold mb-1">Near {addr.landmark}</span>}
                  {[addr.city, addr.district, addr.province].filter(Boolean).join(', ')}
                  {addr.postalCode && (
                    <span className="block mt-1.5 text-gray-400 text-[11px] font-bold uppercase tracking-wider">Postal Code: {addr.postalCode}</span>
                  )}
                </div>
                {addr.phone && (
                  <div className="text-xs text-gray-500 mt-3 font-bold flex items-center gap-1.5 px-1">
                    <span>📞</span> {addr.phone}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
                <button
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-[10px] font-black uppercase tracking-widest py-2 border border-gray-200 rounded-xl transition-colors text-center shadow-sm"
                  onClick={() => openEdit(addr)}
                >
                  Edit
                </button>
                <button
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest py-2 border border-red-100 rounded-xl transition-colors text-center shadow-sm disabled:opacity-50 cursor-pointer"
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                >
                  {deletingId === addr.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerAddresses;