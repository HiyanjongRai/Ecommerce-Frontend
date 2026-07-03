import { useState } from 'react';
import { toast } from '../../../shared/contexts/ToastContext';
import {
  approveSellerRefund,
  acceptNegotiation,
  rejectSellerRefund,
  escalateSellerRefund,
  requestSellerEvidence,
  confirmReturnReceived,
  submitInspection,
  offerPartialRefund,
  offerExchange,
  processRefundAfterInspection,
  processExchangeAfterInspection,
  shipReplacement,
  submitPayoutProof,
  uploadRefundFile
} from '../api/refundApi';

export function useSellerRefund({ detail, onRefresh, error, setError }) {
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(null);

  // Modal triggers
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerType, setOfferType] = useState('FULL_REFUND'); // FULL_REFUND, PARTIAL_REFUND, EXCHANGE
  const [offerNotes, setOfferNotes] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [acceptStep, setAcceptStep] = useState('return_check'); // return_check, resolution_select
  const [needsReturn, setNeedsReturn] = useState(null);

  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    physicalDamage: false,
    waterDamage: false,
    missingParts: false,
    burnDamage: false,
    tampering: false,
    packagingIntact: true,
    productMatches: true,
    severityScore: 1,
    inspectorNotes: '',
    verdict: 'VALID_DAMAGE'
  });

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    paymentReference: '',
    paymentComment: ''
  });
  const [payoutFile, setPayoutFile] = useState(null);
  const [uploadingPayout, setUploadingPayout] = useState(false);

  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingCourier, setShippingCourier] = useState('');
  const [shippingTracking, setShippingTracking] = useState('');

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const executeApiCall = async (apiFn, successMsg) => {
    setSubmitting(true);
    setError('');
    try {
      await apiFn();
      toast(successMsg || 'Action completed successfully.', 'success');
      onRefresh();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Action execution failed.');
      toast(err.response?.data?.message || 'Failed to complete action.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveWithReturn = () => {
    executeApiCall(() => approveSellerRefund(detail.id, true), 'Approved refund with return requirements.');
  };

  const handleRequestEvidence = () => {
    executeApiCall(() => requestSellerEvidence(detail.id), 'Requested additional proof from customer.');
  };

  const handleConfirmReceived = () => {
    executeApiCall(() => confirmReturnReceived(detail.id), 'Confirmed return shipment receipt.');
  };

  const handleEscalateClaim = () => {
    executeApiCall(() => escalateSellerRefund(detail.id), 'Dispute escalated to admin arbitration.');
  };

  const handleAcceptNegotiation = () => {
    executeApiCall(() => acceptNegotiation(detail.id), 'Accepted customer counter-proposal.');
  };

  const handleAskPayment = () => {
    executeApiCall(() => processRefundAfterInspection(detail.id), 'Sent payout details request to customer.');
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectNotes.trim()) return;
    executeApiCall(async () => {
      await rejectSellerRefund(detail.id, rejectNotes.trim());
      setShowRejectModal(false);
      setRejectNotes('');
    }, 'Dispute claim rejected.');
  };

  const handleInspectionSubmit = (e) => {
    e.preventDefault();
    executeApiCall(async () => {
      await submitInspection(detail.id, inspectionForm);
      setShowInspectionModal(false);
    }, 'Quality inspection summary submitted.');
  };

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    executeApiCall(async () => {
      if (offerType === 'RETURN_REQUIRED' || offerType === 'EXCHANGE_RETURN' || offerType === 'PARTIAL_REFUND_RETURN') {
        await approveSellerRefund(detail.id, true);
      } else if (offerType === 'FULL_REFUND') {
        if (detail.status === 'INSPECTION_COMPLETE') {
          await processRefundAfterInspection(detail.id);
        } else {
          await approveSellerRefund(detail.id, false);
        }
      } else if (offerType === 'PARTIAL_REFUND') {
        await offerPartialRefund(detail.id, { amount: Number(offerAmount), notes: offerNotes });
      } else if (offerType === 'EXCHANGE') {
        if (detail.status === 'INSPECTION_COMPLETE') {
          await processExchangeAfterInspection(detail.id);
        } else {
          await offerExchange(detail.id, { notes: offerNotes });
        }
      }
      setShowOfferModal(false);
      setOfferNotes('');
      setOfferAmount('');
    }, 'Resolution offer sent.');
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!payoutFile) {
      toast('Please upload payout receipt file', 'warning');
      return;
    }
    setSubmitting(true);
    setUploadingPayout(true);
    setError('');
    try {
      const fileRes = await uploadRefundFile(payoutFile);
      await submitPayoutProof(detail.id, {
        paymentProofUrl: fileRes.data.fileUrl,
        paymentReference: payoutForm.paymentReference,
        paymentComment: payoutForm.paymentComment
      });
      setShowPayoutModal(false);
      setPayoutFile(null);
      setPayoutForm({ paymentReference: '', paymentComment: '' });
      toast('Payout verification submitted to admin.', 'success');
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payout.');
      toast('Failed to submit payout details.', 'error');
    } finally {
      setSubmitting(false);
      setUploadingPayout(false);
    }
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (!shippingCourier.trim() || !shippingTracking.trim()) return;
    executeApiCall(async () => {
      await shipReplacement(detail.id, {
        replacementCourier: shippingCourier.trim(),
        replacementTrackingNumber: shippingTracking.trim()
      });
      setShowShippingModal(false);
      setShippingCourier('');
      setShippingTracking('');
    }, 'Replacement shipment details submitted.');
  };

  // Determine which actions are active in the Action Card
  const isActionActive = (actionKey) => {
    if (!detail) return false;
    const status = detail.status;
    if (actionKey === 'ACCEPT_REFUND' || actionKey === 'REJECT_REFUND') {
      return ['REQUEST_CREATED', 'UNDER_REVIEW', 'MORE_EVIDENCE_REQUESTED', 'INSPECTION_COMPLETE'].includes(status);
    }
    if (actionKey === 'NEGOTIATE') {
      return ['REQUEST_CREATED', 'UNDER_REVIEW', 'MORE_EVIDENCE_REQUESTED', 'INSPECTION_COMPLETE', 'OFFER_MADE'].includes(status);
    }
    if (actionKey === 'ASK_PAYMENT') {
      return ['SELLER_APPROVED', 'CUSTOMER_ACCEPTS', 'INSPECTION_COMPLETE'].includes(status);
    }
    if (actionKey === 'REQUEST_EVIDENCE') {
      return ['REQUEST_CREATED', 'UNDER_REVIEW', 'OFFER_MADE'].includes(status);
    }
    if (actionKey === 'REQUEST_RETURN') {
      return ['REQUEST_CREATED', 'UNDER_REVIEW', 'MORE_EVIDENCE_REQUESTED'].includes(status);
    }
    if (actionKey === 'INSPECT_PRODUCT') {
      return ['RETURN_SHIPPED', 'RETURN_RECEIVED', 'PRODUCT_INSPECTION'].includes(status);
    }
    if (actionKey === 'CONFIRM_COMPLETION') {
      return ['REFUND_PROCESSING', 'PENDING_ADMIN_VERIFICATION', 'REPLACEMENT_PREPARING'].includes(status);
    }
    return false;
  };

  return {
    submitting,
    copied,
    copyToClipboard,
    showRejectModal,
    setShowRejectModal,
    rejectNotes,
    setRejectNotes,
    showOfferModal,
    setShowOfferModal,
    offerType,
    setOfferType,
    offerNotes,
    setOfferNotes,
    offerAmount,
    setOfferAmount,
    acceptStep,
    setAcceptStep,
    needsReturn,
    setNeedsReturn,
    showInspectionModal,
    setShowInspectionModal,
    inspectionForm,
    setInspectionForm,
    showPayoutModal,
    setShowPayoutModal,
    payoutForm,
    setPayoutForm,
    payoutFile,
    setPayoutFile,
    uploadingPayout,
    showShippingModal,
    setShowShippingModal,
    shippingCourier,
    setShippingCourier,
    shippingTracking,
    setShippingTracking,
    handleApproveWithReturn,
    handleRequestEvidence,
    handleConfirmReceived,
    handleEscalateClaim,
    handleAcceptNegotiation,
    handleAskPayment,
    handleRejectSubmit,
    handleInspectionSubmit,
    handleOfferSubmit,
    handlePayoutSubmit,
    handleShippingSubmit,
    isActionActive,
    executeApiCall
  };
}
