import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSellerRefunds } from '../../../shared/api/refundApi';
import { useSellerTheme } from '../hooks/useSellerTheme';
import SellerRefundList from '../../refund/seller/SellerRefundList';
import SellerRefundDetails from '../../refund/seller/SellerRefundDetails';

const SELLER_ACTION_STATUSES = ['REQUEST_CREATED', 'UNDER_REVIEW', 'RETURN_SHIPPED', 'PRODUCT_INSPECTION', 'INSPECTION_COMPLETE', 'REFUND_PROCESSING'];

const tabMatch = (tab, status) => {
  if (tab === 'ALL') return true;
  if (tab === 'PENDING') return SELLER_ACTION_STATUSES.includes(status);
  if (tab === 'COMPLETED') return ['SELLER_APPROVED', 'RETURN_PENDING', 'RETURN_RECEIVED', 'PENDING_ADMIN_VERIFICATION', 'REFUND_COMPLETED', 'CUSTOMER_ACCEPTS', 'CLOSED', 'REPLACEMENT_PREPARING', 'REPLACEMENT_SHIPPED', 'EXCHANGE_COMPLETED'].includes(status);
  if (tab === 'REJECTED') return ['SELLER_REJECTED', 'ADMIN_REJECTED_REFUND', 'ADMIN_REVIEW', 'ADMIN_APPROVED_REFUND'].includes(status);
  return true;
};

export default function SellerDisputes() {
  const { darkMode } = useSellerTheme();
  const [searchParams] = useSearchParams();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getSellerRefunds();
      setRefunds(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load refund claims.');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    const matched = refunds.find(r => r.id === id);
    setDetail(matched || null);
  };

  useEffect(() => {
    if (expandedId) {
      loadDetail(expandedId);
    } else {
      setDetail(null);
    }
  }, [expandedId, refunds]);

  useEffect(() => {
    const rId = searchParams.get('refundId');
    if (rId && refunds.length > 0) {
      const matched = refunds.find(r => String(r.id) === rId || r.refundNumber === rId);
      if (matched) {
        setExpandedId(matched.id);
      }
    }
  }, [searchParams, refunds]);

  const stats = useMemo(() => {
    let needsAction = 0;
    let exposure = 0;
    let settled = 0;
    let escalated = 0;

    refunds.forEach(r => {
      const status = r.status;
      const amount = Number(r.refundAmount || 0);

      if (SELLER_ACTION_STATUSES.includes(status)) {
        needsAction++;
      }
      if (!['REFUND_COMPLETED', 'EXCHANGE_COMPLETED', 'CLOSED', 'SELLER_REJECTED', 'ADMIN_REJECTED_REFUND'].includes(status)) {
        exposure += amount;
      }
      if (status === 'REFUND_COMPLETED') {
        settled += amount;
      }
      if (status === 'ADMIN_REVIEW') {
        escalated++;
      }
    });

    return { needsAction, exposure, settled, escalated };
  }, [refunds]);

  const filteredRefunds = useMemo(() => {
    return refunds.filter(r => {
      if (!tabMatch(activeTab, r.status)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.refundNumber?.toLowerCase().includes(q) ||
          String(r.orderId).includes(q) ||
          r.customerName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [refunds, activeTab, searchQuery]);

  if (loading && refunds.length === 0) {
    return (
      <div className="py-16 text-center">
        <svg className="animate-spin w-6 h-6 text-emerald-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-xs font-black uppercase tracking-wider text-gray-400">Loading requests...</p>
      </div>
    );
  }

  if (detail) {
    return (
      <SellerRefundDetails
        detail={detail}
        onBack={() => setExpandedId(null)}
        onRefresh={loadAll}
        error={error}
        setError={setError}
      />
    );
  }

  return (
    <SellerRefundList
      refunds={refunds}
      filteredRefunds={filteredRefunds}
      loading={loading}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      stats={stats}
      onSelectDetail={setExpandedId}
      onRefresh={loadAll}
    />
  );
}
