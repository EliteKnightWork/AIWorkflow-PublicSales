'use client';
import React, { createContext, useContext, useState } from 'react';

type OrganizationListContextType = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
};

const OrganizationListContext = createContext<OrganizationListContextType | undefined>(undefined);

export const useOrganizationList = () => {
  const context = useContext(OrganizationListContext);
  if (!context) {
    throw new Error('useOrganizationList must be used within a OrganizationListProvider');
  }
  return context;
};

export const OrganizationListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const value = React.useMemo(
    () => ({
      loading,
      setLoading,
    }),
    [loading]
  );

  return (
    <OrganizationListContext.Provider value={value}>{children}</OrganizationListContext.Provider>
  );
};
