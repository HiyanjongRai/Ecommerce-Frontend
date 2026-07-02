import React, { useMemo } from 'react';
import { MessageSquare, RefreshCw, ShoppingBag, Package, Megaphone, Bell } from 'lucide-react';

const ActivityFeed = ({
  recentOrdersList,
  lowStockCount,
  unreadMessagesCount,
  colors,
  isDark
}) => {
  const activities = useMemo(() => {
    const list = [];

    // Extract from recent orders
    recentOrdersList.forEach(order => {
      const s = String(order.status).toUpperCase();
      if (s === 'DELIVERED' || s === 'COMPLETED') {
        list.push({
          type: 'delivery',
          title: `Order delivered`,
          desc: `Order #${order.displayId} fulfilled successfully`,
          time: order.date || 'Today',
          icon: ShoppingBag,
          color: colors.primaryGreen
        });
      } else if (s === 'CANCELLED' || s === 'REFUNDED') {
        list.push({
          type: 'refund',
          title: `Refund approved`,
          desc: `Order #${order.displayId} refund processed`,
          time: order.date || 'Yesterday',
          icon: RefreshCw,
          color: colors.error
        });
      } else {
        list.push({
          type: 'order',
          title: `New order received`,
          desc: `Order #${order.displayId} from ${order.customer}`,
          time: order.date || 'Just now',
          icon: ShoppingBag,
          color: colors.info
        });
      }
    });

    // Add unread messages activity
    if (unreadMessagesCount > 0) {
      list.push({
        type: 'message',
        title: `Customer sent message`,
        desc: `${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? 's' : ''} in queue`,
        time: 'Active',
        icon: MessageSquare,
        color: '#EC4899'
      });
    }

    // Add low stock activity
    if (lowStockCount > 0) {
      list.push({
        type: 'stock',
        title: `Product low stock`,
        desc: `${lowStockCount} inventory listing${lowStockCount > 1 ? 's' : ''} need restocking`,
        time: 'Urgent',
        icon: Package,
        color: colors.warning
      });
    }

    // Add general fallback activities to ensure we have up to 5 items
    const fallbacks = [
      {
        type: 'campaign',
        title: 'Campaign expired',
        desc: 'Weekend Flash Sale promotional campaign completed',
        time: '2 days ago',
        icon: Megaphone,
        color: '#A855F7'
      },
      {
        type: 'system',
        title: 'Payout completed',
        desc: 'Weekly revenue settlement processed successfully',
        time: '5 days ago',
        icon: Bell,
        color: colors.primaryGreen
      }
    ];

    while (list.length < 5 && fallbacks.length > 0) {
      list.push(fallbacks.shift());
    }

    // Return maximum of 5 items
    return list.slice(0, 5);
  }, [recentOrdersList, lowStockCount, unreadMessagesCount, colors]);

  return (
    <div className="sc-card">
      <h3 style={{ fontSize: '15px', fontWeight: '800', color: colors.textMain, margin: '0 0 16px 0' }}>
        Recent Activity Feed
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
        {/* Timeline connector line */}
        <div 
          style={{
            position: 'absolute',
            left: '17px',
            top: '8px',
            bottom: '8px',
            width: '2px',
            backgroundColor: colors.border,
            zIndex: 0
          }}
        />

        {activities.map((act, idx) => {
          const Icon = act.icon;
          return (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                position: 'relative',
                zIndex: 1
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
                  border: `2px solid ${colors.border}`,
                  color: act.color,
                  flexShrink: 0
                }}
              >
                <Icon size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0, marginTop: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: colors.textMain, margin: 0 }}>
                    {act.title}
                  </h4>
                  <span style={{ fontSize: '10.5px', color: colors.textSec, whiteSpace: 'nowrap' }}>
                    {act.time}
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: colors.textSec, margin: '2px 0 0 0', lineHeight: '1.4' }}>
                  {act.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
