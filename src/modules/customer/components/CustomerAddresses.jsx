import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
    <div className="flex items-center gap-2 py-8 text-gray-400 text-sm">
      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Loading addresses…
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
        <h2 className="text-xs font-black uppercase tracking-wider text-gray-800">My Addresses</h2>
        <button
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-sm transition-colors duration-150"
          onClick={openAdd}
        >
          Add Address
        </button>
      </div>

      {/* Address modal */}
      {form && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 w-full max-w-md rounded-sm shadow-xl overflow-hidden p-5 md:p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-800 mb-4 pb-2 border-b border-gray-100">
              {editing ? '✏️ Edit Address' : '📍 Add Address'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Label (e.g. Home, Office)</label>
                  <input
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-xs outline-none focus:border-emerald-600 transition-colors"
                    name="label" value={form.label || ''} onChange={handleChange} placeholder="e.g. Home"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Phone Number</label>
                  <input
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-xs outline-none focus:border-emerald-600 transition-colors"
                    name="phone" value={form.phone || ''} onChange={handleChange} placeholder="98XXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Street Address</label>
                <input
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-xs outline-none focus:border-emerald-600 transition-colors"
                  name="street" value={form.street || ''} onChange={handleChange} placeholder="Street, Tole, Area" required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">City</label>
                  <input
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-xs outline-none focus:border-emerald-600 transition-colors"
                    name="city" value={form.city || ''} onChange={handleChange} placeholder="City" required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">District</label>
                  <input
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-xs outline-none focus:border-emerald-600 transition-colors"
                    name="district" value={form.district || ''} onChange={handleChange} placeholder="District"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Province</label>
                  <input
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-xs outline-none focus:border-emerald-600 transition-colors"
                    name="province" value={form.province || ''} onChange={handleChange} placeholder="Province"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Postal Code</label>
                  <input
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-sm text-xs outline-none focus:border-emerald-600 transition-colors"
                    name="postalCode" value={form.postalCode || ''} onChange={handleChange} placeholder="44600"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[10px] text-gray-500 py-1">
                <input
                  type="checkbox" name="isDefault"
                  checked={form.isDefault || false} onChange={handleChange}
                  className="rounded-sm border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Set as default billing/shipping address
              </label>

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-wider py-2.5 border border-gray-200 rounded-sm transition-colors"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-5 rounded-sm transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-sm">
          <div className="text-4xl mb-3">📍</div>
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-1">No addresses saved</h3>
          <p className="text-[10px] text-gray-400 mb-4">Add a delivery address to use during checkout.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`
                relative bg-white border p-4 rounded-sm flex flex-col justify-between transition-all duration-200
                ${addr.isDefault ? 'border-emerald-600 shadow-sm' : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              {addr.isDefault && (
                <span className="absolute top-3 right-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                  Default
                </span>
              )}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-2">
                  {addr.label ? addr.label : 'Address'}
                </div>
                <div className="text-xs text-gray-800 leading-relaxed font-medium">
                  {addr.street}<br />
                  {[addr.city, addr.district, addr.province].filter(Boolean).join(', ')}
                  {addr.postalCode && <span className="block mt-1 text-gray-400 text-[10px]">Postal Code: {addr.postalCode}</span>}
                </div>
                {addr.phone && (
                  <div className="text-[10px] text-gray-400 mt-2 font-semibold">
                    📞 {addr.phone}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  className="bg-white hover:bg-gray-50 text-gray-600 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 border border-gray-200 rounded-sm transition-colors duration-150"
                  onClick={() => openEdit(addr)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-50 hover:bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 border border-red-100 rounded-sm transition-colors duration-150"
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
