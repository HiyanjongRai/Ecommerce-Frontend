import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShoppingBag, Bell, Search, XCircle, ChevronRight, ShoppingCart, ChevronDown } from 'lucide-react';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const DashboardHeader = ({
  storeLabel,
  todayDateString,
  profile,
  colors,
  isDark,
  searchQuery,
  handleSearch,
  searchResults,
  showSearchResults,
  setShowSearchResults
}) => {
  const navigate = useNavigate();
  const [scope, setScope] = useState('All');

  // Hardcode/default greeting to Ram Pasal as required by mock details
  const displayLabel = storeLabel && storeLabel !== 'Seller' ? storeLabel : 'Ram Pasal';

  // Greeting priority subtext
  const greetingSubtext = "You have 1 order delivered today · Commission due in 5 days";

  // Dynamic placeholder text based on search scope
  const getPlaceholder = () => {
    switch (scope) {
      case 'Orders':
        return 'Search orders…';
      case 'Products':
        return 'Search products…';
      case 'SKU':
        return 'Search SKU…';
      default:
        return 'Search all…';
    }
  };

  // Filter search results by scope
  const filteredResults = searchResults.filter(res => {
    if (scope === 'All') return true;
    if (scope === 'Orders') return res.type === 'order';
    if (scope === 'Products') return res.type === 'product';
    if (scope === 'SKU') return res.type === 'product' && String(res.subtitle).toLowerCase().includes('sku');
    return true;
  });

  const avatarSrc = profile?.logoImagePath
    ? (profile.logoImagePath.startsWith('http') ? profile.logoImagePath : `${BASE_URL}/${profile.logoImagePath.replace(/^\//, '')}`)
    : null;

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '20px',
        paddingTop: '8px',
        width: '100%',
        boxSizing: 'border-box',
        gap: '20px',
        flexWrap: 'wrap'
      }}
    >
      {/* 1. Left: Greeting & Today's Priority */}
      <div style={{ flex: '1 1 300px', minWidth: '240px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: colors.textMain, letterSpacing: '-0.5px', margin: 0, fontFamily: "'Inter', sans-serif" }}>
          Good afternoon, {displayLabel}
        </h1>
        <p style={{ fontSize: '13px', color: colors.textSec, marginTop: '4px', margin: '4px 0 0 0', fontWeight: '600' }}>
          {greetingSubtext}
        </p>
      </div>

      {/* 2. Center: Search Bar with Dropdown Scope */}
      <div style={{ position: 'relative', flex: '2 1 380px', maxWidth: '500px', zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }}>
          
          {/* Custom Styled Scope Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              style={{
                padding: '8px 28px 8px 12px',
                borderRadius: '10px 0 0 10px',
                border: `1px solid ${colors.border}`,
                borderRight: 'none',
                backgroundColor: isDark ? '#1a1a1a' : '#F1F5F9',
                color: colors.textMain,
                fontSize: '12px',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                height: '38px',
                minWidth: '76px'
              }}
            >
              <option value="All">All</option>
              <option value="Orders">Orders</option>
              <option value="Products">Products</option>
              <option value="SKU">SKU</option>
            </select>
            <ChevronDown 
              size={12} 
              style={{ 
                position: 'absolute', 
                right: '10px', 
                pointerEvents: 'none', 
                color: colors.textSec 
              }} 
            />
          </div>

          {/* Search Input Box */}
          <div style={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', color: colors.textSec }} />
            <input
              type="text"
              placeholder={getPlaceholder()}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 34px 8px 34px',
                borderRadius: '0 10px 10px 0',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.cardBg,
                color: colors.textMain,
                fontSize: '13px',
                outline: 'none',
                height: '38px',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease'
              }}
              onFocus={() => setShowSearchResults(filteredResults.length > 0)}
            />
            {searchQuery && (
              <button 
                onClick={() => handleSearch('')}
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: colors.textSec,
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <XCircle size={15} />
              </button>
            )}
          </div>
        </div>
        
        {/* Scoped Search Results Overlay */}
        {showSearchResults && filteredResults.length > 0 && (
          <div 
            style={{
              position: 'absolute',
              top: '42px',
              left: 0,
              right: 0,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.6)' : '0 12px 30px rgba(0,0,0,0.06)',
              maxHeight: '280px',
              overflowY: 'auto',
              padding: '6px',
              zIndex: 50
            }}
          >
            {filteredResults.map(res => (
              <div 
                key={`${res.type}-${res.id}`}
                onClick={() => {
                  setShowSearchResults(false);
                  if (res.type === 'order') {
                    navigate(`/seller/orders?orderId=${res.id}`);
                  } else {
                    navigate(`/seller/inventory`);
                  }
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.15s',
                  borderBottom: `1px solid ${colors.border}`
                }}
                className="hover:bg-gray-100/50 dark:hover:bg-white/5"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={14} style={{ color: colors.primaryGreen }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: '750', color: colors.textMain, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.title}</p>
                    <p style={{ fontSize: '10.5px', color: colors.textSec, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.subtitle}</p>
                  </div>
                </div>
                <ChevronRight size={12} style={{ color: colors.textSec }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Right: Quick Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <button 
          onClick={() => navigate('/seller/add-product')} 
          style={{
            backgroundColor: '#16A34A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            height: '38px',
            transition: 'background-color 0.15s ease'
          }}
          className="hover:bg-green-700"
        >
          <Plus size={14} /> Add Product
        </button>

        <button 
          onClick={() => navigate('/seller/orders')} 
          style={{
            backgroundColor: 'transparent',
            color: colors.textMain,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            height: '38px',
            transition: 'all 0.15s ease'
          }}
          className="hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <ShoppingBag size={14} /> Orders
        </button>

        <button
          onClick={() => navigate('/seller/notifications')}
          style={{
            backgroundColor: 'transparent',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            color: colors.textSec
          }}
          className="hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <Bell size={16} />
          <span style={{ position: 'absolute', top: '9px', right: '9px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
        </button>

        <div 
          onClick={() => navigate('/seller/profile')}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            overflow: 'hidden',
            cursor: 'pointer',
            border: `2px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#16A34A'
          }}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt={displayLabel} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#FFFFFF', fontWeight: '800', fontSize: '13px' }}>
              {displayLabel.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
