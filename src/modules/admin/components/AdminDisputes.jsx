import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { getAdminRefunds, getDisputes } from '../../../shared/api/refundApi';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { RefreshCw } from 'lucide-react';
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

  return (
    <AdminLayout
      pageTitle="Refunds & Arbitration"
      pageSubtitle="Overrule merchant rejections, resolve customer appeals, and disburse refund payments."
      headerActions={
        <button
          onClick={fetchAll}
          className="flex items-center gap-1 px-3 py-2 border rounded-lg text-xs font-bold bg-white text-gray-700 border-gray-200 hover:bg-gray-50 cursor-pointer"
        >
          <RefreshCw size={12} />
          Refresh desk
        </button>
      }
    >
      <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-xs">
            {error}
          </div>
        )}

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
