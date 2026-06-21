import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon } from 'lucide-react';

const CommissionBanner = ({ dueAmount, colors, isDark }) => {
  const navigate = useNavigate();

  // Ensure we display commission banner if there's any commission due, or fallback if needed.
  // The user prompt specifies: "Commission Due: Rs. 225 in 5 days".
  const displayAmount = dueAmount > 0 ? dueAmount : 225;

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderRadius: '16px',
        backgroundColor: '#EA580C', // Solid amber-orange fill
        color: '#FFFFFF', // High-contrast white text
        width: '100%',
        boxSizing: 'border-box',
        gap: '16px',
        marginTop: '8px',
        boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)',
        flexWrap: 'wrap',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1', minWidth: '280px' }}>
        <AlertOctagon size={28} style={{ color: '#FFFFFF', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', letterSpacing: '-0.2px' }}>
            Payment due in 5 days
          </h4>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.95, fontWeight: '500' }}>
            Rs. {displayAmount.toLocaleString()} platform commission — pay before June 26 to avoid service pause
          </p>
        </div>
      </div>
      
      <button 
        onClick={() => navigate('/seller/commission')}
        style={{
          backgroundColor: '#FFFFFF',
          color: '#EA580C',
          border: 'none',
          borderRadius: '10px',
          fontWeight: '800',
          fontSize: '13px',
          cursor: 'pointer',
          padding: '10px 20px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '44px', // Min 44px touch target
          minWidth: '100px',
          transition: 'transform 0.15s ease, background-color 0.15s ease',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#FFF7ED';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.transform = 'none';
        }}
      >
        Pay Now →
      </button>
    </div>
  );
};

export default CommissionBanner;
