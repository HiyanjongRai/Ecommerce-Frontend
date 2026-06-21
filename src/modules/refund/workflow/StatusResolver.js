/**
 * StatusResolver
 * Resolves the active workflow branch based on the refund details status and type.
 */
export const resolveWorkflowBranch = (status, type) => {
  const normalizedStatus = (status || '').toUpperCase();
  const normalizedType = (type || '').toUpperCase();

  // 1. Evidence request always overrides to the EVIDENCE branch
  if (normalizedStatus === 'MORE_EVIDENCE_REQUESTED') {
    return 'EVIDENCE';
  }

  // 2. Admin escalation states override to the ADMIN branch
  if (['ADMIN_REVIEW', 'ADMIN_APPROVED_REFUND', 'ADMIN_REJECTED_REFUND'].includes(normalizedStatus)) {
    return 'ADMIN';
  }

  // 3. Exchange flows
  if (
    normalizedType === 'EXCHANGE' ||
    ['REPLACEMENT_PREPARING', 'REPLACEMENT_SHIPPED', 'EXCHANGE_COMPLETED'].includes(normalizedStatus)
  ) {
    return 'EXCHANGE';
  }

  // 4. Partial Refund flows
  if (
    normalizedType === 'PARTIAL_REFUND' ||
    normalizedType === 'PARTIAL_REFUND_RETURN' ||
    ['OFFER_MADE', 'CUSTOMER_ACCEPTS'].includes(normalizedStatus)
  ) {
    return 'PARTIAL_REFUND';
  }

  // 5. Default/Full Refund flow
  return 'FULL_REFUND';
};
