import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CreditCard, CheckCircle, User, ShoppingBag, FileText, Package } from 'lucide-react';
import AdminArbitration from './status-views/AdminArbitration';
import AdminDirectDisburse from './status-views/AdminDirectDisburse';
import AdminPayoutVerification from './status-views/AdminPayoutVerification';
import { getAdminOrderDetail } from '../../admin/api/adminApi';
import { BASE_URL } from '../../../shared/api/apiClient';


const money = (v) => v != null ? `NPR ${Number(v).toLocaleString()}` : '—';
const dateLabel = (v) => v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const getStatusBadgeClass = (status, darkMode) => {
  const map = {
    REQUEST_CREATED:             darkMode ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200',
    UNDER_REVIEW:                darkMode ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200',
    MORE_EVIDENCE_REQUESTED:     darkMode ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-650 border-red-200',
    OFFER_MADE:                  darkMode ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
    SELLER_APPROVED:             darkMode ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    RETURN_PENDING:              darkMode ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
    RETURN_SHIPPED:              darkMode ? 'bg-sky-900/30 text-sky-400 border-sky-800' : 'bg-sky-50 text-sky-700 border-sky-200',
    RETURN_RECEIVED:             darkMode ? 'bg-teal-900/30 text-teal-400 border-teal-800' : 'bg-teal-50 text-teal-700 border-teal-200',
    PRODUCT_INSPECTION:          darkMode ? 'bg-violet-900/30 text-violet-400 border-violet-800' : 'bg-violet-50 text-violet-700 border-violet-200',
    INSPECTION_COMPLETE:         darkMode ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200',
    REFUND_PROCESSING:           darkMode ? 'bg-orange-900/30 text-orange-400 border-orange-800' : 'bg-orange-50 text-orange-700 border-orange-200',
    PENDING_ADMIN_VERIFICATION:  darkMode ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200',
    REFUND_COMPLETED:            darkMode ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SELLER_REJECTED:             darkMode ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-650 border-red-200',
    CLOSED:                      darkMode ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-150 text-gray-500 border-gray-300',
    ADMIN_REVIEW:                darkMode ? 'bg-pink-900/30 text-pink-400 border-pink-800' : 'bg-pink-50 text-pink-700 border-pink-200',
    ADMIN_APPROVED_REFUND:       darkMode ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ADMIN_REJECTED_REFUND:       darkMode ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-650 border-red-200',
    REPLACEMENT_PREPARING:       darkMode ? 'bg-violet-900/30 text-violet-400 border-violet-800' : 'bg-violet-50 text-violet-700 border-violet-200',
    REPLACEMENT_SHIPPED:         darkMode ? 'bg-sky-900/30 text-sky-400 border-sky-800' : 'bg-sky-50 text-sky-700 border-sky-200',
    EXCHANGE_COMPLETED:          darkMode ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
  return map[status] || (darkMode ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-600 border-gray-200');
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


  const badgeClass = getStatusBadgeClass(refund.status, themeClasses.darkMode);
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
          themeClasses={themeClasses}
        />
      );
    }
    if (needsPayment) {
      return (
        <AdminDirectDisburse
          refund={refund}
          onActionCompleted={onActionCompleted}
          setError={setError}
          themeClasses={themeClasses}
        />
      );
    }
    if (needsVerification) {
      return (
        <AdminPayoutVerification
          refund={refund}
          onActionCompleted={onActionCompleted}
          setError={setError}
          themeClasses={themeClasses}
        />
      );
    }
    return null;
  };

  return (
    <div className={`rounded-xl border transition-all ${
      open ? themeClasses.border.accent + ' shadow-md' : themeClasses.border.primary
    } ${themeClasses.card}`}>
      {/* Summary Header Row */}
      <button
        onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left rounded-xl hover:${themeClasses.bg.secondary} cursor-pointer`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {needsArbitration ? (
            <AlertTriangle size={16} className="text-pink-500 shrink-0" />
          ) : needsPayment ? (
            <CreditCard size={16} className="text-orange-500 shrink-0" />
          ) : (
            <CheckCircle size={16} className="text-gray-400 shrink-0" />
          )}
          <div className={`w-24 h-24 rounded-lg border flex items-center justify-center p-1 shrink-0 overflow-hidden transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
            {(() => {
              const matchingOi = orderDetail?.items?.find(oi => oi.id === refund.items?.[0]?.orderItemId || oi.productId === refund.items?.[0]?.productId) || orderDetail?.items?.[0];
              const imgPath = refund.productImage || refund.items?.[0]?.imagePath || matchingOi?.imagePath || matchingOi?.productImage;
              if (!imgPath) return <Package size={22} className="text-gray-400" />;
              return <img src={getImgUrl(imgPath)} alt="" className="max-w-full max-h-full object-contain" />;
            })()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-mono text-xs font-black transition-colors ${themeClasses.text.primary}`}>{refund.refundNumber}</span>
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
            <p className={`text-[10px] font-semibold mt-0.5 transition-colors ${themeClasses.text.secondary}`}>
              Order #{refund.orderNumber || refund.orderId} &bull; Customer: {refund.customerName}
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className={themeClasses.text.tertiary} /> : <ChevronDown size={16} className={themeClasses.text.tertiary} />}
      </button>

      {/* Expanded Details */}
      {open && (
        <div className={`px-5 pb-5 border-t pt-4 space-y-4 text-xs transition-colors ${themeClasses.border.primary}`}>
          {error && (
            <div className={`rounded-lg p-3 font-bold transition-colors ${themeClasses.status.danger}`}>
              {error}
            </div>
          )}

          {needsArbitration && (
            <div className={`rounded-xl border p-4 transition-colors ${themeClasses.status.info}`}>
              <h3 className={`text-xs font-black uppercase tracking-wider ${themeClasses.text.info}`}>Review and resolve dispute.</h3>
              <p className={`mt-1 text-xs font-semibold leading-relaxed ${themeClasses.text.secondary}`}>
                Compare the customer claim, seller history, evidence, item amount, inspection details, and audit timeline before choosing a resolution.
              </p>
            </div>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 font-bold ${themeClasses.text.primary}`}>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-0.5 transition-colors ${themeClasses.text.tertiary}`}>Customer Name</span>
              <span className="flex items-center gap-1"><User size={13} className="text-emerald-500" /> {refund.customerName}</span>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-0.5 transition-colors ${themeClasses.text.tertiary}`}>Customer Email</span>
              <span className={`transition-colors ${themeClasses.text.secondary}`}>{refund.customerEmail || '—'}</span>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-0.5 transition-colors ${themeClasses.text.tertiary}`}>Refund Value</span>
              <span className={`font-black transition-colors ${themeClasses.text.primary}`}>{money(refund.refundAmount)}</span>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-0.5 transition-colors ${themeClasses.text.tertiary}`}>Resolution Request</span>
              <span className={`uppercase transition-colors ${themeClasses.text.accent}`}>{refund.type}</span>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-0.5 transition-colors ${themeClasses.text.tertiary}`}>Submitted Date</span>
              <span className={`transition-colors ${themeClasses.text.secondary}`}>{dateLabel(refund.createdAt)}</span>
            </div>
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-0.5 transition-colors ${themeClasses.text.tertiary}`}>Seller Partner</span>
              <span className={`transition-colors ${themeClasses.text.secondary}`}>{refund.sellerName || `Seller ID #${refund.sellerId}`}</span>
            </div>
            {refund.returnRequired != null && (
              <div>
                <span className={`text-[9px] font-black uppercase tracking-widest block mb-0.5 transition-colors ${themeClasses.text.tertiary}`}>Return Requirement</span>
                <span className={`font-bold ${refund.returnRequired ? 'text-indigo-500' : 'text-emerald-500'}`}>
                  {refund.returnRequired ? 'Need Return' : 'No Return (Direct Refund)'}
                </span>
              </div>
            )}
            <div>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-0.5 transition-colors ${themeClasses.text.tertiary}`}>Items Selected</span>
              <span className={`font-bold transition-colors ${themeClasses.text.secondary}`}>{refund.items?.length || 1} Item(s)</span>
            </div>
          </div>

          {/* Disputed Items with images */}
          <div className={`border p-3.5 rounded-xl space-y-3 transition-colors ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
            <span className={`text-[9px] font-black uppercase tracking-widest block transition-colors ${themeClasses.text.tertiary}`}>Disputed Items details</span>
            <div className="space-y-3">
              {refund.items?.map((item, idx) => {
                const matchingOi = orderDetail?.items?.find(oi => oi.id === item.orderItemId || oi.productId === item.productId);
                const imgPath = item.imagePath || matchingOi?.imagePath || matchingOi?.productImage;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-24 h-24 rounded-lg border flex items-center justify-center p-1 shrink-0 overflow-hidden transition-colors ${themeClasses.bg.primary} ${themeClasses.border.primary}`}>
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
                      <p className={`font-bold truncate transition-colors ${themeClasses.text.primary}`}>{item.productName || 'Disputed Item'}</p>
                      <p className={`text-[10px] mt-0.5 font-bold transition-colors ${themeClasses.text.tertiary}`}>
                        Qty: <span className={themeClasses.text.secondary}>{item.quantity}</span> &bull; 
                        Refund: <span className={themeClasses.text.secondary}>NPR {Number(item.refundAmount || 0).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className={`border p-3 rounded-xl transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary}`}>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.tertiary}`}>Reason Statement</span>
              <p className={`font-medium leading-relaxed transition-colors ${themeClasses.text.secondary}`}>
                {refund.reason.replace('_', ' ')} &bull; {refund.description || 'No additional statement.'}
              </p>
            </div>

            {refund.adminDecision && (
              <div className={`border p-3 rounded-xl transition-colors ${themeClasses.status.info}`}>
                <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 transition-colors ${themeClasses.text.info}`}>Appeal notes</span>
                <p className={`font-medium leading-relaxed transition-colors ${themeClasses.text.info}`}>{refund.adminDecision}</p>
              </div>
            )}
          </div>

          {/* Evidence review */}
          <div>
            <span className={`text-[9px] font-black uppercase tracking-widest block mb-2 transition-colors ${themeClasses.text.tertiary}`}>Attached Proof Evidence</span>
            {refund.evidence && refund.evidence.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {refund.evidence.map(e => (
                  <a
                    key={e.id}
                    href={`http://localhost:8080${e.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-2 border rounded-lg p-2.5 transition-colors text-xs font-semibold ${themeClasses.border.primary} ${themeClasses.bg.secondary} hover:${themeClasses.bg.tertiary} hover:border-emerald-500`}
                  >
                    <FileText size={14} className={themeClasses.text.tertiary} />
                    <span className={`truncate flex-1 transition-colors ${themeClasses.text.primary}`}>View File</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className={`text-xs italic transition-colors ${themeClasses.text.tertiary}`}>No attachments submitted by customer.</p>
            )}
          </div>

          {/* Inspection verdict details (if available) */}
          {refund.inspection && (
            <div className={`border p-3 rounded-xl transition-colors ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
              <span className={`text-[9px] font-black uppercase tracking-widest block mb-1.5 font-bold transition-colors ${themeClasses.text.primary}`}>Seller Inspection Verdict</span>
              <div className={`grid grid-cols-2 gap-2 text-xs transition-colors ${themeClasses.text.secondary}`}>
                <div>Verdict: <strong className={`font-bold transition-colors ${themeClasses.text.primary}`}>{refund.inspection.verdict}</strong></div>
                <div>Damage Severity Score: <strong className={`font-bold transition-colors ${themeClasses.text.primary}`}>{refund.inspection.severityScore}/10</strong></div>
                <div className={`col-span-2 mt-1 font-medium transition-colors ${themeClasses.text.secondary}`}>Inspector Notes: {refund.inspection.inspectorNotes || 'No notes.'}</div>
              </div>
            </div>
          )}

          {/* Seller Refund Payout Proof (if available) */}
          {refund.paymentProofUrl && (
            <div className={`border p-4 rounded-xl space-y-3 transition-colors ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
              <span className={`text-[9px] font-black uppercase tracking-widest block font-bold transition-colors ${themeClasses.text.primary}`}>Seller Refund Payout Proof</span>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className={`block text-[9px] uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>Transaction Reference</span>
                  <strong className={`font-mono font-bold border rounded inline-block px-2 py-1 mt-0.5 transition-colors ${themeClasses.bg.primary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}>
                    {refund.paymentReference}
                  </strong>
                </div>
                <div>
                  <span className={`block text-[9px] uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>Submitted Date</span>
                  <strong className={`font-bold transition-colors ${themeClasses.text.primary}`}>{dateLabel(refund.updatedAt)}</strong>
                </div>
              </div>
              {refund.paymentComment && (
                <div>
                  <span className={`block text-[9px] uppercase tracking-widest mb-1 transition-colors ${themeClasses.text.tertiary}`}>Remarks / Comments</span>
                  <p className={`rounded-lg p-2.5 leading-relaxed border transition-colors ${themeClasses.bg.primary} ${themeClasses.border.primary} ${themeClasses.text.secondary}`}>
                    {refund.paymentComment}
                  </p>
                </div>
              )}
              <div>
                <span className={`block text-[9px] uppercase tracking-widest mb-2 transition-colors ${themeClasses.text.tertiary}`}>Screenshot Proof Attachment</span>
                <a
                  href={`http://localhost:8080${refund.paymentProofUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-block relative rounded-lg overflow-hidden border aspect-video w-48 transition-colors ${themeClasses.bg.primary} ${themeClasses.border.primary}`}
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
          <div className={`border p-4 rounded-xl space-y-3 transition-colors ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
            <h4 className={`text-[10px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>Case Audit Trails</h4>
            <div className="space-y-3 max-h-32 overflow-y-auto pr-1">
              {refund.auditLogs && refund.auditLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start text-xs">
                  <div className={`w-1 h-1 rounded-full mt-2 shrink-0 transition-colors ${themeClasses.bg.tertiary}`} />
                  <div>
                    <p className={`font-semibold transition-colors ${themeClasses.text.secondary}`}>{log.notes || 'Status changed'}</p>
                    <p className={`text-[9px] font-medium transition-colors ${themeClasses.text.tertiary}`}>Actor: {log.actorRole} &bull; {new Date(log.createdAt).toLocaleString()}</p>
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
