import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, BadgeCheck } from 'lucide-react';
import AdminLayout from '../../../app/layouts/AdminLayout';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { createAdminBrand, deleteAdminBrand, getAdminBrands, toggleAdminBrandFeatured, updateAdminBrand } from '../api/adminApi';

const blankForm = () => ({
  name: '',
  featured: false,
  displayOrder: '',
  logoUrl: '',
});

export default function AdminBrands() {
  const { themeClasses } = useAdminTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [form, setForm] = useState(blankForm());
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminBrands();
      setItems(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name.trim()) return;
    setWorking(true);
    const payload = {
      ...form,
      displayOrder: form.displayOrder === '' ? null : Number(form.displayOrder),
    };
    try {
      if (editing) {
        const res = await updateAdminBrand(editing.id, payload);
        setItems((current) => current.map((item) => (item.id === editing.id ? res.data : item)));
      } else {
        const res = await createAdminBrand(payload);
        setItems((current) => [res.data, ...current]);
      }
      setOpen(false);
      setEditing(null);
      setForm(blankForm());
    } finally {
      setWorking(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete brand "${item.name}"?`)) return;
    await deleteAdminBrand(item.id);
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  };

  const toggle = async (item) => {
    const res = await toggleAdminBrandFeatured(item.id);
    setItems((current) => current.map((entry) => (entry.id === item.id ? res.data : entry)));
  };

  return (
    <AdminLayout
      pageTitle="Brands"
      pageSubtitle="Featured brand rail management"
      headerActions={
        <button onClick={() => { setEditing(null); setForm(blankForm()); setOpen(true); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${themeClasses.button.primary}`}>
          <Plus size={14} /> Add Brand
        </button>
      }
    >
      <div className="p-4 lg:p-6 space-y-4">
        <div className={`rounded-[20px] border p-4 flex justify-end ${themeClasses.card} ${themeClasses.border.primary}`}>
          <button onClick={load} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${themeClasses.button.outline}`}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className={`rounded-[20px] border overflow-hidden ${themeClasses.card} ${themeClasses.border.primary}`}>
          <table className="w-full text-xs">
            <thead className={themeClasses.bg.secondary}>
              <tr>
                {['Brand', 'Featured', 'Order', 'Logo', 'Actions'].map((label) => (
                  <th key={label} className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center">No brands yet.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className={`border-t ${themeClasses.border.primary}`}>
                  <td className="px-4 py-3 font-semibold">{item.name}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(item)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${item.featured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <BadgeCheck size={12} /> {item.featured ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-3">{item.displayOrder ?? '—'}</td>
                  <td className="px-4 py-3">{item.logoUrl ? 'Set' : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditing(item); setForm({ ...blankForm(), ...item }); setOpen(true); }} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => remove(item)} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold text-rose-600">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className={`relative z-10 w-full max-w-lg rounded-2xl border p-5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <h3 className="text-base font-black mb-4">{editing ? 'Edit Brand' : 'Add Brand'}</h3>
            <div className="grid gap-3">
              <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Name" className="rounded-xl border px-3 py-2" />
              <input value={form.logoUrl} onChange={(e) => setForm((current) => ({ ...current, logoUrl: e.target.value }))} placeholder="Logo URL" className="rounded-xl border px-3 py-2" />
              <input type="number" value={form.displayOrder} onChange={(e) => setForm((current) => ({ ...current, displayOrder: e.target.value }))} placeholder="Display order" className="rounded-xl border px-3 py-2" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((current) => ({ ...current, featured: e.target.checked }))} /> Featured brand</label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-wider">Cancel</button>
              <button onClick={save} disabled={working} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white">{working ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
