import { Clock, Scale, AlertTriangle, CheckCircle, Truck, HelpCircle } from 'lucide-react';

export const TIMELINE_STEPS = [
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'VIEWED', label: 'Viewed' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'WAITING_FOR_RETURN', label: 'Waiting for Return' },
  { key: 'INSPECTION_PENDING', label: 'Inspection Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REFUNDED', label: 'Refunded' }
];

export const SELLER_ACTION_STATUSES = [
  'REQUEST_CREATED', 
  'UNDER_REVIEW', 
  'RETURN_SHIPPED', 
  'PRODUCT_INSPECTION', 
  'INSPECTION_COMPLETE', 
  'REFUND_PROCESSING'
];

export const STATUS_META = {
  REQUEST_CREATED: { label: 'Request Created', badge: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20', badgeSeller: 'bg-blue-50/80 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', badge: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', badgeSeller: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', icon: Scale },
  MORE_EVIDENCE_REQUESTED: { label: 'Evidence Required', badge: 'bg-red-50 text-red-500 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20', badgeSeller: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20', icon: AlertTriangle },
  OFFER_MADE: { label: 'Offer Pending', badge: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20', badgeSeller: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20', icon: Clock },
  SELLER_APPROVED: { label: 'Approved by Seller', badge: 'bg-[#e8f3e9] text-[#10B981] border-[#10B981]/20 dark:bg-[#16A34A]/100/10 dark:text-[#2E5E2C] dark:border-[#16A34A]/20', badgeSeller: 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/20 dark:bg-[#16A34A]/100/10 dark:text-[#2E5E2C] dark:border-[#16A34A]/20', icon: CheckCircle },
  RETURN_PENDING: { label: 'Return Pending', badge: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20', badgeSeller: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20', icon: Truck },
  RETURN_SHIPPED: { label: 'Return Shipped', badge: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20', badgeSeller: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20', icon: Truck },
  RETURN_RECEIVED: { label: 'Return Received', badge: 'bg-[#e8f3e9] text-[#10B981] border-[#10B981]/20 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20', badgeSeller: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20', icon: CheckCircle },
  PRODUCT_INSPECTION: { label: 'Product Inspection', badge: 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20', badgeSeller: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20', icon: Scale },
  INSPECTION_COMPLETE: { label: 'Inspection Complete', badge: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20', badgeSeller: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20', icon: CheckCircle },
  REFUND_PROCESSING: { label: 'Refund Processing', badge: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20', badgeSeller: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20', icon: Clock },
  PENDING_ADMIN_VERIFICATION: { label: 'Admin Verification', badge: 'bg-purple-50 text-purple-700 border-purple-250 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20', badgeSeller: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20', icon: Clock },
  REFUND_COMPLETED: { label: 'Refund Completed', badge: 'bg-[#e8f3e9] text-[#10B981] border-[#10B981]/20 dark:bg-[#16A34A]/15 dark:text-[#16A34A] dark:border-[#16A34A]/30', badgeSeller: 'bg-[#16A34A]/20 text-emerald-800 border-[#16A34A]/30 dark:bg-[#16A34A]/15 dark:text-[#16A34A] dark:border-[#16A34A]/30', icon: CheckCircle },
  SELLER_REJECTED: { label: 'Rejected by Seller', badge: 'bg-red-50 text-red-505 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30', badgeSeller: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30', icon: AlertTriangle },
  CUSTOMER_ACCEPTS: { label: 'Offer Accepted', badge: 'bg-[#e8f3e9] text-[#10B981] border-[#10B981]/20 dark:bg-[#16A34A]/10 dark:text-[#16A34A] dark:border-[#16A34A]/20', badgeSeller: 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/20 dark:bg-[#16A34A]/10 dark:text-[#16A34A] dark:border-[#16A34A]/20', icon: CheckCircle },
  CLOSED: { label: 'Closed', badge: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10', badgeSeller: 'bg-gray-250 text-gray-500 border-gray-300 dark:bg-white/5 dark:text-gray-400 dark:border-white/10', icon: CheckCircle },
  ADMIN_REVIEW: { label: 'Admin Review', badge: 'bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20', badgeSeller: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20', icon: Scale },
  ADMIN_APPROVED_REFUND: { label: 'Approved by Admin', badge: 'bg-[#e8f3e9] text-[#10B981] border-[#10B981]/20 dark:bg-[#16A34A]/100/10 dark:text-[#2E5E2C] dark:border-[#16A34A]/20', badgeSeller: 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/20 dark:bg-[#16A34A]/100/10 dark:text-[#2E5E2C] dark:border-[#16A34A]/20', icon: CheckCircle },
  ADMIN_REJECTED_REFUND: { label: 'Rejected by Admin', badge: 'bg-red-50 text-red-500 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30', badgeSeller: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30', icon: AlertTriangle },
  REPLACEMENT_PREPARING: { label: 'Replacement Preparing', badge: 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20', badgeSeller: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20', icon: Clock },
  REPLACEMENT_SHIPPED: { label: 'Replacement Shipped', badge: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20', badgeSeller: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20', icon: Truck },
  EXCHANGE_COMPLETED: { label: 'Exchange Completed', badge: 'bg-[#e8f3e9] text-[#10B981] border-[#10B981]/20 dark:bg-[#16A34A]/15 dark:text-[#16A34A] dark:border-[#16A34A]/30', badgeSeller: 'bg-[#16A34A]/20 text-emerald-800 border-[#16A34A]/30 dark:bg-[#16A34A]/15 dark:text-[#16A34A] dark:border-[#16A34A]/30', icon: CheckCircle }
};

export const getStatusLabel = (status) => {
  return STATUS_META[status]?.label || status;
};

export const getBadgeClass = (status, isDark) => {
  return STATUS_META[status]?.badgeSeller || 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10';
};

export const getStatusMeta = (status) => {
  return STATUS_META[status] || { label: status, badge: 'bg-gray-50 text-gray-500 border-gray-200', icon: HelpCircle };
};
