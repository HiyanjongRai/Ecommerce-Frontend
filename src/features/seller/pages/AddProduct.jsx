import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSellerProduct } from '../api/sellerApi';

import { SectionHeader } from './SectionUtils';
import {
  Package, DollarSign, Truck, CheckCircle2, ChevronRight, ChevronLeft,
  Sparkles, Plus, Minus, AlertTriangle, BarChart3, Tag, Layers,
  ArrowLeft, Info, X, ChevronDown, ChevronUp, Star,
  Monitor, Cpu, Shirt, Footprints, Watch, Gem, FlaskConical, Home,
  Dumbbell, Briefcase, BookOpen, Baby, Car, ShoppingBasket
} from 'lucide-react';
import { useSellerTheme } from '../hooks/useSellerTheme';

// ─── Live Storefront Preview Component ───────────────────────────────────────

const fmtTitle = (str) => {
  if (!str) return '';
  const preserve = { pro: 'Pro', max: 'Max', hd: 'HD', tv: 'TV', gb: 'GB', usb: 'USB', ai: 'AI' };
  return str
    .split(' ')
    .map((w) => preserve[w.toLowerCase()] ?? (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
};

const ProductPreview = ({ form, variants, darkMode }) => {
  const hasVariants = form.hasVariants;
  const original = Number(form.price) || 0;
  
  let price = original;
  let isOnSale = false;
  let discount = 0;

  if (form.onSale) {
    if (form.discountPrice && Number(form.discountPrice) < original) {
      price = Number(form.discountPrice);
      isOnSale = true;
      discount = Math.round((1 - price / original) * 100);
    } else if (form.salePercentage) {
      const pct = Number(form.salePercentage);
      if (pct > 0 && pct < 100) {
        price = original - (original * pct) / 100;
        isOnSale = true;
        discount = Math.round(pct);
      }
    }
  }

  const stock = hasVariants
    ? variants.reduce((acc, curr) => acc + (Number(curr.stockQuantity) || 0), 0)
    : Number(form.stockQuantity) || 0;

  const outOfStock = stock <= 0;

  const resolvedImage = React.useMemo(() => {
    const file = form.images?.[0];
    if (file && (file instanceof File || file instanceof Blob)) {
      try {
        return URL.createObjectURL(file);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [form.images]);

  return (
    <div className={`group relative flex flex-col h-full w-full overflow-hidden transition-all duration-300 rounded-2xl border ${
      darkMode
        ? 'border-white/10 bg-[#0d1117] text-white shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
        : 'border-slate-100 bg-white text-slate-900 shadow-[0_2px_12px_rgba(15,23,42,0.06)]'
    }`}>
      <div className={`relative w-full h-[180px] flex items-center justify-center overflow-hidden ${
        darkMode ? 'bg-[#161b22]' : 'bg-slate-50'
      }`}>
        {discount > 0 && (
          <span className="absolute top-3 left-3 z-10 font-bold text-[9px] px-2 py-0.5 rounded-[6px] text-white bg-rose-500 animate-pulse-subtle">
            −{discount}%
          </span>
        )}
        
        {resolvedImage ? (
          <img src={resolvedImage} alt={form.name} className="max-h-full max-w-full object-contain p-2" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-300 dark:text-zinc-700">
            <Package className="h-10 w-10 stroke-[1]" />
            <span className="text-[10px] uppercase font-bold tracking-wider">No Image</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className={`font-semibold uppercase tracking-widest text-[9px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          {form.brand || form.category || 'Brand / Category'}
        </p>
        <h4 className={`line-clamp-2 font-bold leading-snug mt-1 text-[13px] min-h-[36px] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {fmtTitle(form.name) || 'Untitled Product'}
        </h4>

        <div className="flex items-center gap-1 mt-1">
          <span className="flex text-amber-400">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 text-slate-205" />
          </span>
          <span className={`text-[10px] font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>4.0</span>
          <span className="text-[10px] text-gray-400">(Mock Rating)</span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2 mt-2">
          <span className={`font-bold text-[16px] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Rs. {price.toLocaleString()}
          </span>
          {isOnSale && original > price && (
            <span className="line-through text-[11px] text-gray-400">
              Rs. {original.toLocaleString()}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {outOfStock ? (
            <span className="inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-rose-200 bg-rose-50 text-rose-600 text-[8px] px-2 py-0.5">
              Out of stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-emerald-200 bg-emerald-50 text-emerald-700 text-[8px] px-2 py-0.5">
              In stock {stock > 0 ? `(${stock})` : ''}
            </span>
          )}
          {form.freeShipping && (
            <span className="inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-blue-200 bg-blue-50 text-blue-700 text-[8px] px-2 py-0.5">
              <Truck className="h-2.5 w-2.5 animate-pulse" />
              Free shipping
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Category Icon Map ────────────────────────────────────────────────────────

const getCategoryIcon = (cat = '') => {
  const c = cat.toLowerCase();
  if (c.includes('electronics'))        return Monitor;
  if (c.includes('computer'))           return Cpu;
  if (c.includes('fashion'))            return Shirt;
  if (c.includes('footwear'))           return Footprints;
  if (c.includes('accessories'))        return Watch;
  if (c.includes('jewelry'))            return Gem;
  if (c.includes('beauty'))             return FlaskConical;
  if (c.includes('home'))               return Home;
  if (c.includes('sports'))             return Dumbbell;
  if (c.includes('bags'))               return Briefcase;
  if (c.includes('books'))              return BookOpen;
  if (c.includes('toys'))               return Baby;
  if (c.includes('automotive'))         return Car;
  if (c.includes('groceries'))          return ShoppingBasket;
  return Package;
};

const getCategoryColor = (cat = '') => {
  const c = cat.toLowerCase();
  if (c.includes('electronics'))  return { bg: 'bg-blue-50 dark:bg-blue-950/40',   icon: 'text-blue-500' };
  if (c.includes('computer'))     return { bg: 'bg-violet-50 dark:bg-violet-950/40', icon: 'text-violet-500' };
  if (c.includes('fashion'))      return { bg: 'bg-pink-50 dark:bg-pink-950/40',   icon: 'text-pink-500' };
  if (c.includes('footwear'))     return { bg: 'bg-orange-50 dark:bg-orange-950/40', icon: 'text-orange-500' };
  if (c.includes('accessories'))  return { bg: 'bg-amber-50 dark:bg-amber-950/40',  icon: 'text-amber-500' };
  if (c.includes('jewelry'))      return { bg: 'bg-yellow-50 dark:bg-yellow-950/40', icon: 'text-yellow-500' };
  if (c.includes('beauty'))       return { bg: 'bg-rose-50 dark:bg-rose-950/40',    icon: 'text-rose-500' };
  if (c.includes('home'))         return { bg: 'bg-teal-50 dark:bg-teal-950/40',    icon: 'text-teal-500' };
  if (c.includes('sports'))       return { bg: 'bg-green-50 dark:bg-green-950/40',  icon: 'text-green-500' };
  if (c.includes('bags'))         return { bg: 'bg-cyan-50 dark:bg-cyan-950/40',    icon: 'text-cyan-500' };
  if (c.includes('books'))        return { bg: 'bg-indigo-50 dark:bg-indigo-950/40', icon: 'text-indigo-500' };
  if (c.includes('toys'))         return { bg: 'bg-purple-50 dark:bg-purple-950/40', icon: 'text-purple-500' };
  if (c.includes('automotive'))   return { bg: 'bg-slate-50 dark:bg-slate-800/60',  icon: 'text-slate-500' };
  if (c.includes('groceries'))    return { bg: 'bg-lime-50 dark:bg-lime-950/40',    icon: 'text-lime-600' };
  return { bg: 'bg-gray-50 dark:bg-zinc-800/60', icon: 'text-gray-400' };
};

// ─── Constants (preserved verbatim) ──────────────────────────────────────────

const CATEGORIES = [
  'Electronics', 'Computers & Gaming', 'Fashion & Apparel', 'Footwear',
  'Accessories', 'Jewelry & Luxury', 'Beauty & Personal Care', 'Home & Living',
  'Sports & Fitness', 'Bags & Travel', 'Books & Stationery', 'Toys & Kids',
  'Automotive', 'Groceries & Essentials',
];

const COMMISSION_MAP = {
  electronics: 7.5, 'computers & gaming': 6.5, 'fashion & apparel': 20,
  footwear: 16, accessories: 20, 'jewelry & luxury': 15,
  'beauty & personal care': 20, 'home & living': 14, 'sports & fitness': 12.5,
  'bags & travel': 15, 'books & stationery': 7.5, 'toys & kids': 14,
  automotive: 8.5, 'groceries & essentials': 3.5,
};

const getCommission = (cat) => {
  if (!cat) return 15;
  const key = cat.toLowerCase().trim();
  for (const [k, v] of Object.entries(COMMISSION_MAP)) {
    if (key.includes(k)) return v;
  }
  return 15;
};

const INITIAL_FORM = {
  name: '', shortDescription: '', description: '', category: '', brand: '',
  specification: '', storageSpec: '', features: '', colorOptions: '',
  price: '', stockQuantity: '', warrantyMonths: '', onSale: false,
  discountPrice: '', salePercentage: '', freeShipping: false,
  insideValleyShipping: '', outsideValleyShipping: '',
  sellerFreeShippingMinOrder: '', hasVariants: false, images: [],
};

const createVariant   = () => ({ id: Date.now() + Math.random(), sku: '', price: '', stockQuantity: '', attributesText: '' });
const createAttrGroup = () => ({ id: Date.now() + Math.random(), name: '', valuesText: '' });

const parseAttrs = (text) =>
  text.split(',').map(p => p.trim()).filter(Boolean).reduce((attrs, pair) => {
    const [rawName, ...rawVal] = pair.split('=');
    const name = rawName?.trim(); const value = rawVal.join('=').trim();
    if (name && value) attrs[name] = value;
    return attrs;
  }, {});

const buildCombinations = (groups, basePrice) => {
  const parsed = groups
    .map(g => ({ name: g.name.trim(), values: g.valuesText.split(',').map(v => v.trim()).filter(Boolean) }))
    .filter(g => g.name && g.values.length > 0);
  if (!parsed.length) return [];
  const combos = parsed.reduce((acc, g) =>
    !acc.length ? g.values.map(v => ({ [g.name]: v })) : acc.flatMap(c => g.values.map(v => ({ ...c, [g.name]: v }))), []);
  return combos.map((attrs, i) => ({
    id: Date.now() + i, sku: '', price: basePrice || '', stockQuantity: '',
    attributesText: Object.entries(attrs).map(([n, v]) => `${n}=${v}`).join(', '),
  }));
};

const readApiError = (err, fallback) => {
  const d = err.response?.data;
  return (typeof d === 'string' ? d : d?.message || d?.error || err.message) || fallback;
};

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'details',  label: 'Product Details',    icon: Package    },
  { key: 'pricing',  label: 'Pricing & Inventory', icon: DollarSign },
  { key: 'shipping', label: 'Shipping & Review',   icon: Truck      },
];

// ─── Design tokens — premium (Shopify / Stripe / Linear) ──────────────────────
const T = {
  green:  '#22C55E',
  greenDk:'#16A34A',
  text:   '#111827',
  sub:    '#6B7280',
  muted:  '#9CA3AF',
  border: '#E5E7EB',
  divider:'#F3F4F6',
  bg:     '#F8FAF7',   // §1 – subtle green-tinted white, not bright
  card:   '#FFFFFF',
  warn:   '#FB923C',
  red:    '#EF4444',
};

// ─── Micro-components ─────────────────────────────────────────────────────────

// §3 – inputs: white bg, visible border, 14px radius, 44px height
const inputCls = [
  'w-full bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-white/[0.08] rounded-[14px]',
  'px-4 h-11 text-[13px] font-medium text-[#111827] dark:text-zinc-100',
  'placeholder-gray-400 dark:placeholder-zinc-550 outline-none',
  'focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/10 dark:focus:ring-[#16A34A]/25',
  'transition-all duration-150 shadow-sm',
].join(' ');

// §5 – typography: labels 600, body 400, meta gray-500
const Label = ({ children, required, optional }) => {
  const { darkMode } = useSellerTheme();
  return (
    <label className={`block text-[12.5px] font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {children}
      {required && (
        <span className="ml-2 text-[9.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-950/30">
          Required
        </span>
      )}
      {optional && (
        <span className="ml-2 text-[10px] font-medium text-gray-400 dark:text-zinc-550">Optional</span>
      )}
    </label>
  );
};

const Helper = ({ children }) => {
  const { darkMode } = useSellerTheme();
  return (
    <p className={`text-[11.5px] mt-1.5 leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>{children}</p>
  );
};

const Field = ({ label, required, optional, hint, children }) => (
  <div className="flex flex-col gap-0">
    {label && <Label required={required} optional={optional}>{label}</Label>}
    {children}
    {hint && <Helper>{hint}</Helper>}
  </div>
);

// Collapsible section — clean editorial style with left accent
const Collapsible = ({ title, icon: Icon, iconColor, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const { darkMode } = useSellerTheme();
  const resolvedIconColor = iconColor || (darkMode ? '#9CA3AF' : '#6B7280');
  return (
    <div className={`rounded-2xl overflow-hidden transition-all ${
      darkMode
        ? 'bg-zinc-950 border border-white/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.25)]'
        : 'bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]'
    }`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors text-left group ${
          open
            ? darkMode ? 'bg-zinc-900/50' : 'bg-gray-50/70'
            : darkMode ? 'hover:bg-zinc-900/30' : 'hover:bg-gray-50/60'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-[3px] h-5 rounded-full shrink-0 transition-all"
            style={{ background: open ? resolvedIconColor : (darkMode ? '#3f3f46' : '#d1d5db') }}
          />
          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: resolvedIconColor }} />
          <span className={`text-[13px] font-semibold tracking-tight ${
            darkMode ? 'text-zinc-200' : 'text-gray-800'
          }`}>{title}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-[10.5px] font-medium transition-colors ${
          open
            ? 'text-[#16A34A]'
            : darkMode ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-gray-400 group-hover:text-gray-600'
        }`}>
          <span>{open ? 'Collapse' : 'Expand'}</span>
          {open
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />
          }
        </div>
      </button>
      {open && (
        <div className={`px-5 py-5 border-t space-y-5 ${
          darkMode ? 'border-white/[0.07] bg-zinc-950' : 'border-gray-100 bg-white'
        }`}>
          {children}
        </div>
      )}
    </div>
  );
};

// Step indicator — §5 typography
const Stepper = ({ step, stepIdx }) => {
  const { darkMode } = useSellerTheme();
  return (
    <div className="flex items-center gap-0 w-full max-w-[560px]">
      {STEPS.map((s, i) => {
        const done   = i < stepIdx;
        const active = s.key === step;
        const Icon   = s.icon;
        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black border-2 transition-all duration-300 ${
                done
                  ? 'bg-[#16A34A] border-[#16A34A] text-white'
                  : active
                  ? `${darkMode ? 'bg-zinc-950 text-white' : 'bg-white text-[#16A34A]'} border-[#16A34A]`
                  : `${darkMode ? 'bg-zinc-900 border-white/[0.08] text-zinc-500' : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#9CA3AF]'}`
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                active ? 'text-[#16A34A]' : done ? 'text-[#16A34A]' : (darkMode ? 'text-zinc-500' : 'text-[#9CA3AF]')
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mb-5 mx-2 rounded-full transition-all duration-500 ${
                i < stepIdx ? 'bg-[#16A34A]' : (darkMode ? 'bg-zinc-800' : 'bg-[#E5E7EB]')
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// §11 – Card: 20px radius, consistent shadow, visible border
const Card = ({ children, className = '' }) => {
  const { darkMode } = useSellerTheme();
  return (
    <div className={`border rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.07)] p-6 transition-all ${
      darkMode ? 'bg-[#111111] border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.30)]' : 'bg-white border-[#E5E7EB]'
    } ${className}`}>
      {children}
    </div>
  );
};

// §5 – SectionTitle: 700 heading, 400 subtitle, clear divider
const SectionTitle = ({ title, subtitle }) => {
  const { darkMode } = useSellerTheme();
  return (
    <div className={`mb-6 pb-5 border-b ${darkMode ? 'border-white/[0.08]' : 'border-[#F3F4F6]'}`}>
      <h2 className={`text-[15px] font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
      {subtitle && (
        <p className={`text-[12.5px] mt-1.5 font-normal leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>{subtitle}</p>
      )}
    </div>
  );
};

// Review item — §11
const ReviewItem = ({ icon, label, value, ok }) => {
  const { darkMode } = useSellerTheme();
  return (
    <div className={`flex items-center gap-3.5 p-4 rounded-[16px] border transition-all ${
      ok
        ? (darkMode ? 'border-emerald-500/20 bg-emerald-950/20 hover:bg-emerald-950/30' : 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70')
        : (darkMode ? 'border-white/[0.08] bg-zinc-900 hover:bg-zinc-900/85' : 'border-[#E5E7EB] bg-[#FAFAFA] hover:bg-gray-50')
    }`}>
      <span className="text-xl shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>{label}</p>
        <p className={`text-[13px] font-semibold truncate ${
          ok ? 'text-[#16A34A]' : (darkMode ? 'text-zinc-400' : 'text-zinc-500')
        }`}>{value}</p>
      </div>
      {ok && <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const { darkMode } = useSellerTheme();
  const isDark = darkMode;

  // ── All state (preserved verbatim) ──────────────────────────────────────
  const [form, setForm]               = useState(INITIAL_FORM);
  const [step, setStep]               = useState('details');
  const [saving, setSaving]           = useState(false);
  const [message, setMessage]         = useState({ text: '', type: '' });
  const [variants, setVariants]       = useState([createVariant()]);
  const [attrGroups, setAttrGroups]   = useState([
    { id: 1, name: 'Model', valuesText: '' },
    { id: 2, name: 'Storage', valuesText: '' },
  ]);
  const [buyingPrice, setBuyingPrice]       = useState('');
  const [commissionRate, setCommissionRate] = useState('15');
  const [saleMode, setSaleMode]             = useState('price');
  const [showVatLedger, setShowVatLedger]   = useState(false);
  const [catSearch, setCatSearch]           = useState('');
  const [showCatDrop, setShowCatDrop]       = useState(false);
  const [success, setSuccess]               = useState(false);

  // Structured Lists for Features & Specs
  const [newFeature, setNewFeature] = useState('');
  const [specKey, setSpecKey]       = useState('');
  const [specVal, setSpecVal]       = useState('');
  const [featuresList, setFeaturesList] = useState([]);
  const [specsList, setSpecsList]       = useState([]);

  // Sync initial form features state
  useEffect(() => {
    if (form.features && featuresList.length === 0) {
      const parsed = form.features
        .split('\n')
        .map(f => f.replace(/^•\s*/, '').trim())
        .filter(Boolean);
      setFeaturesList(parsed);
    }
  }, [form.features]);

  // Sync initial form specs state
  useEffect(() => {
    if (form.specification && specsList.length === 0) {
      const parsed = form.specification
        .split('\n')
        .map(s => {
          const parts = s.split(':');
          const key = parts[0]?.trim();
          const val = parts.slice(1).join(':')?.trim();
          if (key && val) return { key, val };
          return null;
        })
        .filter(Boolean);
      setSpecsList(parsed);
    }
  }, [form.specification]);

  const syncFeatures = (list) => {
    const featuresStr = list.map(f => `• ${f}`).join('\n');
    setForm(prev => ({ ...prev, features: featuresStr }));
  };

  const syncSpecs = (list) => {
    const specsStr = list.map(s => `${s.key}: ${s.val}`).join('\n');
    setForm(prev => ({ ...prev, specification: specsStr }));
  };

  const handleAddFeature = () => {
    const clean = newFeature.trim();
    if (!clean) return;
    const newList = [...featuresList, clean];
    setFeaturesList(newList);
    syncFeatures(newList);
    setNewFeature('');
  };

  const handleAddSpec = () => {
    const keyClean = specKey.trim();
    const valClean = specVal.trim();
    if (!keyClean || !valClean) return;
    const newList = [...specsList, { key: keyClean, val: valClean }];
    setSpecsList(newList);
    syncSpecs(newList);
    setSpecKey('');
    setSpecVal('');
  };

  useEffect(() => {
    setCommissionRate(String(getCommission(form.category)));
  }, [form.category]);

  // Profit calc (preserved verbatim)
  const bp  = Number(buyingPrice) || 0;
  const sp  = Number(form.price)  || 0;
  const cr  = Number(commissionRate) || 0;
  const bpX = bp / 1.13; const bpVat = bp - bpX;
  const spX = sp / 1.13; const spVat = sp - spX;
  const vatPayable   = spVat - bpVat;
  const platformFee  = sp * (cr / 100);
  const netProfit    = (spX - bpX) - (vatPayable > 0 ? vatPayable : 0) - platformFee;
  const profitMargin = sp > 0 ? (netProfit / sp) * 100 : 0;

  // ── All handlers (preserved verbatim) ────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setForm(p => ({ ...p, [name]: files ? Array.from(files) : type === 'checkbox' ? checked : value }));
  };

  const handleProductTypeChange = (hasVariants) => {
    setForm(p => ({ ...p, hasVariants, stockQuantity: hasVariants ? '' : p.stockQuantity }));
    if (hasVariants && !variants.length) setVariants([createVariant()]);
  };

  const updateVariant     = (id, name, val) => setVariants(p => p.map(v => v.id === id ? { ...v, [name]: val } : v));
  const addVariant        = () => setVariants(p => [...p, createVariant()]);
  const removeVariant     = (id) => setVariants(p => p.length > 1 ? p.filter(v => v.id !== id) : p);
  const updateAttrGroup   = (id, name, val) => setAttrGroups(p => p.map(g => g.id === id ? { ...g, [name]: val } : g));
  const addAttrGroup      = () => setAttrGroups(p => [...p, createAttrGroup()]);
  const removeAttrGroup   = (id) => setAttrGroups(p => p.length > 1 ? p.filter(g => g.id !== id) : p);

  const generateVariants = () => {
    const generated = buildCombinations(attrGroups, form.price);
    if (!generated.length) { setMessage({ text: 'Add at least one attribute with values (e.g. Color = Red, Blue)', type: 'error' }); return; }
    setVariants(generated);
    setMessage({ text: `${generated.length} variant combinations generated. Set price and stock for each.`, type: 'success' });
  };

  const stepIdx = STEPS.findIndex(s => s.key === step);

  const goNext = () => {
    if (step === 'details' && !form.name.trim()) { setMessage({ text: 'Product name is required to continue.', type: 'error' }); return; }
    if (step === 'pricing' && !form.price) { setMessage({ text: 'Please enter a selling price to continue.', type: 'error' }); return; }
    setMessage({ text: '', type: '' });
    if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1].key);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      if (!form.name.trim()) { setStep('details');  throw new Error('Product name is required.'); }
      if (!form.price)       { setStep('pricing');  throw new Error('Selling price is required.'); }
      if (form.onSale) {
        const hasSP  = form.discountPrice  !== '';
        const hasPct = form.salePercentage !== '';
        if (hasSP === hasPct) { setStep('pricing'); throw new Error('Set either a sale price OR a percentage discount — not both.'); }
        if (hasSP  && Number(form.discountPrice) >= Number(form.price))      { setStep('pricing'); throw new Error('Sale price must be lower than the selling price.'); }
        if (hasPct && (Number(form.salePercentage) <= 0 || Number(form.salePercentage) >= 100)) { setStep('pricing'); throw new Error('Discount percentage must be between 1% and 99%.'); }
      }

      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'images') return;
        if (key === 'stockQuantity' && form.hasVariants) return;
        if (!form.onSale && (key === 'discountPrice' || key === 'salePercentage')) return;
        if (form.onSale && saleMode === 'price'      && key === 'salePercentage') return;
        if (form.onSale && saleMode === 'percentage' && key === 'discountPrice')  return;
        if (val !== '') fd.append(key, val);
      });
      if (buyingPrice !== '') fd.append('buyingPrice', buyingPrice);
      fd.set('hasVariants', form.hasVariants);

      if (!form.hasVariants && form.stockQuantity === '') { setStep('pricing'); throw new Error('Stock quantity is required.'); }
      if (form.hasVariants) {
        const varPayload = variants.map(v => ({
          sku: v.sku.trim(), price: v.price, stockQuantity: v.stockQuantity,
          attributes: parseAttrs(v.attributesText),
        })).filter(v => Object.keys(v.attributes).length > 0);
        if (!varPayload.length)                                          { setStep('pricing'); throw new Error('Add at least one variant with attributes (e.g. Color=Red).'); }
        if (varPayload.some(v => !v.price || v.stockQuantity === ''))    { setStep('pricing'); throw new Error('Each variant requires a price and available stock quantity.'); }
        fd.append('stockQuantity', 0);
        fd.append('variantsJson', JSON.stringify(varPayload));
      }
      form.images.forEach(f => fd.append('images', f));

      await createSellerProduct(fd);
      setSuccess(true);
      setMessage({ text: 'Your product has been published successfully and is now ready for customers.', type: 'success' });
      setTimeout(() => navigate('/seller/dashboard'), 2200);
    } catch (err) {
      setMessage({ text: readApiError(err, 'Something went wrong. Please review your listing and try again.'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="w-full font-sans pb-36 animate-in fade-in-50 duration-200 space-y-5" style={{ background: isDark ? '#08090a' : '#F8FAF7' }}>

      {/* ══ Hero Banner — §2: compact, 30% shorter, split layout ══ */}
      <SectionHeader
        title="Add New Product"
        subtitle="Create and publish products to grow your catalog and reach more customers."
        tag="Product Listing"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-white/60 text-[11px] font-medium mr-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              3 steps to go live
            </div>
            <button
              type="button"
              onClick={() => navigate('/seller/dashboard')}
              className="bg-white dark:bg-zinc-900 hover:bg-gray-150 dark:hover:bg-zinc-800 text-gray-900 dark:text-zinc-100 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border border-gray-200 dark:border-white/[0.08] shadow-sm h-10 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>
          </div>
        }
      />

      {/* ══ Step progress bar — §5 ══ */}
      <div className="bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-white/[0.08] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.30)] px-6 py-5 transition-colors">
        <Stepper step={step} stepIdx={stepIdx} />
      </div>

      {/* ── Alert banner ── */}
      {message.text && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl border text-[13px] font-semibold ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
            : message.type === 'error' 
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400'
            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-400'
        }`}>
          {message.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          }
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="opacity-50 hover:opacity-100 shrink-0 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="space-y-5">
            {step === 'details' && (
          <div className="space-y-5">
            <Card>
              <SectionTitle
                title="Product Details"
                subtitle="Provide essential information customers need to understand and purchase your product."
              />
              {/* Row 1: Name + Brand */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Field label="Product Name" required hint="Choose a clear, searchable name customers can recognize.">
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Apple iPhone 15 Pro Max 256GB" className={inputCls} />
                </Field>
                <Field label="Brand" optional hint="Helps customers identify the manufacturer.">
                  <input name="brand" value={form.brand} onChange={handleChange}
                    placeholder="e.g. Apple" className={inputCls} />
                </Field>
              </div>
              {/* Row 2: Category + Storage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Field label="Category" required hint="Select the most relevant category to improve discovery.">
                  <div className="relative">
                    <button type="button" onClick={() => setShowCatDrop(v => !v)}
                      className={`${inputCls} flex justify-between items-center text-left`}>
                      <span className={form.category ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500'}>
                        {form.category || 'Select category…'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-zinc-550 flex-shrink-0 transition-transform ${showCatDrop ? 'rotate-180' : ''}`} />
                    </button>
                    {showCatDrop && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowCatDrop(false)} />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-[#0d1117] border border-gray-100 dark:border-white/[0.07] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
                          {/* Search header */}
                          <div className="px-3 pt-3 pb-2.5 border-b border-gray-100 dark:border-white/[0.06]">
                            <div className="relative">
                              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                              <input type="text" placeholder="Search categories…" value={catSearch}
                                onChange={e => setCatSearch(e.target.value)}
                                onClick={e => e.stopPropagation()} autoFocus
                                className="w-full bg-gray-50 dark:bg-zinc-900/80 border border-gray-200 dark:border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-[12px] font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 transition-all" />
                            </div>
                          </div>
                          {/* Category grid */}
                          <div className="p-2 max-h-56 overflow-y-auto">
                            {(() => {
                              const filtered = CATEGORIES.filter(c => c.toLowerCase().includes(catSearch.toLowerCase()));
                              if (!filtered.length) return (
                                <div className="flex flex-col items-center py-6 gap-1.5">
                                  <span className="text-2xl">🔍</span>
                                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">No categories found</p>
                                </div>
                              );
                              return filtered.map((cat, idx) => {
                                const Icon = getCategoryIcon(cat);
                                const { bg, icon } = getCategoryColor(cat);
                                const isActive = form.category === cat;
                                return (
                                  <button key={cat} type="button"
                                    onClick={() => { setForm(p => ({ ...p, category: cat })); setShowCatDrop(false); setCatSearch(''); }}
                                    className={`w-full text-left px-2.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150 flex items-center gap-2.5 group/item ${
                                      isActive
                                        ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400'
                                        : 'hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-700 dark:text-zinc-300'
                                    }`}>
                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                      isActive ? 'bg-emerald-100 dark:bg-emerald-900/40' : bg
                                    }`}>
                                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : icon}`} />
                                    </span>
                                    <span className="flex-1 truncate">{cat}</span>
                                    {isActive && (
                                      <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                                      </span>
                                    )}
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Field>
                <Field label="Storage / Configuration" optional hint="Short spec shown on the product card (e.g. 128GB, 256GB).">
                  <input name="storageSpec" value={form.storageSpec} onChange={handleChange}
                    placeholder="e.g. 128GB, 256GB, 512GB" className={inputCls} />
                </Field>
              </div>
              <Field label="Short Description" optional hint="Shown in search results. Keep under 120 characters.">
                <input name="shortDescription" value={form.shortDescription} onChange={handleChange}
                  placeholder="e.g. Flagship smartphone with titanium build, A18 chip, and 48MP camera system"
                  className={inputCls} />
              </Field>
            </Card>

            {/* Images */}
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Product Images</h2>
                  <p className={`text-[12px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Main photo is your cover. Add up to 7 gallery shots.</p>
                </div>
                <span className={`text-[11px] font-bold tabular-nums px-2.5 py-1 rounded-lg ${
                  (form.images?.length || 0) >= 4
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                    : isDark ? 'bg-zinc-800/80 text-zinc-500' : 'bg-gray-100 text-gray-400'
                }`}>{form.images?.length || 0} / 8</span>
              </div>

              {/* Hero main + gallery grid */}
              <div className="flex gap-3">
                {/* Main photo slot — large */}
                {(() => {
                  const mainImg = form.images?.[0];
                  return mainImg ? (
                    <div className="relative group shrink-0 w-[130px] h-[130px] rounded-xl overflow-hidden border-2 border-emerald-400 ring-2 ring-emerald-400/20">
                      <img src={URL.createObjectURL(mainImg)} className="w-full h-full object-cover" alt="Main" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="absolute bottom-2.5 left-2.5 text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md tracking-widest uppercase shadow-md">Cover</span>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, images: p.images.filter((_, j) => j !== 0) }))}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                      ><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <label className={`shrink-0 w-[130px] h-[130px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      isDark
                        ? 'border-white/20 hover:border-emerald-500/50 hover:bg-emerald-950/10'
                        : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                    }`}>
                      <input type="file" accept="image/*" className="sr-only"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setForm(p => ({ ...p, images: [f, ...(p.images||[])] })); e.target.value=''; }} />
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isDark ? 'bg-zinc-800' : 'bg-gray-100'
                      }`}>
                        <Plus className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-gray-400'}`} />
                      </div>
                      <div className="text-center">
                        <p className={`text-[12px] font-semibold ${
                          isDark ? 'text-zinc-400' : 'text-gray-500'
                        }`}>Main photo</p>
                        <p className={`text-[10px] ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>Your cover image</p>
                      </div>
                    </label>
                  );
                })()}

                {/* Gallery slots — 3×2 grid */}
                <div className="flex-1 grid grid-cols-3 gap-1.5" style={{ gridAutoRows: '60px', maxHeight: '130px', overflow: 'hidden' }}>
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const i = idx + 1;
                    const img = form.images?.[i];
                    return img ? (
                      <div key={i} className="relative group w-full h-full rounded-lg overflow-hidden">
                        <img src={URL.createObjectURL(img)} className={`w-full h-full object-cover border ${
                          isDark ? 'border-white/10' : 'border-gray-200'
                        }`} alt="" />
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        ><X className="w-3 h-3" /></button>
                        <span className={`absolute bottom-1 left-1 text-[7.5px] font-black px-1.5 py-0.5 rounded ${
                          isDark ? 'bg-black/60 text-zinc-300' : 'bg-white/80 text-gray-500'
                        }`}>#{i+1}</span>
                      </div>
                    ) : (
                      <label key={i} className={`w-full h-full rounded-lg border border-dashed flex items-center justify-center cursor-pointer transition-all ${
                        isDark
                          ? 'border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                      }`}>
                        <input type="file" accept="image/*" className="sr-only"
                          onChange={e => { const f = e.target.files?.[0]; if (f) setForm(p => ({ ...p, images: [...(p.images||[]), f] })); e.target.value=''; }} />
                        <Plus className={`w-4 h-4 ${isDark ? 'text-zinc-700' : 'text-gray-300'}`} />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Tip row */}
              <div className={`mt-4 flex items-center justify-between text-[11px] ${
                isDark ? 'text-zinc-600' : 'text-gray-400'
              }`}>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  4+ photos = 3× more views
                </span>
                <span>JPG · PNG · WEBP · max 5 MB each</span>
              </div>
            </Card>

            {/* Advanced Details */}
            <Collapsible title="Advanced Details" icon={Tag} iconColor="#8B5CF6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <Field label="Color Options" optional>
                  <input name="colorOptions" value={form.colorOptions} onChange={handleChange}
                    placeholder="Black, White, Gold" className={inputCls} />
                  <Helper>Comma-separated. Shown as filter on product page.</Helper>
                </Field>
                <Field label="Warranty" optional>
                  <div className="relative">
                    <input name="warrantyMonths" value={form.warrantyMonths} onChange={handleChange}
                      type="number" min="0" placeholder="12" className={`${inputCls} pr-16`} />
                    <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold ${
                      isDark ? 'text-zinc-500' : 'text-gray-400'
                    }`}>months</span>
                  </div>
                  <Helper>Leave blank if no warranty.</Helper>
                </Field>
                <Field label="Storage / Config" optional>
                  <input name="storageSpec" value={form.storageSpec} onChange={handleChange}
                    placeholder="128GB, 256GB" className={inputCls} />
                  <Helper>Shown on listing card (e.g. 256GB).</Helper>
                </Field>
              </div>
              <Field label="Full Description" optional>
                <div className="relative">
                  <textarea name="description" value={form.description} onChange={handleChange} rows={5}
                    placeholder="Cover what's in the box, use cases, key benefits and any important notes for buyers…"
                    className={`${inputCls} resize-none pt-3 pb-8 leading-relaxed`} />
                  <span className={`absolute bottom-2.5 right-3 text-[10px] tabular-nums ${
                    (form.description?.length || 0) > 900
                      ? 'text-amber-500'
                      : isDark ? 'text-zinc-600' : 'text-gray-300'
                  }`}>{form.description?.length || 0} / 1000</span>
                </div>
                <Helper>Shown on the full product page. Use paragraphs for readability.</Helper>
              </Field>
            </Collapsible>

            {/* Key Features */}
            <Collapsible title="Key Features" icon={Sparkles} iconColor={T.warn} defaultOpen={featuresList.length > 0}>
              <p className={`text-[11.5px] mb-3 ${
                isDark ? 'text-zinc-500' : 'text-gray-400'
              }`}>Bullet points shown prominently on the product page. Aim for 4–6 clear selling points.</p>
              {/* Input row */}
              <div className={`flex gap-2 p-3 rounded-xl ${
                isDark ? 'bg-zinc-900/50' : 'bg-gray-50'
              }`}>
                <input
                  type="text"
                  placeholder="e.g. 48MP triple camera system"
                  value={newFeature}
                  onChange={e => setNewFeature(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  disabled={!newFeature.trim()}
                  className="px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-[11.5px] font-bold transition-colors shrink-0 h-11 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {/* Chips */}
              {featuresList.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {featuresList.map((feat, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                        isDark
                          ? 'bg-zinc-900 border-white/[0.08] text-zinc-200'
                          : 'bg-white border-gray-200 text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      {feat}
                      <button
                        type="button"
                        onClick={() => {
                          const newList = featuresList.filter((_, i) => i !== idx);
                          setFeaturesList(newList);
                          syncFeatures(newList);
                        }}
                        className={`ml-0.5 rounded-full p-0.5 transition-colors ${
                          isDark ? 'text-zinc-500 hover:text-red-400 hover:bg-red-950/20' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className={`mt-3 rounded-xl border border-dashed py-6 text-center ${
                  isDark ? 'border-white/[0.07] text-zinc-600' : 'border-gray-200 text-gray-400'
                }`}>
                  <Sparkles className="w-5 h-5 mx-auto mb-1.5 opacity-40" style={{ color: T.warn }} />
                  <p className="text-[11.5px] font-medium">No features yet — add your first selling point above</p>
                </div>
              )}
            </Collapsible>

            {/* Technical Specifications */}
            <Collapsible title="Technical Specifications" icon={BarChart3} iconColor="#38BDF8" defaultOpen={specsList.length > 0}>
              <p className={`text-[11.5px] mb-3 ${
                isDark ? 'text-zinc-500' : 'text-gray-400'
              }`}>Add a structured spec sheet — shown in a comparison table on the product page.</p>
              {/* Add spec input row */}
              <div className={`flex gap-2 p-3 rounded-xl mb-4 ${
                isDark ? 'bg-zinc-900/50' : 'bg-gray-50'
              }`}>
                <input
                  type="text"
                  placeholder="Label — e.g. RAM"
                  value={specKey}
                  onChange={e => setSpecKey(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpec(); } }}
                  className={`${inputCls} w-36 shrink-0`}
                />
                <input
                  type="text"
                  placeholder="Value — e.g. 16 GB"
                  value={specVal}
                  onChange={e => setSpecVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpec(); } }}
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleAddSpec}
                  disabled={!specKey.trim() || !specVal.trim()}
                  className="px-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white rounded-xl text-[11.5px] font-bold transition-colors shrink-0 h-11 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {/* Specs two-column card grid */}
              {specsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {specsList.map((spec, idx) => (
                    <div
                      key={idx}
                      className={`group flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        isDark
                          ? 'bg-zinc-900/70 border-white/[0.07] hover:border-sky-500/30'
                          : 'bg-white border-gray-100 hover:border-sky-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-[5px]" />
                        <div className="min-w-0">
                          <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${
                            isDark ? 'text-zinc-500' : 'text-gray-400'
                          }`}>{spec.key}</p>
                          <p className={`text-[13px] font-semibold truncate ${
                            isDark ? 'text-zinc-100' : 'text-gray-800'
                          }`}>{spec.val}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newList = specsList.filter((_, i) => i !== idx);
                          setSpecsList(newList);
                          syncSpecs(newList);
                        }}
                        className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${
                          isDark ? 'text-zinc-600 hover:text-red-400 hover:bg-red-950/20' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-xl border border-dashed py-8 text-center ${
                  isDark ? 'border-white/[0.07] text-zinc-600' : 'border-gray-200 text-gray-400'
                }`}>
                  <BarChart3 className="w-5 h-5 mx-auto mb-2 opacity-40 text-sky-400" />
                  <p className="text-[11.5px] font-medium">No specs yet — add RAM, battery, dimensions, etc.</p>
                </div>
              )}
            </Collapsible>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 2 — Pricing & Inventory
        ══════════════════════════════════════════════════════════ */}
        {step === 'pricing' && (
          <div className="space-y-4">

            {/* Product Type */}
            <Card>
              <SectionTitle title="Product Type" subtitle="Choose how your product is sold — single listing or with multiple variants." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: 'Standard Product',      val: false, hint: 'Single price & stock', icon: Package },
                  { label: 'Product with Variants', val: true,  hint: 'Sizes, colors, SKUs',  icon: Layers  },
                ].map(opt => {
                  const Icon = opt.icon;
                  const active = form.hasVariants === opt.val;
                  return (
                    <button key={String(opt.val)} type="button"
                      onClick={() => handleProductTypeChange(opt.val)}
                      className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                        active 
                          ? 'border-emerald-500 bg-emerald-500/10' 
                          : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111111]'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        active 
                          ? 'bg-emerald-500/20 border-emerald-500/30' 
                          : 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-white/[0.08]'
                      }`}>
                        <Icon className="w-5 h-5" style={{ color: active ? '#16A34A' : '#6B7280' }} />
                      </div>
                      <div>
                        <p className={`text-[13px] font-bold ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{opt.label}</p>
                        <p className="text-[11px] mt-0.5 text-gray-500 dark:text-zinc-400">{opt.hint}</p>
                      </div>
                      {active && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Pricing */}
            <Card>
              <SectionTitle title="Pricing & Stock" subtitle="Set competitive prices and manage stock levels for accurate customer availability." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label={form.hasVariants ? 'Base Price' : 'Selling Price'} required hint="Customer-facing price inclusive of VAT.">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-black text-gray-400 dark:text-zinc-500">Rs.</span>
                    <input name="price" value={form.price} onChange={handleChange} type="number" min="0" step="0.01"
                      placeholder="0.00" className={`${inputCls} pl-10`} />
                  </div>
                </Field>
                {!form.hasVariants ? (
                  <Field label="Stock Quantity" required hint="Total units available and ready to ship.">
                    <input name="stockQuantity" value={form.stockQuantity} onChange={handleChange}
                      type="number" min="0" placeholder="e.g. 100" className={inputCls} />
                  </Field>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-blue-50/40 dark:bg-blue-950/20 border-blue-100 dark:border-blue-950/30">
                    <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                    <div>
                      <p className="text-[11px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-wider">Per-Variant Stock</p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-500 font-medium mt-0.5">Set stock for each variant row below.</p>
                    </div>
                  </div>
                )}
                <Field label="Warranty (Months)" optional hint="Leave blank if no warranty included.">
                  <input name="warrantyMonths" value={form.warrantyMonths} onChange={handleChange}
                    type="number" min="0" placeholder="e.g. 12" className={inputCls} />
                </Field>
              </div>
            </Card>

            {/* Promotion */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-[15px] font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>Promotional Discount</h2>
                  <p className={`text-[12px] mt-0.5 font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>A sale badge will appear on your listing to attract buyers.</p>
                </div>
                <label className="relative cursor-pointer shrink-0">
                  <input name="onSale" type="checkbox" checked={form.onSale}
                    onChange={e => {
                      const c = e.target.checked;
                      setForm(p => ({ ...p, onSale: c, discountPrice: c ? p.discountPrice : '', salePercentage: c ? p.salePercentage : '' }));
                    }}
                    className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-zinc-800 rounded-full peer-checked:bg-emerald-500 transition-colors duration-300" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-zinc-200 rounded-full shadow transition-transform duration-300 peer-checked:translate-x-5" />
                </label>
              </div>
              {form.onSale && (
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 pt-4 border-t border-[#E5E7EB] dark:border-white/[0.08]">
                  <Field label="Discount Type">
                    <select value={saleMode}
                      onChange={e => { setSaleMode(e.target.value); setForm(p => ({ ...p, discountPrice: '', salePercentage: '' })); }}
                      className={inputCls}>
                      <option value="price">Fixed Sale Price</option>
                      <option value="percentage">Percentage Off (%)</option>
                    </select>
                  </Field>
                  {saleMode === 'price' ? (
                    <Field label="Sale Price" hint={`Must be lower than Rs. ${form.price || '—'}`}>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-black text-gray-400 dark:text-zinc-550">Rs.</span>
                        <input name="discountPrice" value={form.discountPrice} onChange={handleChange}
                          type="number" min="0" step="0.01" placeholder="0.00" className={`${inputCls} pl-10`} />
                      </div>
                    </Field>
                  ) : (
                    <Field label="Discount Percentage" hint="Customers see this % off your regular price.">
                      <div className="relative">
                        <input name="salePercentage" value={form.salePercentage} onChange={handleChange}
                          type="number" min="1" max="99" step="0.01" placeholder="e.g. 20" className={`${inputCls} pr-10`} />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-black text-gray-400 dark:text-zinc-550">%</span>
                      </div>
                    </Field>
                  )}
                </div>
              )}
            </Card>

            {/* Profit Calculator */}
            <div className="border border-[#E5E7EB] dark:border-white/[0.08] rounded-[20px] overflow-hidden bg-white dark:bg-zinc-950 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.30)]">
              <button type="button" onClick={() => setShowVatLedger(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 bg-[#F9FAFB] dark:bg-zinc-900/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border border-[#E5E7EB] dark:border-white/[0.08] bg-white dark:bg-zinc-900 shrink-0">
                    <BarChart3 className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <span className={`text-[13px] font-bold block ${isDark ? 'text-white' : 'text-gray-900'}`}>Calculate Profit Margin</span>
                    <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Real-time margin, VAT & platform commission estimate</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {sp > 0 && (
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${netProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400'}`}>
                      {netProfit >= 0 ? '+' : ''}Rs. {netProfit.toFixed(0)} est. profit
                    </span>
                  )}
                  {showVatLedger ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-zinc-500" />}
                </div>
              </button>
              {showVatLedger && (
                <div className="p-5 border-t border-[#E5E7EB] dark:border-white/[0.08] bg-white dark:bg-zinc-950 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Your Cost Price (Incl. VAT)" hint="What you paid per unit including 13% VAT.">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-black text-gray-400 dark:text-zinc-500">Rs.</span>
                        <input type="number" min="0" step="0.01" placeholder="0.00" value={buyingPrice}
                          onChange={e => setBuyingPrice(e.target.value)} className={`${inputCls} pl-10`} />
                      </div>
                    </Field>
                    <Field label="Selling Price (Incl. VAT)" hint="Auto-synced with the price field above.">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-black text-gray-400 dark:text-zinc-500">Rs.</span>
                        <input type="number" min="0" step="0.01" placeholder="0.00" value={form.price}
                          onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className={`${inputCls} pl-10`} />
                      </div>
                    </Field>
                    <Field label="Platform Commission %" hint="Auto-set from category. Editable.">
                      <div className="relative">
                        <input type="number" min="0" max="100" step="0.5" placeholder="15.0" value={commissionRate}
                          onChange={e => setCommissionRate(e.target.value)} className={`${inputCls} pr-10`} />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-black text-gray-400 dark:text-zinc-500">%</span>
                      </div>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Net Profit',    value: `Rs. ${netProfit.toFixed(2)}`,   good: netProfit >= 0, highlight: true  },
                      { label: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`,   good: profitMargin >= 0, highlight: false },
                      { label: 'Platform Fee',  value: `Rs. ${platformFee.toFixed(2)}`, neutral: true },
                      { label: 'VAT Payable',   value: `Rs. ${vatPayable.toFixed(2)}`,  neutral: true },
                    ].map(m => (
                      <div key={m.label} className={`rounded-xl p-3.5 border text-center ${
                        m.neutral ? 'bg-[#F9FAFB] dark:bg-zinc-900 border-[#E5E7EB] dark:border-white/[0.08]'
                        : m.highlight ? (m.good ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30')
                        : 'bg-[#F9FAFB] dark:bg-zinc-900 border-[#E5E7EB] dark:border-white/[0.08]'
                      }`}>
                        <span className="block text-[9px] font-black uppercase tracking-wider mb-1 text-gray-500 dark:text-zinc-400">{m.label}</span>
                        <span className={`block text-[15px] font-black ${m.neutral ? 'text-gray-700 dark:text-zinc-300' : m.good ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-650 dark:text-red-400'}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Margin health gauge bar */}
                  {sp > 0 && (
                    <div className="space-y-1.5 pt-3.5 border-t border-[#E5E7EB] dark:border-white/[0.08]">
                      <div className="flex justify-between items-center text-[11px] font-semibold">
                        <span className="text-gray-500 dark:text-zinc-400">Profit Margin Health</span>
                        <span className={profitMargin < 5 ? 'text-rose-500' : profitMargin < 15 ? 'text-amber-500' : 'text-emerald-500'}>
                          {profitMargin < 5 ? 'Low Margin (Caution)' : profitMargin < 15 ? 'Fair Margin (Healthy)' : 'Premium Margin (High)'} ({profitMargin.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${profitMargin < 5 ? 'bg-rose-500' : profitMargin < 15 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(Math.max(profitMargin, 0), 100)}%` }}
                        />
                      </div>
                      {profitMargin < 5 && (
                        <p className="text-[10.5px] text-rose-500 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Low margins might not cover processing fees or returns.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl p-4 space-y-1.5">
                      <p className="text-[9px] font-black text-emerald-800 dark:text-emerald-450 uppercase tracking-wider mb-2">Purchase — Input VAT</p>
                      <div className="flex justify-between text-gray-600 dark:text-zinc-400"><span>Cost excl. VAT</span><span className="font-bold text-gray-800 dark:text-zinc-200">Rs. {bpX.toFixed(2)}</span></div>
                      <div className="flex justify-between text-gray-600 dark:text-zinc-400"><span>VAT paid (13%)</span><span className="font-bold text-gray-800 dark:text-zinc-200">Rs. {bpVat.toFixed(2)}</span></div>
                      <div className="flex justify-between font-black text-emerald-800 dark:text-emerald-400 border-t border-emerald-100 dark:border-emerald-900/20 pt-1.5"><span>Total cost</span><span>Rs. {bp.toFixed(2)}</span></div>
                    </div>
                    <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-4 space-y-1.5">
                      <p className="text-[9px] font-black text-blue-800 dark:text-blue-450 uppercase tracking-wider mb-2">Sale — Output VAT</p>
                      <div className="flex justify-between text-gray-600 dark:text-zinc-400"><span>Price excl. VAT</span><span className="font-bold text-gray-800 dark:text-zinc-200">Rs. {spX.toFixed(2)}</span></div>
                      <div className="flex justify-between text-gray-600 dark:text-zinc-400"><span>VAT collected (13%)</span><span className="font-bold text-gray-800 dark:text-zinc-200">Rs. {spVat.toFixed(2)}</span></div>
                      <div className="flex justify-between font-black text-blue-800 dark:text-blue-400 border-t border-blue-100 dark:border-blue-900/20 pt-1.5"><span>Total price</span><span>Rs. {sp.toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Variant Builder */}
            {form.hasVariants && (
              <Card>
                {/* Attribute Groups */}
                <div className="bg-[#F9FAFB] dark:bg-zinc-900/50 border border-[#E5E7EB] dark:border-white/[0.08] rounded-xl p-5 space-y-4 mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className={`text-[13px] font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <Tag className="w-4 h-4 text-gray-500 dark:text-zinc-400" /> Attribute Groups
                      </h5>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                        e.g. "Color" → "Red, Blue, White" or "Size" → "S, M, L, XL"
                      </p>
                    </div>
                    <button type="button" onClick={addAttrGroup}
                      className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/35 px-3 py-1.5 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Attribute
                    </button>
                  </div>
                  <div className="space-y-3">
                    {attrGroups.map(g => (
                      <div key={g.id} className="flex flex-wrap items-center gap-3">
                        <div className="w-28 shrink-0">
                          <input value={g.name} onChange={e => updateAttrGroup(g.id, 'name', e.target.value)}
                            placeholder="Attribute name" className={inputCls} />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                          <input value={g.valuesText} onChange={e => updateAttrGroup(g.id, 'valuesText', e.target.value)}
                            placeholder="Values separated by commas (e.g. Red, Blue, White)" className={inputCls} />
                        </div>
                        <button type="button" onClick={() => removeAttrGroup(g.id)} disabled={attrGroups.length === 1}
                          className="text-red-400 hover:text-red-650 disabled:text-gray-200 dark:disabled:text-zinc-800 transition-colors p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20">
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end border-t border-[#E5E7EB] dark:border-white/[0.08] pt-3.5 mt-2">
                    <button type="button" onClick={generateVariants}
                      className="bg-emerald-600 hover:bg-[#15803D] text-white px-5 py-2 rounded-xl text-[11.5px] font-bold shadow-sm hover:shadow transition-all h-9 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Generate Variant Combinations
                    </button>
                  </div>
                </div>

                {/* Combinations list */}
                <div className="border border-[#E5E7EB] dark:border-white/[0.08] rounded-xl p-5 space-y-4 bg-white dark:bg-zinc-950">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#F3F4F6] dark:border-white/[0.08]">
                    <div>
                      <h5 className={`text-[13px] font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Variant Combinations</h5>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Set price and stock for each variant combination.</p>
                    </div>
                    <button type="button" onClick={addVariant}
                      className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/35 px-3 py-1.5 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Variant
                    </button>
                  </div>
                  
                  {/* Bulk editor tools */}
                  {variants.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-[#F9FAFB] dark:bg-zinc-900/40 text-[11px]">
                      <span className="font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">Bulk Edit:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="Bulk Price"
                          id="bulk-price-input"
                          className="h-8 rounded-lg border border-gray-200 dark:border-white/[0.08] px-2 text-[11px] font-medium outline-none bg-white dark:bg-zinc-950 focus:border-emerald-500 w-24"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = document.getElementById('bulk-price-input')?.value;
                            if (val) {
                              setVariants(prev => prev.map(v => ({ ...v, price: val })));
                              setMessage({ text: `Set bulk price of Rs. ${val} on all variants.`, type: 'info' });
                            }
                          }}
                          className="h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-emerald-750 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/20 px-2.5 font-bold"
                        >
                          Apply Price
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 border-l dark:border-white/[0.08] pl-3">
                        <input
                          type="number"
                          placeholder="Bulk Stock"
                          id="bulk-stock-input"
                          className="h-8 rounded-lg border border-gray-200 dark:border-white/[0.08] px-2 text-[11px] font-medium outline-none bg-white dark:bg-zinc-950 focus:border-emerald-500 w-20"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = document.getElementById('bulk-stock-input')?.value;
                            if (val !== undefined && val !== '') {
                              setVariants(prev => prev.map(v => ({ ...v, stockQuantity: val })));
                              setMessage({ text: `Set bulk stock of ${val} units on all variants.`, type: 'info' });
                            }
                          }}
                          className="h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-emerald-750 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/20 px-2.5 font-bold"
                        >
                          Apply Stock
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 border-l dark:border-white/[0.08] pl-3">
                        <button
                          type="button"
                          onClick={() => {
                            const cleanName = form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').slice(0, 12);
                            setVariants(prev => prev.map((v, i) => ({ ...v, sku: `${cleanName || 'sku'}-${i+1}` })));
                            setMessage({ text: `Auto-generated SKUs matching product title.`, type: 'info' });
                          }}
                          className="h-8 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white border border-slate-700 px-3 font-bold transition-all"
                        >
                          Auto Generate SKUs
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[12px]">
                      <thead>
                        <tr className="bg-[#F9FAFB] dark:bg-zinc-900 border border-[#E5E7EB] dark:border-white/[0.08] rounded-xl">
                          <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-550">Attributes</th>
                          <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-550">SKU</th>
                          <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-550">Price (Rs.)</th>
                          <th className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-550">Stock</th>
                          <th className="px-3 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6] dark:divide-white/[0.08]">
                        {variants.map((v, idx) => (
                          <tr key={v.id} className="group">
                            <td className="px-2 py-2">
                              <input value={v.attributesText} onChange={e => updateVariant(v.id, 'attributesText', e.target.value)}
                                placeholder="Color=Red, Size=M" className={`${inputCls} text-[11px]`} />
                            </td>
                            <td className="px-2 py-2">
                              <input value={v.sku} onChange={e => updateVariant(v.id, 'sku', e.target.value)}
                                placeholder={`SKU-${idx + 1}`} className={`${inputCls} text-[11px]`} />
                            </td>
                            <td className="px-2 py-2">
                              <input value={v.price} onChange={e => updateVariant(v.id, 'price', e.target.value)}
                                type="number" min="0" step="0.01" placeholder="0.00" className={`${inputCls} text-[11px]`} />
                            </td>
                            <td className="px-2 py-2">
                              <input value={v.stockQuantity} onChange={e => updateVariant(v.id, 'stockQuantity', e.target.value)}
                                type="number" min="0" placeholder="0" className={`${inputCls} text-[11px]`} />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button type="button" onClick={() => removeVariant(v.id)} disabled={variants.length === 1}
                                className="text-red-400 hover:text-red-650 disabled:text-gray-200 dark:disabled:text-zinc-700 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 3 — Shipping & Review
        ══════════════════════════════════════════════════════════ */}
        {step === 'shipping' && (
          <div className="space-y-5">
            <Card>
              <SectionTitle title="Shipping Configuration" subtitle="Configure delivery charges to provide accurate estimates and build customer trust." />
              {/* Shipping type */}
              <div className="mb-5">
                <Label>Shipping Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {[
                    { label: 'Paid Shipping', val: false, icon: '💳', hint: 'Customers pay a delivery fee' },
                    { label: 'Free Shipping', val: true,  icon: '🎁', hint: 'Products with free shipping convert more' },
                  ].map(opt => {
                    const active = form.freeShipping === opt.val;
                    return (
                      <label key={String(opt.val)}
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          active 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111111]'
                        }`}>
                        <input type="radio" name="freeShipping" checked={active}
                          onChange={() => setForm(p => ({ ...p, freeShipping: opt.val }))}
                          className="sr-only" />
                        <span className="text-2xl">{opt.icon}</span>
                        <div>
                          <p className={`text-[13px] font-bold ${active ? 'text-emerald-600 dark:text-emerald-450' : 'text-gray-900 dark:text-white'}`}>{opt.label}</p>
                          <p className="text-[11px] mt-0.5 text-gray-500 dark:text-zinc-400">{opt.hint}</p>
                        </div>
                        {active && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </div>
              {/* Delivery charges */}
              {!form.freeShipping && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Field label="Inside Valley Delivery" hint="Fee for Kathmandu, Lalitpur & Bhaktapur.">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-black text-gray-400 dark:text-zinc-550">Rs.</span>
                      <input name="insideValleyShipping" value={form.insideValleyShipping} onChange={handleChange}
                        type="number" min="0" step="0.01" placeholder="e.g. 100" className={`${inputCls} pl-10`} />
                    </div>
                  </Field>
                  <Field label="Outside Valley Delivery" hint="Fee for orders outside Kathmandu Valley.">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-black text-gray-400 dark:text-zinc-550">Rs.</span>
                      <input name="outsideValleyShipping" value={form.outsideValleyShipping} onChange={handleChange}
                        type="number" min="0" step="0.01" placeholder="e.g. 200" className={`${inputCls} pl-10`} />
                    </div>
                  </Field>
                </div>
              )}
              <Field label="Free Shipping Minimum Order" optional hint="Orders above this amount qualify for free shipping. Leave blank to always charge delivery fees.">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-black text-gray-400 dark:text-zinc-550">Rs.</span>
                  <input name="sellerFreeShippingMinOrder" value={form.sellerFreeShippingMinOrder} onChange={handleChange}
                    type="number" min="0" step="0.01" placeholder="e.g. 2000" className={`${inputCls} pl-10`} />
                </div>
              </Field>
            </Card>

            {/* Review Summary */}
            <Card>
              <SectionTitle title="Review Before Publishing" subtitle="Confirm all the details below are correct before your listing goes live." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ReviewItem icon="📝" label="Product Name"  value={form.name     || 'No product name entered'}    ok={!!form.name} />
                <ReviewItem icon="🖼"  label="Images"       value={form.images?.length > 0 ? `${form.images.length} image${form.images.length > 1 ? 's' : ''} uploaded` : 'No images uploaded'} ok={form.images?.length > 0} />
                <ReviewItem icon="📂" label="Category"      value={form.category || 'No category selected'}        ok={!!form.category} />
                <ReviewItem icon="💰" label="Selling Price" value={form.price    ? `Rs. ${Number(form.price).toLocaleString()}` : 'Price not set'} ok={!!form.price} />
                <ReviewItem icon="📦" label="Stock"         value={form.hasVariants ? `${variants.length} variant(s)` : (form.stockQuantity ? `${form.stockQuantity} units` : 'Stock not entered')} ok={form.hasVariants ? variants.length > 0 : !!form.stockQuantity} />
                <ReviewItem icon="🚚" label="Shipping"      value={form.freeShipping ? 'Free Shipping' : (form.insideValleyShipping ? `Rs. ${form.insideValleyShipping} (inside valley)` : 'Delivery fees not set')} ok={form.freeShipping || !!form.insideValleyShipping} />
                <ReviewItem icon="🏷"  label="Promotion"    value={form.onSale ? (saleMode === 'price' ? `Sale: Rs. ${form.discountPrice || '—'}` : `${form.salePercentage || '—'}% off`) : 'No promotion active'} ok={form.onSale} />
                <ReviewItem icon="🏢" label="Brand"         value={form.brand   || 'No brand specified'}           ok={!!form.brand} />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Right Column: Live Storefront Preview */}
      <aside className="sticky top-6 hidden lg:block space-y-4">
        <div className={`p-4 border rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all ${
          isDark ? 'bg-zinc-950 border-white/[0.08]' : 'bg-white border-[#E5E7EB]'
        }`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Live Storefront Preview</p>
          <ProductPreview form={form} variants={variants} darkMode={isDark} />
        </div>
        
        {/* Listing design guidance card */}
        <div className={`p-4 border rounded-[20px] text-[11.5px] leading-relaxed space-y-2 transition-all ${
          isDark ? 'bg-zinc-900/50 border-white/[0.06] text-zinc-400' : 'bg-gray-50 border-gray-150 text-gray-605'
        }`}>
          <div className="flex gap-2">
            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className={`font-bold ${isDark ? 'text-zinc-200' : 'text-gray-900'}`}>Listing Optimization</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-[11px] font-medium">
                <li>Upload high-quality images with clean backgrounds.</li>
                <li>Add technical specs to help customers search and filter.</li>
                <li>Free shipping and promotional discounts convert 3× better.</li>
              </ul>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </form>

      {/* ══ Sticky Footer — §5 typography, §13 premium feel ══ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-colors"
        style={{
          background: isDark ? 'rgba(11, 12, 16, 0.97)' : 'rgba(248,250,247,0.97)',
          borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E5E7EB',
          boxShadow: isDark ? '0 -8px 32px rgba(0,0,0,0.40)' : '0 -8px 32px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="w-full px-6 flex items-center justify-between gap-4" style={{ height: '72px' }}>

          {/* Left — Back / Cancel */}
          <button
            type="button"
            onClick={() => stepIdx > 0 ? setStep(STEPS[stepIdx - 1].key) : navigate('/seller/dashboard')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[14px] text-[13px] font-semibold transition-all border border-[#E5E7EB] dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 hover:bg-[#F8FAF7] dark:hover:bg-zinc-800 hover:border-gray-300 hover:shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            {stepIdx > 0 ? 'Back' : 'Cancel'}
          </button>

          {/* Step counter — §5 */}
          <span className="text-[11px] font-semibold hidden sm:block text-gray-400 dark:text-zinc-550">
            Step {stepIdx + 1} of {STEPS.length}
          </span>

          {/* Right — actions */}
          <div className="flex items-center gap-3">
            {stepIdx === STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => navigate('/seller/dashboard')}
                className="px-5 py-2.5 rounded-[14px] border border-gray-200 dark:border-white/[0.08] text-[13px] font-semibold transition-all bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-350 hover:bg-[#F8FAF7] dark:hover:bg-zinc-800 hover:shadow-sm"
              >
                Save Draft
              </button>
            )}
            {stepIdx < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-[13px] font-bold text-white transition-all shadow-[0_4px_16px_rgba(22,163,74,0.30)] hover:shadow-[0_6px_24px_rgba(22,163,74,0.42)] hover:-translate-y-px"
                style={{ background: T.greenDk }}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || success}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-[14px] text-[13px] font-bold text-white transition-all disabled:opacity-60 shadow-[0_4px_16px_rgba(22,163,74,0.30)] hover:-translate-y-px"
                style={{ background: saving || success ? '#6B7280' : T.greenDk }}
              >
                {saving
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Publishing…</>
                  : success
                  ? <><CheckCircle2 className="w-4 h-4" />Published!</>
                  : <><Sparkles className="w-4 h-4" />Publish Product</>}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SellerAddProduct;
