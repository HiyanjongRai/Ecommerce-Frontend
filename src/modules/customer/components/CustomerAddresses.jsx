import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAddresses, addAddress, updateAddress, deleteAddress } from '../../../shared/api/customerApi';
import { useCustomer } from '../contexts/CustomerContext';

const BLANK = { label: '', street: '', city: '', district: '', province: '', postalCode: '', phone: '', isDefault: false };

const CustomerAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(null); // null=closed, {} = editing
  const [editing, setEditing]     = useState(null); // id or null
  const [saving, setSaving]       = useState(false);
  const { user } = useCustomer();
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getAddresses(userId);
      setAddresses(Array.isArray(res.data) ? res.data : []);
    } catch { setAddresses([]); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ ...BLANK, userId: Number(userId) }); };
  const openEdit = (addr) => { setEditing(addr.id); setForm({ ...addr }); };
  const closeForm = () => { setForm(null); setEditing(null); };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await updateAddress(editing, form);
      else         await addAddress(userId, form);
      await load(); closeForm();
    } catch (err) { alert(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try { await deleteAddress(id); await load(); } catch { alert('Delete failed'); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
      <svg className="animate-spin w-6 h-6 text-[#10B981] mb-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <p className="text-xs font-black uppercase tracking-wider text-gray-400">Loading addresses...</p>
    </div>
  );

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

      {/* Address modal */}
      {form && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-[#f0fdf4] px-6 py-5 border-b border-[#10B981]/10">
              <h3 className="text-[14px] font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <span className="text-lg">{editing ? '✏️' : '📍'}</span>
                {editing ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button 
                onClick={closeForm}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Label (e.g. Home, Office)</label>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#10B981] focus:ring-4 focus:ring-emerald-50 transition-all bg-gray-50/50 focus:bg-white"
                    name="label" value={form.label || ''} onChange={handleChange} placeholder="e.g. Home"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Phone Number</label>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#10B981] focus:ring-4 focus:ring-emerald-50 transition-all bg-gray-50/50 focus:bg-white"
                    name="phone" value={form.phone || ''} onChange={handleChange} placeholder="98XXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Street Address</label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#10B981] focus:ring-4 focus:ring-emerald-50 transition-all bg-gray-50/50 focus:bg-white"
                  name="street" value={form.street || ''} onChange={handleChange} placeholder="Street, Tole, Area" required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">City</label>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#10B981] focus:ring-4 focus:ring-emerald-50 transition-all bg-gray-50/50 focus:bg-white"
                    name="city" value={form.city || ''} onChange={handleChange} placeholder="City" required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">District</label>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#10B981] focus:ring-4 focus:ring-emerald-50 transition-all bg-gray-50/50 focus:bg-white"
                    name="district" value={form.district || ''} onChange={handleChange} placeholder="District"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Province</label>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#10B981] focus:ring-4 focus:ring-emerald-50 transition-all bg-gray-50/50 focus:bg-white"
                    name="province" value={form.province || ''} onChange={handleChange} placeholder="Province"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Postal Code</label>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#10B981] focus:ring-4 focus:ring-emerald-50 transition-all bg-gray-50/50 focus:bg-white"
                    name="postalCode" value={form.postalCode || ''} onChange={handleChange} placeholder="44600"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-700 py-3 bg-gray-50 px-4 rounded-xl border border-gray-100 mt-2">
                <input
                  type="checkbox" name="isDefault"
                  checked={form.isDefault || false} onChange={handleChange}
                  className="w-4 h-4 rounded-sm border-gray-300 text-[#10B981] focus:ring-[#10B981]"
                />
                Set as default billing & shipping address
              </label>

              <div className="flex gap-3 pt-5 mt-2">
                <button
                  type="button"
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-600 text-xs font-black uppercase tracking-wider py-3.5 border border-gray-200 rounded-xl transition-colors"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-black uppercase tracking-wider py-3.5 px-5 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`
                relative bg-white border p-6 rounded-2xl flex flex-col justify-between transition-all duration-300
                ${addr.isDefault 
                  ? 'border-[#10B981]/40 shadow-md ring-1 ring-[#10B981]/20 bg-[#f0fdf4]/30' 
                  : 'border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-gray-200'}
              `}
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
                  <span className="text-[13px] font-black uppercase tracking-wider text-gray-900">
                    {addr.label ? addr.label : 'Saved Address'}
                  </span>
                </div>
                
                <div className="text-[13px] text-gray-600 leading-relaxed font-semibold bg-white p-3 rounded-xl border border-gray-50">
                  <span className="text-gray-900 font-black block mb-1">{addr.street}</span>
                  {[addr.city, addr.district, addr.province].filter(Boolean).join(', ')}
                  {addr.postalCode && <span className="block mt-1.5 text-gray-400 text-[11px] font-bold uppercase tracking-wider">Postal Code: {addr.postalCode}</span>}
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
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest py-2 border border-red-100 rounded-xl transition-colors text-center shadow-sm"
                  onClick={() => handleDelete(addr.id)}
                >
                  Delete
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
