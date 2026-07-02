import React from 'react';
import UploadEvidencePage from '../../customer/UploadEvidencePage';
import ReviewEvidencePage from '../../seller/ReviewEvidencePage';

export default function EvidenceBranch({
  actorRole,
  detail,
  onRefresh,
  setActionError,
  hooksContext,
  isDark = false
}) {
  if (actorRole === 'CUSTOMER') {
    return (
      <UploadEvidencePage
        detail={detail}
        onRefresh={onRefresh}
        setActionError={setActionError}
      />
    );
  }

  return (
    <ReviewEvidencePage
      detail={detail}
      hooksContext={hooksContext}
      isDark={isDark}
    />
  );
}
