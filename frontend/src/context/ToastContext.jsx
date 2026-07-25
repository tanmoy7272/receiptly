import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { ToastContainer } from '../components/ui/ToastContainer';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const recentToastsRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'info', duration = 3500) => {
      const now = Date.now();
      const key = `${type}:${message}`;

      // Duplicate prevention within 2000ms
      if (recentToastsRef.current.has(key)) {
        const lastTime = recentToastsRef.current.get(key);
        if (now - lastTime < 2000) {
          return;
        }
      }
      recentToastsRef.current.set(key, now);

      const id = `toast_${now}_${Math.random().toString(36).substring(7)}`;

      setToasts((prev) => {
        // Enforce maximum 3 visible toasts
        const newQueue = [...prev, { id, message, type, duration }];
        if (newQueue.length > 3) {
          return newQueue.slice(newQueue.length - 3);
        }
        return newQueue;
      });

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Safe fallback object prevents React ErrorBoundary crashes
    return {
      success: (msg) => console.log('[Toast Success]:', msg),
      error: (msg) => console.log('[Toast Error]:', msg),
      warning: (msg) => console.log('[Toast Warning]:', msg),
      info: (msg) => console.log('[Toast Info]:', msg),
    };
  }
  return context;
};
