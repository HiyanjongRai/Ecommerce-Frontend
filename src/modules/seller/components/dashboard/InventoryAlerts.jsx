import React from 'react';
import { AlertTriangle, AlertCircle, Image, Layers, CheckCircle2 } from 'lucide-react';

const InventoryAlerts = ({
  lowStockCount,
  outOfStockCount,
  missingImagesCount,
  missingCategoryCount,
  colors,
  isDark
}) => {
  const alerts = [
    {
      id: 'out_of_stock',
      label: 'Out Of Stock',
      count: outOfStockCount,
      desc: `${outOfStockCount} product${outOfStockCount > 1 ? 's' : ''}`,
      color: '#EF4444', // Red
      bgColor: 'rgba(239, 68, 68, 0.08)',
      icon: AlertCircle
    },
    {
      id: 'low_stock',
      label: 'Low Stock',
      count: lowStockCount,
      desc: `${lowStockCount} product${lowStockCount > 1 ? 's' : ''}`,
      color: '#FB923C', // Orange
      bgColor: 'rgba(251, 146, 60, 0.08)',
      icon: AlertTriangle
    },
    {
      id: 'missing_images',
      label: 'Missing Images',
      count: missingImagesCount,
      desc: `${missingImagesCount} product${missingImagesCount > 1 ? 's' : ''}`,
      color: '#EF4444', // Red
      bgColor: 'rgba(239, 68, 68, 0.08)',
      icon: Image
    },
    {
      id: 'missing_category',
      label: 'Missing Category',
      count: missingCategoryCount,
      desc: `${missingCategoryCount} product${missingCategoryCount > 1 ? 's' : ''}`,
      color: '#FB923C', // Orange
      bgColor: 'rgba(251, 146, 60, 0.08)',
      icon: Layers
    }
  ];

  const activeAlerts = alerts.filter(a => a.count > 0);

  return (
    <div className="sc-card" style={{ flex: '3', minWidth: '220px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '800', color: colors.textMain, margin: '0 0 16px 0' }}>
        Inventory Alerts
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activeAlerts.length === 0 ? (
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 12px',
              textAlign: 'center',
              borderRadius: '12px',
              backgroundColor: isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.03)',
              border: `1px dashed ${colors.primaryGreen}`,
              gap: '8px'
            }}
          >
            <CheckCircle2 size={24} style={{ color: colors.primaryGreen }} />
            <p style={{ fontSize: '13px', fontWeight: '850', color: colors.textMain, margin: 0 }}>
              Everything looks healthy ✓
            </p>
            <p style={{ fontSize: '10.5px', color: colors.textSec, margin: 0 }}>
              All catalogs and stocks are clear.
            </p>
          </div>
        ) : (
          activeAlerts.map(alert => {
            const Icon = alert.icon;
            return (
              <div 
                key={alert.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  border: `1.5px solid ${colors.border}`,
                  transition: 'all 0.15s ease'
                }}
              >
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    backgroundColor: alert.bgColor,
                    color: alert.color,
                    flexShrink: 0
                  }}
                >
                  <Icon size={15} />
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: colors.textSec, margin: 0 }}>
                    {alert.label}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: colors.textMain, margin: '2px 0 0 0' }}>
                    {alert.desc}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InventoryAlerts;
