/**
 * CustomerActions
 * Defines list of typical actions and helper functions for customers
 */
export const CUSTOMER_ACTION_LABELS = {
  UPLOAD_EVIDENCE: 'Upload Evidence',
  PROVIDE_PAYOUT: 'Provide Payout Details',
  ACCEPT_COUNTER: 'Accept Counter Proposal',
  CANCEL_REQUEST: 'Cancel Request',
  CONTACT_SUPPORT: 'Contact Customer Support'
};

export const canCustomerCancel = (status) => {
  return !['REFUND_COMPLETED', 'EXCHANGE_COMPLETED', 'CLOSED', 'SELLER_REJECTED', 'ADMIN_REJECTED_REFUND'].includes(status);
};
