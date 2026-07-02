import React, { useState, useEffect, useCallback } from 'react';
import { getMyRefunds } from '../../refund/api/refundApi';
import CustomerRefundList from '../../refund/customer/CustomerRefundList';
import CustomerRefundDetails from '../../refund/customer/CustomerRefundDetails';

export default function CustomerDisputes() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyRefunds();
      setRefunds(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  if (loading && refunds.length === 0) {
    return (
      <div className="py-16 text-center">
        <svg className="animate-spin w-6 h-6 text-indigo-650 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-xs font-black uppercase tracking-wider text-gray-400">Loading requests...</p>
      </div>
    );
  }

  if (selectedId) {
    return (
      <CustomerRefundDetails
        detailId={selectedId}
        onBack={() => setSelectedId(null)}
        onRefreshList={fetchList}
      />
    );
  }

  return (
    <CustomerRefundList
      refunds={refunds}
      onSelectDetail={setSelectedId}
      onRefresh={fetchList}
    />
  );
}
