'use client';
import React, { createContext, useContext, useState } from 'react';

type BidCompanyListContextType = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
};

const BidCompanyListContext = createContext<BidCompanyListContextType | undefined>(undefined);

export const useBidCompanyList = () => {
  const context = useContext(BidCompanyListContext);
  if (!context) {
    throw new Error('useBidCompanyList must be used within a BidCompanyListProvider');
  }
  return context;
};

export const BidCompanyListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const value = React.useMemo(
    () => ({
      loading,
      setLoading,
    }),
    [loading]
  );

  return <BidCompanyListContext.Provider value={value}>{children}</BidCompanyListContext.Provider>;
};
