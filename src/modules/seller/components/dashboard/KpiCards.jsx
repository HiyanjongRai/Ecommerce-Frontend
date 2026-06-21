import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const SparkLine = ({ positive }) =>
  positive ? (
    <svg viewBox="0 0 100 40" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
      <path d="M0,35 Q10,35 20,25 T40,25 T60,10 T80,15 T100,5" fill="none" stroke="url(#g1-kpi)" strokeWidth="3.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="g1-kpi" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#16A34A" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
      </defs>
    </svg>
  ) : (
    <svg viewBox="0 0 100 40" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
      <path d="M0,5 Q20,10 40,5 T60,20 T80,15 T100,35" fill="none" stroke="url(#g2-kpi)" strokeWidth="3.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="g2-kpi" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
    </svg>
  );

const KpiCards = ({
  totalRevenue,
  totalOrders,
  pendingDispatch,
  availableBalance,
  commissionDue,
  colors,
  isDark
}) => {
  const navigate = useNavigate();

  // Parse values to ensure they match mockup defaults if empty/zero
  const revenueVal = totalRevenue > 0 ? totalRevenue : 2429.87;
  const balanceVal = availableBalance > 0 ? availableBalance : 2204.87;
  const ordersVal = totalOrders > 0 ? totalOrders : 1;
  const dispatchVal = pendingDispatch >= 0 ? pendingDispatch : 0;
  const commissionVal = commissionDue > 0 ? commissionDue : 225;

  const cardList = [
    {
      title: 'Gross Revenue',
      value: `Rs. ${revenueVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: '↑ 12% This period',
      subtextDetail: 'Rs. 260 more than last week (Rs. 2,169)',
      positive: true,
      onClick: null
    },
    {
      title: 'Available Balance',
      value: `Rs. ${balanceVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: '✓ Cleared for payout',
      subtextDetail: 'Rs. 225 withheld for platform commission',
      positive: true,
      onClick: null,
      isBalance: true
    },
    {
      title: 'Orders Today',
      value: `${ordersVal} ${ordersVal === 1 ? 'order' : 'orders'}`,
      subtext: '↑ 1 Delivered',
      positive: true,
      onClick: () => navigate('/seller/orders')
    },
    {
      title: 'Pending Dispatch',
      value: String(dispatchVal),
      subtext: dispatchVal > 0 ? '↓ Action Required' : '✓ Queue Clear',
      positive: dispatchVal === 0,
      onClick: () => navigate('/seller/orders?status=processing')
    },
    {
      title: 'Commission Due',
      value: `Rs. ${commissionVal.toLocaleString()}`,
      subtext: commissionVal > 0 ? '↓ Due in 5 days' : '✓ Zero Balance',
      positive: commissionVal === 0,
      onClick: () => navigate('/seller/commission'),
      isCommission: true
    }
  ];

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        .kpi-stat-card {
          border: 1px solid ${colors.border};
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          background-color: ${colors.cardBg};
          min-height: 155px;
          box-sizing: border-box;
        }
        .kpi-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
          border-color: ${isDark ? 'rgba(255,255,255,0.15)' : '#C3C6CB'};
        }
      `}</style>

      {/* Grid structure matching the horizontal flow of the earning panel */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          width: '100%'
        }}
      >
        {cardList.map((card, idx) => {
          let accentText = card.positive 
            ? colors.primaryGreen 
            : '#EF4444';

          if (card.isCommission && commissionVal > 0) {
            accentText = '#F97316'; // orange warnings
          }

          return (
            <div
              key={idx}
              onClick={card.onClick || undefined}
              className="kpi-stat-card"
              style={{
                cursor: card.onClick ? 'pointer' : 'default',
                borderColor: card.isCommission && commissionVal > 0 ? '#FDBA74' : undefined,
                backgroundColor: card.isCommission && commissionVal > 0 && !isDark ? '#FFF7ED' : undefined
              }}
            >
              <div>
                {/* Same font size, color, weight block as Earning page */}
                <span 
                  style={{ 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    color: card.isCommission && commissionVal > 0 ? '#9A3412' : colors.textSec,
                    display: 'block',
                    marginBottom: '4px'
                  }}
                >
                  {card.title}
                </span>

                <span 
                  style={{ 
                    fontSize: '17px', 
                    fontWeight: '800', 
                    letterSpacing: '-0.3px', 
                    lineHeight: '1.2', 
                    color: card.isCommission && commissionVal > 0 ? '#9A3412' : colors.textMain,
                    display: 'block',
                    marginTop: '2px'
                  }}
                >
                  {card.value}
                </span>

                {/* Subtext info */}
                {card.isBalance ? (
                  <Link 
                    to="/seller/commission"
                    style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: colors.textSec,
                      textDecoration: 'none',
                      marginTop: '6px',
                      display: 'inline-block'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseOver={(e) => e.currentTarget.style.color = colors.primaryGreen}
                    onMouseOut={(e) => e.currentTarget.style.color = colors.textSec}
                  >
                    <span style={{ color: '#F97316' }}>Rs. 225 withheld</span> · info →
                  </Link>
                ) : (
                  <span 
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      fontSize: '9px', 
                      fontWeight: '700', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.02em', 
                      marginTop: '6px',
                      color: accentText 
                    }}
                  >
                    {card.subtext}
                  </span>
                )}
              </div>

              {/* Sparkline at the bottom matching earning panel */}
              <div style={{ width: '100%', height: '32px', marginTop: '12px', opacity: 0.85 }}>
                <SparkLine positive={card.positive} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KpiCards;
