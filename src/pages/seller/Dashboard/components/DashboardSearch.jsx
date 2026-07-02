import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, XCircle, ShoppingCart, Package } from 'lucide-react';

const DashboardSearch = ({
  searchQuery,
  handleSearch,
  searchResults,
  showSearchResults,
  setShowSearchResults,
  colors,
  isDark
}) => {
  const navigate = useNavigate();

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '560px', zIndex: 40 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={16} style={{ position: 'absolute', left: '16px', color: colors.textSec }} />
        <input
          type="text"
          placeholder="Search products, orders, customers, SKU, invoices..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 44px',
            borderRadius: '16px',
            border: `1.5px solid ${colors.border}`,
            backgroundColor: colors.cardBg,
            color: colors.textMain,
            fontSize: '13.5px',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
          }}
          onFocus={() => setShowSearchResults(searchResults.length > 0)}
        />
        {searchQuery && (
          <button
            onClick={() => {
              handleSearch('');
            }}
            style={{
              position: 'absolute',
              right: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.textSec,
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
          >
            <XCircle size={16} />
          </button>
        )}
      </div>

      {showSearchResults && searchResults.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '52px',
            left: 0,
            right: 0,
            backgroundColor: colors.cardBg,
            border: `1.5px solid ${colors.border}`,
            borderRadius: '16px',
            boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.6)' : '0 12px 30px rgba(0,0,0,0.08)',
            maxHeight: '340px',
            overflowY: 'auto',
            padding: '8px',
            zIndex: 50
          }}
        >
          {searchResults.map(res => (
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
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background-color 0.15s',
                borderBottom: `1px solid ${colors.border}`
              }}
              className="hover:bg-gray-100/50 dark:hover:bg-white/5"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {res.type === 'order' ? (
                  <ShoppingCart size={16} style={{ color: colors.primaryGreen }} />
                ) : (
                  <Package size={16} style={{ color: colors.info }} />
                )}
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: colors.textMain }}>{res.title}</p>
                  <p style={{ fontSize: '11px', color: colors.textSec }}>{res.subtitle}</p>
                </div>
              </div>
              <ChevronRightIcon colors={colors} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ChevronRightIcon = ({ colors }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke={colors.textSec}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default DashboardSearch;
