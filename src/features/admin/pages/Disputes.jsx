import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../../app/layouts/AdminLayout';
import { getAdminRefunds, getDisputes } from '../../refund/api/refundApi';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { RefreshCw, Gavel, CreditCard, ShieldAlert, AlertTriangle } from 'lucide-react';
import AdminRefundList from '../../refund/admin/AdminRefundList';

export default function AdminDisputes() {
  const { themeClasses } = useAdminTheme();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('DISPUTES');
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (filter === 'DISPUTES') {
        const res = await getDisputes();
        setRefunds(res.data || []);
      } else {
        const res = await getAdminRefunds();
        setRefunds(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch refunds queue');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const stats = React.useMemo(() => {
    const total = refunds.length;
    const arbitration = refunds.filter(r => r.status === 'ADMIN_REVIEW').length;
    const processing = refunds.filter(r => r.status === 'REFUND_PROCESSING').length;
    const evidence = refunds.filter(r => r.status === 'MORE_EVIDENCE_REQUESTED').length;
    const verification = refunds.filter(r => r.status === 'PENDING_ADMIN_VERIFICATION').length;
    return { total, arbitration, processing, evidence, verification };
  }, [refunds]);

  return (
    <AdminLayout
      pageTitle="Refunds & Arbitration"
      pageSubtitle="Overrule merchant rejections, resolve customer appeals, and disburse refund payments."
      headerActions={
        <button
          onClick={fetchAll}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors border cursor-pointer ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:${themeClasses.bg.tertiary}`}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh desk
        </button>
      }
    >
      <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
        {error && (
          <div className={`rounded-xl border p-3 text-xs font-bold transition-colors ${themeClasses.status.danger}`}>
            {error}
          </div>
        )}

        {/* KPI metrics row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          {/* Total Cases */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Total Cases</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 shadow-2xs">
                <ShieldAlert size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.total}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.tertiary}`}>Active in pipeline</p>
            </div>
          </div>

          {/* Pending Arbitration */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Arbitration Required</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 shadow-2xs">
                <Gavel size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.arbitration}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.danger}`}>Needs ruling</p>
            </div>
          </div>

          {/* Pending Payment */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Payment Pending</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-2xs">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.processing}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.warning}`}>Awaiting disburse</p>
            </div>
          </div>

          {/* Pending Verification */}
          <div className={`rounded-[20px] border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.border.primary}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.text.tertiary}`}>Evidence / Audit</span>
              <div className="w-8.5 h-8.5 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-2xs">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className={`text-xl font-black tracking-tight leading-none ${themeClasses.text.primary}`}>{stats.evidence + stats.verification}</h3>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${themeClasses.text.accent}`}>Evidence or proof review</p>
            </div>
          </div>
        </div>

        <AdminRefundList
          refunds={refunds}
          loading={loading}
          filter={filter}
          setFilter={setFilter}
          onRefresh={fetchAll}
          themeClasses={themeClasses}
        />
      </div>
    </AdminLayout>
  );
}
