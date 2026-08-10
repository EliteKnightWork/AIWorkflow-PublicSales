'use client';
import React, { createContext, useContext, useState } from 'react';

type ProjectListContextType = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
};

const ProjectListContext = createContext<ProjectListContextType | undefined>(undefined);

export const useProjectList = () => {
  const context = useContext(ProjectListContext);
  if (!context) {
    throw new Error('useProjectList must be used within a ProjectListProvider');
  }
  return context;
};

export const ProjectListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const value = React.useMemo(
    () => ({
      loading,
      setLoading,
    }),
    [loading]
  );

  return <ProjectListContext.Provider value={value}>{children}</ProjectListContext.Provider>;
};
