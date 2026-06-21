import React from 'react';
import {
  X, SlidersHorizontal, Loader2, CheckCircle2, AlertTriangle,
  Plus, Trash2, Upload,
} from 'lucide-react';
import { imgSrc } from './InventoryComponents';

/**
 * InventoryModals — Contains two overlays:
 *  1. Delete Confirmation dialog  (rendered when confirmDelete is set)
 *  2. Edit / Create Product panel (rendered when editing is set)
 *
 * All state lives in the parent SellerInventory. This component is pure UI.
 */
export default function InventoryModals({
  // ── Edit panel ──────────────────────────────────────────
  editing,
  form,
  variants,
  attrKeys,
  activeTab,
  saving,
  newImages,
  isDark,
  newAttrKey,
  onClose,
  onSave,
  onTabChange,
  onFormChange,
  onVariantChange,
  onVariantAttrChange,
  onAddAttrKey,
  onRemoveAttrKey,
  onAddVariant,
  onRemoveVariant,
  onEnableVariantsMode,   // opens variant mode + seeds defaults
  onImageChange,
  onRemoveImage,          // -1 = clear all; idx = remove one
  onSetNewAttrKey,
  // ── Delete confirm ───────────────────────────────────────
  confirmDelete,
  onCancelDelete,
  onDeleteConfirm,
}) {
  const inputCls = `w-full border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-all duration-200 ${
    isDark
      ? 'bg-zinc-900 border-white/[0.08] text-white placeholder-zinc-650 focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/20'
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#16A34A] focus:ring-1 focus:ring-emerald-500/15'
  }`;

  const labelCls = `block text-[10px] font-extrabold uppercase tracking-widest mb-1.5 ${
    isDark ? 'text-zinc-400' : 'text-gray-500'
  }`;

  // ── Toggle switch helper ─────────────────────────────────
  const ToggleSwitch = ({ checked, onChange }) => (
    <div className="relative">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className={`w-10 h-5.5 rounded-full transition-colors ${
        isDark ? 'bg-zinc-800 peer-checked:bg-[#16A34A]' : 'bg-gray-300 peer-checked:bg-[#16A34A]'
      }`} />
      <div className={`absolute left-0.75 top-0.75 w-4.5 h-4.5 rounded-full shadow transition-transform peer-checked:translate-x-4.5 ${
        isDark ? 'bg-zinc-400 peer-checked:bg-white' : 'bg-white'
      }`} />
    </div>
  );

  return (
    <>
      {/* ══════════════════════════════════════════════════
          1. Delete Confirmation Modal
      ══════════════════════════════════════════════════ */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`rounded-2xl p-6 w-full max-w-xs shadow-2xl border animate-in fade-in-50 scale-in-95 transition-all duration-300 ${
            isDark ? 'bg-zinc-950 border-white/[0.08]' : 'bg-white border-gray-250'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
              isDark
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-red-50 border border-red-150 text-red-550'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className={`text-sm font-bold text-center mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Delete Product?
            </h3>
            <p className={`text-[11px] font-semibold text-center mb-5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              This permanently deletes{' '}
              <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>
                "{confirmDelete.name}"
              </span>{' '}
              and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancelDelete}
                className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                  isDark
                    ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    : 'border-gray-250 text-gray-650 hover:bg-gray-55'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => onDeleteConfirm(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-white bg-red-650 hover:bg-red-750 transition-colors shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          2. Edit / Create Product Panel
      ══════════════════════════════════════════════════ */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in-50 scale-in-98 transition-all duration-300 ${
            isDark
              ? 'bg-zinc-950 border-white/[0.08] text-white'
              : 'bg-white border-gray-250 text-zinc-900'
          }`}>

            {/* ── Panel Header ── */}
            <div className={`px-6 py-5 border-b flex items-center justify-between ${
              isDark ? 'border-white/[0.08] bg-zinc-950' : 'border-gray-100 bg-gray-50'
            }`}>
              <div>
                <h2 className={`text-sm font-black uppercase tracking-wide flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  <SlidersHorizontal className="w-4 h-4 text-[#16A34A]" />
                  {editing.isCreation ? 'Create New Product' : 'Product Configuration'}
                </h2>
                <p className={`text-[10.5px] font-semibold truncate max-w-[350px] mt-1 ${isDark ? 'text-zinc-450' : 'text-gray-500'}`}>
                  {editing.isCreation ? 'Configure new storefront listing' : editing.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-all ${
                  isDark
                    ? 'text-zinc-550 hover:text-white hover:bg-zinc-900'
                    : 'text-gray-450 hover:text-gray-800 hover:bg-gray-150'
                }`}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* ── Navigation Tabs ── */}
            <div className={`px-6 py-3 border-b flex gap-2 overflow-x-auto shrink-0 ${
              isDark ? 'bg-zinc-950 border-white/[0.08]' : 'bg-white border-gray-100'
            }`}>
              {[
                { id: 'details',   label: 'Detailed Description'    },
                { id: 'inventory', label: 'Pricing & Stock levels'   },
                { id: 'images',    label: 'Media Assets'             },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? isDark ? 'bg-white text-zinc-950 shadow-sm' : 'bg-zinc-900 text-white'
                      : isDark ? 'text-zinc-450 hover:text-white hover:bg-zinc-900/60' : 'text-gray-500 hover:text-gray-850 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Panel Body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-4">

              {/* ════════ TAB: DETAILS ════════ */}
              {activeTab === 'details' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className={labelCls}>Product Display Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => onFormChange('name', e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Wireless Noise-Cancelling Headphones"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Product Category</label>
                      <input
                        value={form.category}
                        onChange={(e) => onFormChange('category', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Audio Electronics"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Brand / Manufacturer</label>
                      <input
                        value={form.brand}
                        onChange={(e) => onFormChange('brand', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Sony"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Short Description Summary</label>
                    <textarea
                      rows={2}
                      value={form.shortDescription}
                      onChange={(e) => onFormChange('shortDescription', e.target.value)}
                      className={`${inputCls} resize-none`}
                      placeholder="Key highlights displayed below product title..."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Full Product Description</label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => onFormChange('description', e.target.value)}
                      className={`${inputCls} resize-none`}
                      placeholder="Comprehensive product copy..."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Technical Specifications</label>
                    <textarea
                      rows={2}
                      value={form.specification}
                      onChange={(e) => onFormChange('specification', e.target.value)}
                      className={`${inputCls} resize-none`}
                      placeholder="e.g. Battery: 30 hours, Weight: 250g, BT 5.2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Warranty Duration (months)</label>
                      <input
                        type="number"
                        value={form.warrantyMonths}
                        onChange={(e) => onFormChange('warrantyMonths', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. 12"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ TAB: PRICING & STOCK ════════ */}
              {activeTab === 'inventory' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                  {form.hasVariants ? (
                    /* ── Variant mode ── */
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-white/[0.08]' : 'border-gray-150'}`}>
                        <div>
                          <h3 className={`text-xs font-black flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            Configure Multi-Variant Matrices
                          </h3>
                          <p className={`text-[10px] font-semibold mt-0.5 ${isDark ? 'text-zinc-500' : 'text-gray-550'}`}>
                            Define variant attributes like Size or Color, along with custom SKUs, pricing, and stock count.
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-md ${
                            isDark ? 'bg-zinc-900 text-zinc-350 border border-white/[0.06]' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {variants.length} active variant{variants.length !== 1 ? 's' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => onFormChange('hasVariants', false)}
                            className="text-[10px] font-extrabold uppercase tracking-wider text-red-500 hover:text-red-405 transition-colors"
                          >
                            Disable variants
                          </button>
                        </div>
                      </div>

                      {/* Step 1: Define attribute keys */}
                      <div className={`border rounded-xl p-4.5 space-y-3.5 transition-colors ${
                        isDark ? 'bg-zinc-950/60 border-white/[0.08]' : 'bg-gray-50/50 border-gray-200'
                      }`}>
                        <label className={labelCls}>1. Define Variant Attributes (e.g. Size, Color, Capacity)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newAttrKey}
                            onChange={(e) => onSetNewAttrKey(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddAttrKey(); } }}
                            placeholder="e.g. Size, Color..."
                            className={inputCls}
                          />
                          <button
                            type="button"
                            onClick={onAddAttrKey}
                            className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-4.5 py-2.5 rounded-xl transition-all ${
                              isDark ? 'bg-white text-zinc-950 hover:bg-zinc-150' : 'bg-zinc-900 hover:bg-black text-white'
                            }`}
                          >
                            + Add Key
                          </button>
                        </div>
                        {attrKeys.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {attrKeys.map((key) => (
                              <span
                                key={key}
                                className={`flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider pl-3 pr-1.5 py-1.5 rounded-lg border shadow-sm ${
                                  isDark
                                    ? 'bg-zinc-900 border-white/[0.06] text-zinc-300'
                                    : 'bg-white border-gray-200 text-gray-700'
                                }`}
                              >
                                {key}
                                <button
                                  type="button"
                                  onClick={() => onRemoveAttrKey(key)}
                                  className="text-red-400 hover:text-red-500 p-0.5 rounded-md hover:bg-red-500/10 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Step 2: Configure individual variants */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className={labelCls}>2. Configure Individual Variant Options</label>
                          <button
                            type="button"
                            onClick={onAddVariant}
                            className="text-[10.5px] font-black uppercase tracking-wider hover:underline flex items-center gap-1 text-[#16A34A] dark:text-emerald-450"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Variant Option
                          </button>
                        </div>

                        <div className="space-y-4.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {variants.length === 0 ? (
                            <div className={`text-center py-8 rounded-xl border border-dashed ${
                              isDark ? 'border-white/[0.1] bg-zinc-950/40' : 'border-gray-300 bg-gray-50/50'
                            }`}>
                              <p className={`text-[10.5px] font-semibold ${isDark ? 'text-zinc-550' : 'text-gray-400'}`}>
                                No variant configurations defined. Click "+ Add Variant Option" above to begin.
                              </p>
                            </div>
                          ) : (
                            variants.map((v, i) => (
                              <div
                                key={v.id || i}
                                className={`border rounded-xl p-4.5 space-y-3.5 relative transition-all ${
                                  isDark
                                    ? 'bg-zinc-950 border-white/[0.08] hover:border-zinc-700'
                                    : 'bg-white border-gray-250 hover:border-gray-300'
                                }`}
                              >
                                <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-white/[0.04]' : 'border-gray-100'}`}>
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-450' : 'text-gray-550'}`}>
                                    Variant Option #{i + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onRemoveVariant(i)}
                                    className="transition-colors p-1.5 rounded-lg text-red-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {attrKeys.length > 0 && (
                                  <div className={`grid gap-3.5 ${attrKeys.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    {attrKeys.map((key) => (
                                      <div key={key}>
                                        <label className={labelCls}>{key}</label>
                                        <input
                                          type="text"
                                          value={v.attributes?.[key] || ''}
                                          onChange={(e) => onVariantAttrChange(i, key, e.target.value)}
                                          placeholder={`e.g. value for ${key}`}
                                          className={inputCls}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className={`grid grid-cols-3 gap-3.5 pt-3.5 border-t ${isDark ? 'border-white/[0.04]' : 'border-gray-100'}`}>
                                  {[
                                    { lbl: 'Variant SKU',        field: 'sku',           type: 'text',   ph: 'e.g. SKU-RED-SM' },
                                    { lbl: 'Selling Price (Rs.)', field: 'price',         type: 'number', ph: '0.00'            },
                                    { lbl: 'Stock Level',        field: 'stockQuantity', type: 'number', ph: '0'               },
                                  ].map((f) => (
                                    <div key={f.field}>
                                      <label className={labelCls}>{f.lbl}</label>
                                      <input
                                        type={f.type}
                                        value={v[f.field]}
                                        onChange={(e) => onVariantChange(i, f.field, e.target.value)}
                                        placeholder={f.ph}
                                        className={inputCls}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                  ) : (
                    /* ── Standard (single-product) mode ── */
                    <div className="space-y-5">
                      <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-white/[0.08]' : 'border-gray-150'}`}>
                        <div>
                          <h3 className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            Standard Stock Configuration
                          </h3>
                          <p className={`text-[10px] font-semibold mt-0.5 ${isDark ? 'text-zinc-500' : 'text-gray-555'}`}>
                            Adjust pricing and stock levels directly.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onEnableVariantsMode}
                          className="text-[10.5px] font-black uppercase tracking-wider hover:underline text-[#16A34A] dark:text-emerald-450"
                        >
                          Enable variants mode
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Selling Price (Rs.)</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rs.</span>
                            <input
                              type="number"
                              value={form.price}
                              onChange={(e) => onFormChange('price', e.target.value)}
                              className={`${inputCls} pl-10`}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Stock Quantity</label>
                          <input
                            type="number"
                            value={form.stockQuantity}
                            onChange={(e) => onFormChange('stockQuantity', e.target.value)}
                            className={inputCls}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Sale toggle */}
                      <div className={`border rounded-xl p-4.5 transition-all duration-200 ${
                        form.onSale
                          ? isDark ? 'bg-amber-500/5 border-amber-500/25' : 'bg-amber-50/40 border-amber-200'
                          : isDark ? 'bg-zinc-950/40 border-white/[0.08]'  : 'bg-gray-50/50 border-gray-200'
                      }`}>
                        <label className="flex items-center gap-3.5 cursor-pointer select-none">
                          <ToggleSwitch
                            checked={form.onSale}
                            onChange={(e) => onFormChange('onSale', e.target.checked)}
                          />
                          <span className={`text-[10.5px] font-black tracking-wider uppercase ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            Apply Discounted Sale Price
                          </span>
                        </label>
                        {form.onSale && (
                          <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-amber-100'} animate-in fade-in-50 duration-200`}>
                            <label className={labelCls}>Discount Price (Rs.)</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rs.</span>
                              <input
                                type="number"
                                value={form.discountPrice}
                                onChange={(e) => onFormChange('discountPrice', e.target.value)}
                                className={`${inputCls} pl-10`}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Shipping */}
                      <div className={`space-y-4 pt-4 border-t ${isDark ? 'border-white/[0.08]' : 'border-gray-150'}`}>
                        <label className={labelCls}>Logistics & Shipping Configuration</label>
                        <label className="flex items-center gap-3.5 cursor-pointer select-none">
                          <ToggleSwitch
                            checked={form.freeShipping}
                            onChange={(e) => onFormChange('freeShipping', e.target.checked)}
                          />
                          <span className={`text-[10.5px] font-black tracking-wider uppercase ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            Eligible for Store-funded Free Shipping
                          </span>
                        </label>
                        {!form.freeShipping && (
                          <div className="grid grid-cols-2 gap-4 animate-in fade-in-50 duration-200">
                            <div>
                              <label className={labelCls}>Inside Valley Delivery Fee (Rs.)</label>
                              <input
                                type="number"
                                value={form.insideValleyShipping}
                                onChange={(e) => onFormChange('insideValleyShipping', e.target.value)}
                                className={inputCls}
                                placeholder="e.g. 100"
                              />
                            </div>
                            <div>
                              <label className={labelCls}>Outside Valley Delivery Fee (Rs.)</label>
                              <input
                                type="number"
                                value={form.outsideValleyShipping}
                                onChange={(e) => onFormChange('outsideValleyShipping', e.target.value)}
                                className={inputCls}
                                placeholder="e.g. 200"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════ TAB: IMAGES ════════ */}
              {activeTab === 'images' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Existing gallery */}
                  <div>
                    <h3 className={`text-xs font-black mb-3 ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                      Active Product Gallery
                    </h3>
                    {(!editing.imagePaths || editing.imagePaths.length === 0) ? (
                      <p className={`text-[10.5px] font-semibold ${isDark ? 'text-zinc-550' : 'text-gray-400'}`}>
                        No images uploaded for this catalog product.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3.5">
                        {editing.imagePaths.map((path, idx) => (
                          <div
                            key={idx}
                            className={`relative aspect-square rounded-xl overflow-hidden border group ${
                              isDark ? 'bg-zinc-900 border-white/[0.08]' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <img src={imgSrc(path)} alt="Catalog asset" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-zinc-950/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                              <span className="text-[9.5px] text-white font-extrabold uppercase tracking-widest bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-white/[0.08]">
                                Asset {idx + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upload new images */}
                  <div className={`space-y-4 pt-4 border-t ${isDark ? 'border-white/[0.08]' : 'border-gray-150'}`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                        Append New Media Assets
                      </h3>
                      <p className={`text-[9px] font-extrabold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                        Accepts JPG, PNG, WEBP
                      </p>
                    </div>

                    <div className={`relative border border-dashed rounded-2xl p-7 transition-all text-center cursor-pointer group ${
                      isDark
                        ? 'border-white/[0.15] bg-zinc-950/20 hover:bg-zinc-950/45 hover:border-[#16A34A]/50'
                        : 'border-gray-250 hover:border-[#16A34A]/50 bg-gray-50/50 hover:bg-emerald-50/20'
                    }`}>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={onImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-3.5">
                        <div className={`p-3 rounded-2xl border transition-colors shadow-sm ${
                          isDark
                            ? 'bg-zinc-900 border-white/[0.06] text-zinc-400 group-hover:text-[#16A34A] group-hover:border-[#16A34A]/30'
                            : 'bg-white border-gray-200 text-gray-400 group-hover:text-[#16A34A] group-hover:border-[#16A34A]/30'
                        }`}>
                          <Upload className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <span className={`block text-xs font-black uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                            Select Files or Drag and Drop
                          </span>
                          <span className={`block text-[10px] font-medium mt-1 ${isDark ? 'text-zinc-550' : 'text-gray-400'}`}>
                            Assets will upload and queue immediately. Save changes to commit.
                          </span>
                        </div>
                      </div>
                    </div>

                    {newImages.length > 0 && (
                      <div className="space-y-3.5">
                        <div className={`flex justify-between items-center border-b pb-2 ${isDark ? 'border-white/[0.04]' : 'border-gray-100'}`}>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-350' : 'text-gray-655'}`}>
                            Queued {newImages.length} asset{newImages.length !== 1 ? 's' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveImage(-1)}
                            className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-405 transition-colors"
                          >
                            Clear Queue
                          </button>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3.5">
                          {newImages.map((file, idx) => {
                            const url = URL.createObjectURL(file);
                            return (
                              <div
                                key={idx}
                                className={`relative aspect-square rounded-xl overflow-hidden border group ${
                                  isDark ? 'bg-zinc-900 border-white/[0.08]' : 'bg-gray-50 border-gray-205'
                                }`}
                              >
                                <img src={url} alt="Queue asset preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => onRemoveImage(idx)}
                                  className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/75 text-white hover:bg-red-600 transition-all shadow-md opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Panel Footer ── */}
            <div className={`px-6 py-4.5 border-t flex gap-3.5 ${
              isDark ? 'border-white/[0.08] bg-zinc-950/60' : 'border-gray-100 bg-gray-50/50'
            }`}>
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                  isDark
                    ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    : 'border-gray-250 text-gray-650 bg-white hover:bg-gray-50 shadow-sm'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-60 flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isDark ? 'bg-[#16A34A] hover:bg-[#15803D]' : 'bg-zinc-950 hover:bg-black shadow-zinc-350/20'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 text-white" />
                    {editing?.isCreation ? 'Creating product...' : 'Saving changes...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {editing?.isCreation ? 'Create Listing' : 'Save configuration'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
