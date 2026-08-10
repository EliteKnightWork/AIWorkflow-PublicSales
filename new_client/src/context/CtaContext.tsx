'use client';
import React, { createContext, useCallback, useContext, useState } from 'react';
import CtaDialog from '@/app/_components/ctaDialog/CtaDialog';

type CtaContextType = {
  cta: boolean;
  openCta: () => void;
  closeCta: () => void;
};

const CtaContext = createContext<CtaContextType | undefined>(undefined);

export const useCta = () => {
  const context = useContext(CtaContext);
  if (!context) {
    throw new Error('useCta must be used within a CtaProvider');
  }
  return context;
};

export const CtaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cta, setCta] = useState(false);

  const openCta = useCallback(() => {
    setCta(true);
  }, []);

  const closeCta = useCallback(() => {
    setCta(false);
  }, []);

  const value = React.useMemo(
    () => ({
      cta,
      openCta,
      closeCta,
    }),
    [cta, openCta, closeCta]
  );

  return (
    <CtaContext.Provider value={value}>
      <CtaDialog />
      {children}
    </CtaContext.Provider>
  );
};
