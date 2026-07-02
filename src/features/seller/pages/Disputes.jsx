import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSellerRefunds, getRefundDetails } from '../../refund/api/refundApi';
import { useSellerTheme } from '../hooks/useSellerTheme';
import SellerRefundList from '../../refund/seller/SellerRefundList';
import SellerRefundDetails from '../../refund/seller/SellerRefundDetails';

const SELLER_ACTION_STATUSES = ['REQUEST_CREATED', 'UNDER_REVIEW', 'RETURN_SHIPPED', 'PRODUCT_INSPECTION', 'INSPECTION_COMPLETE', 'REFUND_PROCESSING', 'REPLACEMENT_PREPARING'];

const tabMatch = (tab, status) => {
  if (tab === 'ALL') return true;
  if (tab === 'NEW_REVIEW') return ['REQUEST_CREATED', 'UNDER_REVIEW', 'OFFER_MADE'].includes(status);
  if (tab === 'WAITING_CUSTOMER') return ['MORE_EVIDENCE_REQUESTED', 'RETURN_PENDING', 'REPLACEMENT_SHIPPED'].includes(status);
  if (tab === 'RETURN_INSPECTION') return ['RETURN_SHIPPED', 'RETURN_RECEIVED', 'PRODUCT_INSPECTION', 'INSPECTION_COMPLETE'].includes(status);
  if (tab === 'PAYOUT_REPLACEMENT') return ['REFUND_PROCESSING', 'PENDING_ADMIN_VERIFICATION', 'REPLACEMENT_PREPARING'].includes(status);
  if (tab === 'DISPUTES') return ['ADMIN_REVIEW', 'ADMIN_APPROVED_REFUND', 'ADMIN_REJECTED_REFUND'].includes(status);
  if (tab === 'COMPLETED') return ['REFUND_COMPLETED', 'EXCHANGE_COMPLETED', 'CLOSED'].includes(status);
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
    try {
      const res = await getRefundDetails(id);
      if (res.data) {
        setDetail(res.data);
      }
    } catch (err) {
      console.error('Failed to load refund details:', err);
      const matched = refunds.find(r => r.id === id);
      setDetail(matched || null);
    }
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
        <svg className="animate-spin w-6 h-6 text-[#16A34A] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
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
