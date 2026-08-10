'use client';
import React, { createContext, useCallback, useContext, useState } from 'react';
import AppToast from '@/components/appToast/AppToast';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  createdAt: number;
  position?: 'top-right' | 'bottom-center';
};

type ToastContextType = {
  toasts: Toast[];
  enqueueToast: (
    message: string,
    type?: 'success' | 'error' | 'info',
    position?: 'top-right' | 'bottom-center'
  ) => void;
  dequeueToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const enqueueToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' = 'info',
      position: 'top-right' | 'bottom-center' = 'top-right'
    ) => {
      const newToast: Toast = {
        id: crypto.randomUUID(),
        message,
        type,
        createdAt: Date.now(),
        position,
      };
      setToasts((prevToasts) => {
        const updatedToasts = [newToast, ...prevToasts];
        return updatedToasts.slice(0, 3);
      });
    },
    []
  );

  const dequeueToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const value = React.useMemo(
    () => ({
      toasts,
      enqueueToast,
      dequeueToast,
    }),
    [toasts, enqueueToast, dequeueToast]
  );

  return (
    <ToastContext.Provider value={value}>
      <AppToast />
      {children}
    </ToastContext.Provider>
  );
};
