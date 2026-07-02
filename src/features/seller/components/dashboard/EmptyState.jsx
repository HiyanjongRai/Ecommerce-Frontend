import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const EmptyState = ({
  message = 'Everything looks healthy ✓',
  subtitle = 'No action required at this moment.',
  colors,
  isDark
}) => {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
        borderRadius: '16px',
        backgroundColor: isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.02)',
        border: `1.5px dashed ${colors.primaryGreen}`,
        gap: '8px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <CheckCircle2 size={24} style={{ color: colors.primaryGreen }} />
      <h4 style={{ fontSize: '13.5px', fontWeight: '850', color: colors.textMain, margin: 0 }}>
        {message}
      </h4>
      <p style={{ fontSize: '11px', color: colors.textSec, margin: 0 }}>
        {subtitle}
      </p>
    </div>
  );
};

export default EmptyState;
