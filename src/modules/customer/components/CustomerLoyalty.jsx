import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getLoyaltyTransactions, getLoyaltyWallet } from '../../../shared/api/customerApi';

const tierCopy = {
  BRONZE: { label: 'Bronze', tone: 'from-stone-700 to-amber-700', benefit: 'Base rewards and member offers' },
  SILVER: { label: 'Silver', tone: 'from-slate-700 to-cyan-700', benefit: 'Bonus rewards and early promotions' },
  GOLD: { label: 'Gold', tone: 'from-zinc-800 to-yellow-600', benefit: 'Priority support and premium campaigns' },
  PLATINUM: { label: 'Platinum', tone: 'from-neutral-900 to-emerald-700', benefit: 'VIP rewards and exclusive launches' }
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
      <div className="py-10 text-sm text-gray-500">Loading rewards wallet...</div>
    );
  }

  if (!wallet) {
    return (
      <div className="bg-white border border-gray-200 p-6 text-sm text-gray-500">
        Rewards wallet is not available right now.
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
    <div className="space-y-6 text-[#20242a]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Jhapcham Rewards</p>
          <h2 className="text-xl font-black tracking-tight">Loyalty wallet</h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className={`h-2.5 w-2.5 rounded-full ${wallet.frozen ? 'bg-red-500' : 'bg-emerald-500'}`} />
          {wallet.frozen ? 'Frozen for review' : 'Active wallet'}
        </div>
      </div>

      <section className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${tier.tone} p-6 text-white shadow-lg`}>
        <div className="absolute right-5 top-5 h-24 w-24 rounded-full border border-white/20" />
        <div className="absolute right-14 bottom-[-40px] h-36 w-36 rounded-full border border-white/10" />
        <div className="relative grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{tier.label} member</p>
            <div className="mt-3 text-5xl font-black leading-none">{formatPoints(wallet.availablePoints)}</div>
            <p className="mt-2 text-xs font-semibold text-white/70">Available points</p>
            <p className="mt-5 max-w-xl text-sm font-medium text-white/85">{wallet.benefits || tier.benefit}</p>
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-bold text-white/75">
              <span>{tier.label}</span>
              <span>{nextTier ? `${nextTier.label} in ${formatPoints(wallet.pointsToNextTier)} pts` : 'Top tier'}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${wallet.tierProgressPercent || 0}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        {[
          ['Lifetime points', wallet.lifetimePoints],
          ['Earned', wallet.totalPointsEarned],
          ['Pending', wallet.pendingPoints],
          ['Redeemed', wallet.redeemedPoints],
          ['Expired', wallet.expiredPoints]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p>
            <p className="mt-2 text-2xl font-black">{formatPoints(value)}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider">Reward analytics</h3>
          <div className="mt-5 space-y-4">
            {[
              ['Earned', earned, 'bg-emerald-600'],
              ['Redeemed', redeemed, 'bg-emerald-500'],
              ['Expired', expired, 'bg-rose-500']
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-xs font-bold text-gray-500">
                  <span>{label}</span>
                  <span>{formatPoints(value)}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(4, (value / activityMax) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-black uppercase tracking-wider">Expiring points</h3>
            <span className="text-[10px] font-bold uppercase text-gray-400">Next 10 lots</span>
          </div>
          <div className="mt-4 divide-y divide-gray-100">
            {(wallet.expiringPoints || []).length === 0 ? (
              <p className="py-5 text-sm text-gray-400">No points are close to expiry.</p>
            ) : wallet.expiringPoints.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-bold">{formatPoints(item.pointsRemaining)} pts</span>
                <span className="text-gray-500">{formatDate(item.expiresAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider">Reward activity timeline</h3>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'EARN', 'REDEEM', 'REFUND_REVERSAL', 'EXPIRE', 'BONUS'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-md border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${filter === item ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
              >
                {item.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredTransactions.length === 0 ? (
            <p className="py-6 text-sm text-gray-400">No reward activity for this filter.</p>
          ) : filteredTransactions.map((tx) => (
            <div key={tx.id} className="grid gap-2 py-4 text-sm md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-black text-gray-800">{tx.description}</p>
                <p className="mt-1 text-xs font-semibold text-gray-400">{formatDate(tx.createdAt)} · {tx.transactionType} · {tx.status}</p>
              </div>
              <div className={`text-lg font-black ${tx.points >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
