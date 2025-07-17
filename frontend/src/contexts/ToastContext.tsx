import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastId = 0;

  const showToast = (message: string, type: ToastType = 'info') => {
    toastId++;
    const id = Date.now() + toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 2000 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              marginBottom: 12,
              padding: '16px 24px',
              borderRadius: 8,
              background: toast.type === 'success' ? '#27ae60' : toast.type === 'error' ? '#e74c3c' : toast.type === 'warning' ? '#f39c12' : '#2d72d9',
              color: '#fff',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              minWidth: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                marginLeft: 16,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 18,
                cursor: 'pointer',
              }}
              aria-label="關閉通知"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}; 