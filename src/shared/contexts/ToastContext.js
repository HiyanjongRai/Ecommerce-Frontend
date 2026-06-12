import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext({ showToast: () => {} });
let toastHandler = null;

export const toast = (message, type = 'success') => {
  if (typeof toastHandler === 'function') {
    toastHandler(message, type);
  } else {
    console.warn('Toast not yet initialized:', message);
  }
};

export const ToastProvider = ({ children }) => {
  const [toastState, setToastState] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    if (!message) return;

    // Normalize type if boolean
    let normalizedType = type;
    if (type === true) normalizedType = 'success';
    if (type === false) normalizedType = 'error';

    // Auto-detect type and strip emojis from the beginning of the message
    let cleanMessage = message;
    if (typeof message === 'string') {
      if (message.startsWith('✅')) {
        normalizedType = 'success';
        cleanMessage = message.replace(/^✅\s*/, '');
      } else if (message.startsWith('❌')) {
        normalizedType = 'error';
        cleanMessage = message.replace(/^❌\s*/, '');
      } else if (message.startsWith('⚠️')) {
        normalizedType = 'warning';
        cleanMessage = message.replace(/^⚠️\s*/, '');
      } else if (message.startsWith('ℹ️') || message.startsWith('📋')) {
        normalizedType = 'info';
        cleanMessage = message.replace(/^[ℹ️📋]\s*/, '');
      }
    }

    // Map of titles based on type
    const titleMap = {
      success: 'Success!',
      error: 'Error occurred',
      warning: 'Warning',
      info: 'Notification',
    };

    const title = titleMap[normalizedType] || 'Notification';

    setToastState({ message: cleanMessage, type: normalizedType, title });

    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => {
      setToastState(null);
    }, 4500);
  }, []);

  useEffect(() => {
    toastHandler = showToast;
    const originalAlert = window.alert;
    window.alert = (message) => {
      showToast(message, 'info');
    };

    return () => {
      toastHandler = null;
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastState && (
        <div
          className="fixed top-4 right-4 z-[9999] flex items-start rounded-xl shadow-xl max-w-sm w-full mx-4 border border-black/5 overflow-hidden transition-all duration-300 transform translate-y-0 opacity-100"
          style={{
            backgroundColor: 
              toastState.type === 'error' ? '#FEF2F2' :
              toastState.type === 'success' ? '#F0FDF4' :
              toastState.type === 'warning' ? '#FFFBEB' : '#EFF6FF',
            borderLeft: `5px solid ${
              toastState.type === 'error' ? '#EF4444' :
              toastState.type === 'success' ? '#10B981' :
              toastState.type === 'warning' ? '#F59E0B' : '#3B82F6'
            }`,
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          <div className="flex-1 p-4 flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {toastState.type === 'error' && <AlertCircle className="w-5 h-5 text-[#EF4444]" />}
              {toastState.type === 'success' && <CheckCircle className="w-5 h-5 text-[#10B981]" />}
              {toastState.type === 'warning' && <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />}
              {toastState.type === 'info' && <Info className="w-5 h-5 text-[#3B82F6]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-bold leading-tight"
                style={{
                  color: 
                    toastState.type === 'error' ? '#991B1B' :
                    toastState.type === 'success' ? '#166534' :
                    toastState.type === 'warning' ? '#854D0E' : '#1E40AF'
                }}
              >
                {toastState.title}
              </p>
              <p
                className="text-xs mt-1 leading-relaxed break-words"
                style={{
                  color: 
                    toastState.type === 'error' ? '#B91C1C' :
                    toastState.type === 'success' ? '#15803D' :
                    toastState.type === 'warning' ? '#B45309' : '#1D4ED8'
                }}
              >
                {toastState.message}
              </p>
            </div>
            <button
              onClick={() => setToastState(null)}
              className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
              style={{
                color: 
                  toastState.type === 'error' ? '#991B1B' :
                  toastState.type === 'success' ? '#166534' :
                  toastState.type === 'warning' ? '#854D0E' : '#1E40AF',
                opacity: 0.6
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <style>{`
            @keyframes slideInRight {
              from { opacity: 0; transform: translate(32px, 0); }
              to   { opacity: 1; transform: translate(0, 0); }
            }
          `}</style>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
