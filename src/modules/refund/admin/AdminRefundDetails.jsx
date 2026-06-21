import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CreditCard, CheckCircle, User, ShoppingBag, FileText, Package } from 'lucide-react';
import AdminArbitration from './status-views/AdminArbitration';
import AdminDirectDisburse from './status-views/AdminDirectDisburse';
import AdminPayoutVerification from './status-views/AdminPayoutVerification';
import { getAdminOrderDetail } from '../../admin/services/adminService';
import { BASE_URL } from '../../../shared/api/apiClient';


const money = (v) => v != null ? `NPR ${Number(v).toLocaleString()}` : '—';
const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const STATUS_BADGES = {
  REQUEST_CREATED: 'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  MORE_EVIDENCE_REQUESTED: 'bg-red-50 text-red-600 border-red-200',
  OFFER_MADE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SELLER_APPROVED: 'bg-[#16A34A]/10 text-[#152F17] border-[#16A34A]/20',
  RETURN_PENDING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RETURN_SHIPPED: 'bg-sky-50 text-sky-700 border-sky-200',
  RETURN_RECEIVED: 'bg-teal-50 text-teal-700 border-teal-200',
  PRODUCT_INSPECTION: 'bg-violet-50 text-violet-700 border-violet-200',
  INSPECTION_COMPLETE: 'bg-purple-50 text-purple-700 border-purple-200',
  REFUND_PROCESSING: 'bg-orange-50 text-orange-700 border-orange-200',
  PENDING_ADMIN_VERIFICATION: 'bg-purple-50 text-purple-700 border-purple-200',
  REFUND_COMPLETED: 'bg-[#16A34A]/20 text-emerald-800 border-[#16A34A]/30',
  SELLER_REJECTED: 'bg-red-100 text-red-700 border-red-300',
  CLOSED: 'bg-gray-150 text-gray-500 border-gray-300',
  ADMIN_REVIEW: 'bg-pink-50 text-pink-700 border-pink-200',
  EXCHANGE_COMPLETED: 'bg-[#16A34A]/20 text-emerald-800 border-[#16A34A]/30'
};

export default function AdminRefundDetails({ refund, onActionCompleted, themeClasses }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [orderDetail, setOrderDetail] = useState(null);

  useEffect(() => {
    const hasMissingImages = !refund.productImage || refund.items?.some(item => !item.imagePath);
    if (refund.orderId && hasMissingImages) {
      getAdminOrderDetail(refund.orderId)
        .then(res => setOrderDetail(res.data))
        .catch(err => console.error('Failed to load admin order details for fallback', err));
    }
  }, [refund.orderId, refund.productImage, refund.items]);

  const getImgUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };


  const badgeClass = STATUS_BADGES[refund.status] || 'bg-gray-50 text-gray-600 border-gray-200';
  const needsArbitration = refund.status === 'ADMIN_REVIEW';
  const needsPayment = refund.status === 'REFUND_PROCESSING';
  const needsVerification = refund.status === 'PENDING_ADMIN_VERIFICATION';

  const renderStatusAction = () => {
    if (needsArbitration) {
      return (
        <AdminArbitration
          refund={refund}
          onActionCompleted={onActionCompleted}
          setError={setError}
        />
      );
    }
    if (needsPayment) {
      return (
        <AdminDirectDisburse
          refund={refund}
          onActionCompleted={onActionCompleted}
          setError={setError}
        />
      );
    }
    if (needsVerification) {
      return (
        <AdminPayoutVerification
          refund={refund}
          onActionCompleted={onActionCompleted}
          setError={setError}
        />
      );
    }
    return null;
  };

  return (
    <div className={`rounded-xl border transition-all ${
      open ? 'border-[#16A34A] shadow-md' : themeClasses.border.primary
    } ${themeClasses.card}`}>
      {/* Summary Header Row */}
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 py-4 text-left rounded-xl hover:bg-gray-50/50 cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          {needsArbitration ? (
            <AlertTriangle size={16} className="text-pink-500 shrink-0" />
          ) : needsPayment ? (
            <CreditCard size={16} className="text-orange-500 shrink-0" />
          ) : (
            <CheckCircle size={16} className="text-gray-400 shrink-0" />
          )}
          <div className="w-24 h-24 rounded-lg border flex items-center justify-center p-1 bg-gray-50 border-gray-150 shrink-0 overflow-hidden">
            {(() => {
              const matchingOi = orderDetail?.items?.find(oi => oi.id === refund.items?.[0]?.orderItemId || oi.productId === refund.items?.[0]?.productId) || orderDetail?.items?.[0];
              const imgPath = refund.productImage || refund.items?.[0]?.imagePath || matchingOi?.imagePath || matchingOi?.productImage;
              if (!imgPath) return <Package size={22} className="text-gray-400" />;
              return <img src={getImgUrl(imgPath)} alt="" className="max-w-full max-h-full object-contain" />;
            })()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black text-gray-800">{refund.refundNumber}</span>
              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase ${badgeClass}`}>
                {refund.status.replace('_', ' ')}
              </span>
              {needsArbitration && (
                <span className="bg-pink-100 text-pink-700 border border-pink-200 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider animate-pulse">
                  Arbitration Required
                </span>
              )}
              {needsPayment && (
                <span className="bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider animate-pulse">
                  Payment Pending
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-555 font-semibold mt-0.5">
              Order #{refund.orderNumber || refund.orderId} &bull; Customer: {refund.customerName}
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {/* Expanded Details */}
      {open && (
        <div className="px-5 pb-5 border-t border-gray-150 pt-4 space-y-4 text-xs">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 font-bold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-bold text-gray-750">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Customer Name</span>
              <span className="flex items-center gap-1"><User size={13} className="text-gray-450" /> {refund.customerName}</span>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Customer Email</span>
              <span>{refund.customerEmail || '—'}</span>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Refund Value</span>
              <span className="font-black text-gray-900">{money(refund.refundAmount)}</span>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Resolution Request</span>
              <span className="uppercase text-[#152F17]">{refund.type}</span>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Submitted Date</span>
              <span>{dateLabel(refund.createdAt)}</span>
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Seller Partner</span>
              <span>{refund.sellerName || `Seller ID #${refund.sellerId}`}</span>
            </div>
            {refund.returnRequired != null && (
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Return Requirement</span>
                <span className={`font-bold ${refund.returnRequired ? 'text-indigo-600' : 'text-[#16A34A]'}`}>
                  {refund.returnRequired ? 'Need Return' : 'No Return (Direct Refund)'}
                </span>
              </div>
            )}
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Items Selected</span>
              <span className="font-bold">{refund.items?.length || 1} Item(s)</span>
            </div>
          </div>

          {/* Disputed Items with images */}
          <div className="border border-gray-150 p-3.5 rounded-xl space-y-3 bg-gray-50/30">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Disputed Items details</span>
            <div className="space-y-3">
              {refund.items?.map((item, idx) => {
                const matchingOi = orderDetail?.items?.find(oi => oi.id === item.orderItemId || oi.productId === item.productId);
                const imgPath = item.imagePath || matchingOi?.imagePath || matchingOi?.productImage;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-24 h-24 rounded-lg border flex items-center justify-center p-1 bg-white border-gray-200 shrink-0 overflow-hidden">
                      {imgPath ? (
                        <img 
                          src={getImgUrl(imgPath)} 
                          alt="" 
                          className="max-w-full max-h-full object-contain" 
                        />
                      ) : (
                        <Package size={22} className="text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="font-bold text-gray-900 truncate">{item.productName || 'Disputed Item'}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-bold">
                        Qty: <span className="text-gray-700">{item.quantity}</span> &bull; 
                        Refund: <span className="text-gray-700">NPR {Number(item.refundAmount || 0).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Reason Statement</span>
              <p className="font-medium text-gray-700 leading-relaxed">
                {refund.reason.replace('_', ' ')} &bull; {refund.description || 'No additional statement.'}
              </p>
            </div>

            {refund.adminDecision && (
              <div className="bg-pink-50/20 border border-pink-100 p-3 rounded-lg">
                <span className="text-[9px] font-black uppercase tracking-widest text-pink-700 block mb-1">Appeal notes</span>
                <p className="font-medium text-pink-900 leading-relaxed">{refund.adminDecision}</p>
              </div>
            )}
          </div>

          {/* Evidence review */}
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">Attached Proof Evidence</span>
            {refund.evidence && refund.evidence.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {refund.evidence.map(e => (
                  <a
                    key={e.id}
                    href={`http://localhost:8080${e.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 border border-gray-150 rounded-lg p-2.5 bg-gray-50/50 hover:bg-gray-50 hover:border-emerald-400 transition-colors text-xs font-semibold"
                  >
                    <FileText size={14} className="text-gray-400" />
                    <span className="truncate flex-1">View File</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-405 italic">No attachments submitted by customer.</p>
            )}
          </div>

          {/* Inspection verdict details (if available) */}
          {refund.inspection && (
            <div className="border border-purple-100 bg-purple-50/15 p-3 rounded-lg">
              <span className="text-[9px] font-black uppercase tracking-widest text-purple-700 block mb-1.5 font-bold">Seller Inspection Verdict</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Verdict: <strong className="text-purple-900 font-bold">{refund.inspection.verdict}</strong></div>
                <div>Damage Severity Score: <strong className="text-purple-900 font-bold">{refund.inspection.severityScore}/10</strong></div>
                <div className="col-span-2 text-gray-600 mt-1 font-medium">Inspector Notes: {refund.inspection.inspectorNotes || 'No notes.'}</div>
              </div>
            </div>
          )}

          {/* Seller Refund Payout Proof (if available) */}
          {refund.paymentProofUrl && (
            <div className="border border-orange-200 bg-orange-50/10 p-4 rounded-lg space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-orange-850 block font-bold">Seller Refund Payout Proof</span>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase tracking-widest">Transaction Reference</span>
                  <strong className="text-gray-900 font-mono font-bold bg-white px-2 py-1 border border-gray-200 rounded inline-block mt-0.5">
                    {refund.paymentReference}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase tracking-widest">Submitted Date</span>
                  <strong className="text-gray-900 font-bold">{dateLabel(refund.updatedAt)}</strong>
                </div>
              </div>
              {refund.paymentComment && (
                <div>
                  <span className="text-gray-455 block text-[9px] uppercase tracking-widest mb-1">Remarks / Comments</span>
                  <p className="text-gray-700 bg-white border border-gray-200 rounded-lg p-2.5 leading-relaxed">
                    {refund.paymentComment}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-455 block text-[9px] uppercase tracking-widest mb-2">Screenshot Proof Attachment</span>
                <a
                  href={`http://localhost:8080${refund.paymentProofUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block relative rounded-lg overflow-hidden border border-gray-200 aspect-video w-48 bg-white"
                >
                  <img
                    src={`http://localhost:8080${refund.paymentProofUrl}`}
                    alt="Payout Proof"
                    className="w-full h-full object-cover"
                  />
                </a>
              </div>
            </div>
          )}

          {/* Decision actions panels */}
          {renderStatusAction()}

          {/* Audit Logs list */}
          <div className="border border-gray-150 p-4 rounded-xl space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Case Audit Trails</h4>
            <div className="space-y-3 max-h-32 overflow-y-auto pr-1">
              {refund.auditLogs && refund.auditLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start text-xs">
                  <div className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700">{log.notes || 'Status changed'}</p>
                    <p className="text-[9px] text-gray-450 font-medium">Actor: {log.actorRole} &bull; {new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
