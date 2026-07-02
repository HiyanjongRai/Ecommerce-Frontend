import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getLoyaltyTransactions, getLoyaltyWallet } from '../../../services/customerApi';

const tierCopy = {
  BRONZE: { label: 'Bronze', tone: 'from-stone-700 to-amber-700', benefit: 'Base rewards and member offers' },
  SILVER: { label: 'Silver', tone: 'from-slate-700 to-cyan-700', benefit: 'Bonus rewards and early promotions' },
  GOLD: { label: 'Gold', tone: 'from-zinc-800 to-yellow-600', benefit: 'Priority support and premium campaigns' },
  PLATINUM: { label: 'Platinum', tone: 'from-neutral-900 to-[#10B981]', benefit: 'VIP rewards and exclusive launches' }
};

const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending';
const formatPoints = (value = 0) => Number(value).toLocaleString();

const CustomerLoyalty = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        getLoyaltyWallet(),
        getLoyaltyTransactions({ page: 0, size: 20 })
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data?.content || []);
    } catch (err) {
      setWallet(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'ALL') return transactions;
    return transactions.filter((tx) => tx.transactionType === filter);
  }, [transactions, filter]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center animate-in fade-in duration-300">
        <svg className="animate-spin w-6 h-6 text-[#10B981] mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-xs font-black uppercase tracking-wider text-gray-400">Loading rewards wallet...</p>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💳</span>
        </div>
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">Wallet Unavailable</h3>
        <p className="text-xs text-gray-500 font-medium">Rewards wallet is not available right now. Please try again later.</p>
      </div>
    );
  }

  const tier = tierCopy[wallet.tier] || tierCopy.BRONZE;
  const nextTier = wallet.nextTier ? tierCopy[wallet.nextTier] : null;
  const earned = Number(wallet.totalPointsEarned || 0);
  const redeemed = Number(wallet.redeemedPoints || 0);
  const expired = Number(wallet.expiredPoints || 0);
  const activityMax = Math.max(earned, redeemed, expired, 1);

  return (
    <div className="space-y-6 text-gray-900 animate-in fade-in duration-300 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-[22px] font-black tracking-tight leading-tight mb-1">Loyalty Wallet</h2>
          <p className="text-xs text-gray-500 font-semibold">Jhapcham Rewards Program</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
          <span className={`h-2 w-2 rounded-full ${wallet.frozen ? 'bg-red-500' : 'bg-[#10B981]'}`} />
          {wallet.frozen ? 'Frozen for review' : 'Active wallet'}
        </div>
      </div>

      <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tier.tone} p-8 text-white shadow-xl shadow-black/5`}>
        <div className="absolute right-5 top-5 h-24 w-24 rounded-full border-[1.5px] border-white/20" />
        <div className="absolute right-14 bottom-[-40px] h-36 w-36 rounded-full border-[1.5px] border-white/10" />
        <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-3">{tier.label} member</p>
            <div className="text-6xl font-black leading-none tracking-tight">{formatPoints(wallet.availablePoints)}</div>
            <p className="mt-2 text-xs font-bold text-white/70 uppercase tracking-widest">Available points</p>
            <div className="mt-6 inline-flex items-center gap-2 bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-xl">✨</span>
              <p className="text-[10px] font-bold text-white/90 uppercase tracking-wider">1 pt = Rs. 1 • Max redemption: 30% of order value</p>
            </div>
            <p className="mt-6 max-w-xl text-[13px] font-bold text-white/80 leading-relaxed">{wallet.benefits || tier.benefit}</p>
          </div>
          <div className="bg-black/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-white/80">
              <span>{tier.label}</span>
              <span>{nextTier ? `${nextTier.label} in ${formatPoints(wallet.pointsToNextTier)} pts` : 'Top tier'}</span>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-black/20 overflow-hidden border border-white/10">
              <div className="h-full rounded-full bg-white transition-all duration-700 ease-out" style={{ width: `${wallet.tierProgressPercent || 0}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
        {[
          ['Lifetime points', wallet.lifetimePoints],
          ['Earned', wallet.totalPointsEarned],
          ['Pending', wallet.pendingPoints],
          ['Redeemed', wallet.redeemedPoints],
          ['Expired', wallet.expiredPoints]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-transform hover:scale-[1.02]">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-gray-900 tracking-tight">{formatPoints(value)}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 pb-4 border-b border-gray-100">Reward analytics</h3>
          <div className="mt-5 space-y-5">
            {[
              ['Earned', earned, 'bg-[#10B981]'],
              ['Redeemed', redeemed, 'bg-emerald-400'],
              ['Expired', expired, 'bg-rose-500']
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="mb-2 flex justify-between text-[11px] font-black uppercase tracking-wider text-gray-500">
                  <span>{label}</span>
                  <span className="text-gray-900">{formatPoints(value)}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${Math.max(4, (value / activityMax) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Expiring points</h3>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-md">Next 10 lots</span>
          </div>
          <div className="mt-2 divide-y divide-gray-50">
            {(wallet.expiringPoints || []).length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-2xl mb-2 block">⏳</span>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">No points are close to expiry.</p>
              </div>
            ) : wallet.expiringPoints.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3.5 text-[13px]">
                <span className="font-black text-gray-900">{formatPoints(item.pointsRemaining)} pts</span>
                <span className="text-gray-500 font-semibold">{formatDate(item.expiresAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Reward activity timeline</h3>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'EARN', 'REDEEM', 'REFUND_REVERSAL', 'EXPIRE', 'BONUS'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === item
                    ? 'border-[#10B981] bg-[#10B981] text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {item.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-50 mt-2">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-2xl mb-2 block">📋</span>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">No reward activity for this filter.</p>
            </div>
          ) : filteredTransactions.map((tx) => (
            <div key={tx.id} className="grid gap-2 py-4 text-[13px] md:grid-cols-[1fr_auto] md:items-center hover:bg-gray-50/50 rounded-xl px-2 transition-colors">
              <div>
                <p className="font-black text-gray-900">{tx.description}</p>
                <p className="mt-1 text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
                  {formatDate(tx.createdAt)} <span className="mx-1 text-gray-300">|</span> {tx.transactionType.replace('_', ' ')} <span className="mx-1 text-gray-300">|</span> <span className={`${tx.status === 'COMPLETED' ? 'text-[#10B981]' : ''}`}>{tx.status}</span>
                </p>
              </div>
              <div className={`text-xl font-black ${tx.points >= 0 ? 'text-[#10B981]' : 'text-rose-600'}`}>
                {tx.points >= 0 ? '+' : ''}{formatPoints(tx.points)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CustomerLoyalty;
