import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { NotificationButton } from '../../../shared/components/ui/notification-button';

export default function PageHeader({ title, subtitle, breadcrumbs = [] }) {
  const { unreadNotifs } = useCustomer();
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center pb-2.5 mb-6 border-b border-gray-100/80">
      <div className="space-y-0.5">
        <nav className="flex items-center gap-2 text-[10px] font-semibold text-[#6B7280]">
          <Link to="/" className="hover:text-green-600 transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <span className="hover:text-green-600 cursor-pointer transition-colors">Shop</span>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              <span className="text-gray-300">/</span>
              {b.to ? (
                <Link to={b.to} className="hover:text-green-600 transition-colors">{b.label}</Link>
              ) : (
                <span className={`${idx === breadcrumbs.length - 1 ? 'text-[#10B981] font-bold' : 'hover:text-green-600 cursor-pointer'}`}>{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="text-[11px] text-gray-400 font-medium">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <NotificationButton
          count={unreadNotifs}
          onClick={() => navigate('/customer/notifications')}
        />
      </div>
    </div>
  );
}
