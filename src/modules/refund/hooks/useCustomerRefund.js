import { useState, useEffect } from 'react';
import { getOrderDetail } from '../../../shared/api/customerApi';
import { getRefundDetails } from '../../../shared/api/refundApi';

export function useCustomerRefund({ detailId, onRefreshList }) {
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [orderDetail, setOrderDetail] = useState(null);
  const [actionError, setActionError] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const loadDetails = async () => {
    setDetailLoading(true);
    setActionError('');
    try {
      const res = await getRefundDetails(detailId);
      setDetail(res.data);
      if (res.data?.orderId) {
        try {
          const orderRes = await getOrderDetail(res.data.orderId);
          setOrderDetail(orderRes.data);
        } catch (err) {
          console.error('Failed to load order details', err);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (detailId) {
      loadDetails();
    }
  }, [detailId]);

  const handleRefresh = () => {
    loadDetails();
    if (onRefreshList) onRefreshList();
  };

  const handleMockAction = (actionName) => {
    alert(`This refund request is currently processing. To perform a "${actionName}", please use the support desk or active resolution buttons.`);
  };

  return {
    detail,
    detailLoading,
    orderDetail,
    actionError,
    setActionError,
    uploadingEvidence,
    setUploadingEvidence,
    loadDetails,
    handleRefresh,
    handleMockAction
  };
}
