import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, DollarSign, BarChart3, ShoppingBag } from 'lucide-react';

const QuickActionGrid = ({ colors, isDark, pendingOrder }) => {
  const navigate = useNavigate();

  const fulfillTitle = pendingOrder 
    ? `Fulfill order #${pendingOrder.customOrderId || pendingOrder.orderId || pendingOrder.id} →`
    : 'View All Orders →';

  const fulfillRoute = pendingOrder 
    ? `/seller/orders?orderId=${pendingOrder.orderId || pendingOrder.id}`
    : '/seller/orders';

  const actions = [
    {
      title: fulfillTitle,
      icon: ShoppingBag,
      route: fulfillRoute,
      color: '#16A34A'
    },
    {
      title: 'Pay commission →',
      icon: DollarSign,
      route: '/seller/commission',
      color: '#F97316'
    },
    {
      title: 'Add Product +',
      icon: Plus,
      route: '/seller/add-product',
      color: '#16A34A'
    },
    {
      title: 'View Analytics →',
      icon: BarChart3,
      route: '/seller/analytics',
      color: '#10B981'
    }
  ];

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ fontSize: '13px', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textSec, marginBottom: '12px' }}>
        Smart Actions
      </h2>
      <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '12px',
          width: '100%'
        }}
      >
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              onClick={() => navigate(act.route)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '10px',
                border: `1.5px dashed ${colors.border}`,
                backgroundColor: colors.cardBg,
                color: colors.textMain,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,.02)',
                minHeight: '44px', // Touch target height
                flex: '1 1 200px' // wrap and grow
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9';
                e.currentTarget.style.borderColor = colors.primaryGreen;
                e.currentTarget.style.borderStyle = 'solid';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = colors.cardBg;
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.borderStyle = 'dashed';
              }}
            >
              <Icon size={15} style={{ color: act.color, flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap' }}>{act.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActionGrid;
