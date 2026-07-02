import React from 'react';
import { resolveWorkflowBranch } from './StatusResolver';
import FullRefundBranch from '../../components/branches/FullRefundBranch';
import PartialRefundBranch from '../../components/branches/PartialRefundBranch';
import ExchangeBranch from '../../components/branches/ExchangeBranch';
import EvidenceBranch from '../../components/branches/EvidenceBranch';
import AdminEscalationBranch from '../../components/branches/AdminEscalationBranch';

export default function RefundWorkflowEngine({
  actorRole,
  detail,
  onRefresh,
  setActionError,
  hooksContext = {},
  customerCounterLog = null,
  hasPendingCounterOffer = false,
  isDark = false
}) {
  const currentBranch = resolveWorkflowBranch(detail.status, detail.type);

  switch (currentBranch) {
    case 'EVIDENCE':
      return (
        <EvidenceBranch
          actorRole={actorRole}
          detail={detail}
          onRefresh={onRefresh}
          setActionError={setActionError}
          hooksContext={hooksContext}
          isDark={isDark}
        />
      );

    case 'PARTIAL_REFUND':
      return (
        <PartialRefundBranch
          actorRole={actorRole}
          detail={detail}
          onRefresh={onRefresh}
          setActionError={setActionError}
          hooksContext={hooksContext}
          customerCounterLog={customerCounterLog}
          hasPendingCounterOffer={hasPendingCounterOffer}
          isDark={isDark}
        />
      );

    case 'EXCHANGE':
      return (
        <ExchangeBranch
          actorRole={actorRole}
          detail={detail}
          onRefresh={onRefresh}
          setActionError={setActionError}
          hooksContext={hooksContext}
          isDark={isDark}
        />
      );

    case 'ADMIN':
      return (
        <AdminEscalationBranch
          actorRole={actorRole}
          detail={detail}
          isDark={isDark}
        />
      );

    case 'FULL_REFUND':
    default:
      return (
        <FullRefundBranch
          actorRole={actorRole}
          detail={detail}
          onRefresh={onRefresh}
          setActionError={setActionError}
          hooksContext={hooksContext}
          isDark={isDark}
        />
      );
  }
}
