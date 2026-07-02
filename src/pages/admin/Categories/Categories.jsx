import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Check, X } from 'lucide-react';
import AdminLayout from '../../../components/layout/AdminLayout/AdminLayout';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { createAdminCategory, deleteAdminCategory, getAdminCategories, updateAdminCategory } from '../../../services/adminApi';

const blankForm = () => ({
  name: '',
  description: '',
  showInSidebar: false,
  showOnHomepage: false,
  homepageOrder: '',
  iconUrl: '',
});

export default function AdminCategories() {
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
      const res = await getAdminCategories();
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
      homepageOrder: form.homepageOrder === '' ? null : Number(form.homepageOrder),
    };
    try {
      if (editing) {
        const res = await updateAdminCategory(editing.id, payload);
        setItems((current) => current.map((item) => (item.id === editing.id ? res.data : item)));
      } else {
        const res = await createAdminCategory(payload);
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
    if (!window.confirm(`Delete category "${item.name}"?`)) return;
    await deleteAdminCategory(item.id);
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  };

  return (
    <AdminLayout
      pageTitle="Categories"
      pageSubtitle="Sidebar and homepage category curation"
      headerActions={
        <button onClick={() => { setEditing(null); setForm(blankForm()); setOpen(true); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${themeClasses.button.primary}`}>
          <Plus size={14} /> Add Category
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
                {['Name', 'Sidebar', 'Homepage', 'Order', 'Icon', 'Actions'].map((label) => (
                  <th key={label} className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider ${themeClasses.text.tertiary}`}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center">No categories yet.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className={`border-t ${themeClasses.border.primary}`}>
                  <td className="px-4 py-3 font-semibold">{item.name}</td>
                  <td className="px-4 py-3">{item.showInSidebar ? <Check size={14} className="text-emerald-600" /> : <X size={14} className="text-slate-400" />}</td>
                  <td className="px-4 py-3">{item.showOnHomepage ? <Check size={14} className="text-emerald-600" /> : <X size={14} className="text-slate-400" />}</td>
                  <td className="px-4 py-3">{item.homepageOrder ?? '—'}</td>
                  <td className="px-4 py-3">{item.iconUrl ? <span className="text-[11px] text-slate-600">Set</span> : '—'}</td>
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
            <h3 className="text-base font-black mb-4">{editing ? 'Edit Category' : 'Add Category'}</h3>
            <div className="grid gap-3">
              <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Name" className="rounded-xl border px-3 py-2" />
              <input value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} placeholder="Description" className="rounded-xl border px-3 py-2" />
              <input value={form.iconUrl} onChange={(e) => setForm((current) => ({ ...current, iconUrl: e.target.value }))} placeholder="Icon URL" className="rounded-xl border px-3 py-2" />
              <input type="number" value={form.homepageOrder} onChange={(e) => setForm((current) => ({ ...current, homepageOrder: e.target.value }))} placeholder="Homepage order" className="rounded-xl border px-3 py-2" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.showInSidebar} onChange={(e) => setForm((current) => ({ ...current, showInSidebar: e.target.checked }))} /> Show in sidebar</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.showOnHomepage} onChange={(e) => setForm((current) => ({ ...current, showOnHomepage: e.target.checked }))} /> Show on homepage</label>
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
