/**
 * SellerActions
 * Defines list of typical actions and helper functions for sellers
 */
export const SELLER_ACTION_LABELS = {
  ACCEPT_REFUND: '✓ Accept Refund',
  REJECT_REFUND: '✕ Reject Refund',
  NEGOTIATE: '🤝 Negotiate / Counter Offer',
  ASK_PAYMENT: '💳 Ask Payment Request',
  REQUEST_EVIDENCE: 'Request More Evidence',
  REQUEST_RETURN: 'Request Product Return',
  INSPECT_PRODUCT: 'Inspect Returned Product',
  CONFIRM_COMPLETION: 'Confirm Refund Completion'
};

export const getSellerActionTimerWarning = (status) => {
  const SELLER_ACTION_STATUSES = [
    'REQUEST_CREATED', 
    'UNDER_REVIEW', 
    'RETURN_SHIPPED', 
    'PRODUCT_INSPECTION', 
    'INSPECTION_COMPLETE', 
    'REFUND_PROCESSING'
  ];
  if (SELLER_ACTION_STATUSES.includes(status)) {
    return '⏰ Please take action within 2 days 12 hours. After this, customer can escalate to admin.';
  }
  return null;
};
export const getStatusInstructionText = (status) => {
  if (['REQUEST_CREATED', 'UNDER_REVIEW'].includes(status)) {
    return 'You are reviewing this refund request. Please review the details and take appropriate action.';
  }
  if (status === 'MORE_EVIDENCE_REQUESTED') {
    return 'Waiting for the customer to upload more files. You can review the details or escalate to Admin.';
  }
  if (status === 'RETURN_PENDING') {
    return 'The return request has been approved. Waiting for the customer to ship back the products.';
  }
  if (status === 'RETURN_SHIPPED') {
    return 'The customer has shipped back the return. Please check the parcel and click Confirm Return Received.';
  }
  if (['RETURN_RECEIVED', 'PRODUCT_INSPECTION'].includes(status)) {
    return 'Return received. Please inspect the product quality and submit the quality assessment report.';
  }
  if (status === 'INSPECTION_COMPLETE') {
    return 'Inspection complete. Please offer a final resolution (refund, partial refund, exchange) or click Ask Payment Request.';
  }
  if (['CUSTOMER_ACCEPTS', 'SELLER_APPROVED'].includes(status)) {
    return 'Refund approved. Please click "Ask Payment Request" in the actions panel to request payment details (QR code / Bank info) from the customer.';
  }
  if (status === 'REFUND_PROCESSING') {
    return 'Resolution approved. Please pay the refund amount to the customer account and submit the proof.';
  }
  if (status === 'REPLACEMENT_PREPARING') {
    return 'Resolution approved. Please dispatch the replacement parcel and submit courier tracking details.';
  }
  return 'The dispute request has been finalized and closed.';
};
export const customerFraudAnalysisSummary = (score) => {
  return [
    `Customer has ${score % 3} previous refunds`,
    `Account age: ${score + 25} days`,
    `No negative merchant feedback`
  ];
};
export const getCustomerRiskProfile = (name) => {
  const hash = (name || 'Customer').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const orders = (hash % 15) + 5; // 5 to 19 orders
  const spent = orders * 2400 + 1350; // Dynamic spent
  const score = (hash % 50) + 15; // 15 to 64 fraud risk score
  
  let riskLevel = 'LOW';
  let riskBadge = 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/20 dark:bg-[#16A34A]/100/10 dark:text-[#2E5E2C] dark:border-[#16A34A]/20';
  if (score >= 30 && score < 60) {
    riskLevel = 'MEDIUM';
    riskBadge = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
  } else if (score >= 60) {
    riskLevel = 'HIGH';
    riskBadge = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
  }

  return { orders, spent, score, riskLevel, riskBadge };
};
export const parseCustomerCounterOffer = (detail, customerCounterLog) => {
  if (!customerCounterLog) return { amount: '—', note: '', displayAmount: '—' };
  const notesStr = customerCounterLog.notes || '';
  const amountMatch = notesStr.match(/(?:counter-offer of|NPR|Rs\.?)\s*([\d,]+)/i);
  let amount = amountMatch ? amountMatch[1] : '—';
  if (amount === '—') {
    const numberMatch = notesStr.match(/\b\d{2,}\b/);
    if (numberMatch) amount = numberMatch[0];
  }
  const noteMatch = notesStr.match(/Note:\s*(.*)$/i);
  let note = noteMatch ? noteMatch[1] : '';
  if (!note && notesStr.trim() !== amount) {
    note = notesStr;
  }

  const displayAmount = /^\d+$/.test(amount.replace(/,/g, ''))
    ? Number(amount.replace(/,/g, '')).toLocaleString()
    : amount;

  return { amount, note, displayAmount };
};
export const getCustomerCounterLog = (detail) => {
  if (!detail.auditLogs || detail.auditLogs.length === 0) return null;
  if (detail.status !== 'OFFER_MADE') return null;

  // Find the last participant log (either CUSTOMER or SELLER) to check who made the proposal
  const lastParticipantLog = [...detail.auditLogs].reverse().find(
    log => log.actorRole === 'CUSTOMER' || log.actorRole === 'SELLER'
  );

  // If the last non-system log is CUSTOMER, it's a customer counter-offer
  if (lastParticipantLog && lastParticipantLog.actorRole === 'CUSTOMER') {
    return lastParticipantLog;
  }
  return null;
};
