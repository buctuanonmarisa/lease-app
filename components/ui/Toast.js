'use client';

import { useState, useEffect, useCallback } from 'react';

// Hook for showing toasts from anywhere
export function useToast() {
  const showToast = useCallback((msg, type = 'default') => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('show-toast', { detail: { msg, type } })
      );
    }
  }, []);

  return { showToast };
}

// Container that renders active toasts
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function handler(e) {
      const { msg, type } = e.detail;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, msg, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    }

    window.addEventListener('show-toast', handler);
    return () => window.removeEventListener('show-toast', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast${t.type ? ` ${t.type}` : ''}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
