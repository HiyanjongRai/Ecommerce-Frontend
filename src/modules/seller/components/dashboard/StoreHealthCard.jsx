import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, Clock, Award, AlertOctagon, ArrowRight } from 'lucide-react';

const StoreHealthCard = ({ cancellationRate, lowStockCount, outOfStockCount, colors, isDark }) => {
  const navigate = useNavigate();
  const isHealthyInventory = lowStockCount === 0 && outOfStockCount === 0;

  const metrics = [
    {
      label: 'Response Rate',
      value: '98%',
      status: 'Excellent',
      icon: Clock,
      color: colors.primaryGreen
    },
    {
      label: 'Late Shipment',
      value: '0%',
      status: 'Perfect',
      icon: ShieldCheck,
      color: colors.primaryGreen
    },
    {
      label: 'Cancellation Rate',
      value: cancellationRate || '0%',
      status: 'Excellent',
      icon: AlertOctagon,
      color: colors.primaryGreen
    },
    {
      label: 'Inventory Health',
      value: isHealthyInventory ? 'Healthy' : 'Restock Alert',
      status: isHealthyInventory ? 'Optimal' : `${lowStockCount} low stock`,
      icon: Award,
      color: isHealthyInventory ? colors.primaryGreen : colors.warning
    }
  ];

  return (
    <div 
      className="sc-card" 
      onClick={() => navigate('/seller/performance')}
      style={{ 
        boxShadow: '0 1px 2px rgba(0,0,0,.04)',
        border: `1.5px solid ${colors.primaryGreen}30`, // Subtle emerald outline
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: isDark ? 'rgba(22, 163, 74, 0.02)' : '#F0FDF4', // Soft Green Surface
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 163, 74, 0.08)';
        e.currentTarget.style.borderColor = colors.primaryGreen;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,.04)';
        e.currentTarget.style.borderColor = `${colors.primaryGreen}30`;
      }}
    >
      <div>
        {/* Header with rating score */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            borderBottom: `1px solid ${colors.primaryGreen}20`, 
            paddingBottom: '14px', 
            marginBottom: '20px' 
          }}
        >
          <div>
            <span 
              style={{ 
                fontSize: '10px', 
                fontWeight: '800', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                backgroundColor: '#ECFDF5', // Success Surface
                color: colors.primaryGreen,
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              Store Standing
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: colors.textMain, margin: '6px 0 0 0' }}>
              Excellent Seller Performance
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} size={15} fill="#EAB308" color="#EAB308" />
            ))}
            <span style={{ fontSize: '13px', fontWeight: '800', color: colors.textMain, marginLeft: '4px' }}>
              5.0
            </span>
          </div>
        </div>

        {/* Metric chips */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div 
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF', // Clean white background surface
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: colors.textSec, whiteSpace: 'nowrap' }}>
                    {m.label}
                  </span>
                  <Icon size={14} style={{ color: m.color }} />
                </div>
                <p style={{ fontSize: '20px', fontWeight: '800', color: colors.textMain, margin: '2px 0 0 0', lineHeight: 1.1 }}>
                  {m.value}
                </p>
                <span 
                  style={{ 
                    fontSize: '10px', 
                    fontWeight: '700', 
                    color: m.color, 
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    margin: '1px 0 0 0'
                  }}
                >
                  {m.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drill-down link */}
      <div 
        style={{ 
          borderTop: `1px solid ${colors.primaryGreen}15`, 
          paddingTop: '12px', 
          display: 'flex', 
          justifyContent: 'flex-end' 
        }}
      >
        <span 
          style={{ 
            fontSize: '12.5px', 
            fontWeight: '700', 
            color: colors.primaryGreen, 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px' 
          }}
        >
          View full report <ArrowRight size={14} />
        </span>
      </div>
    </div>
  );
};

export default StoreHealthCard;
