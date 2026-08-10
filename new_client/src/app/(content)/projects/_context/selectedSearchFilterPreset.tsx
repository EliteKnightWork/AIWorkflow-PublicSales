'use client';
import React, { createContext, useContext, useState } from 'react';

type SelectedSearchFilterPresetContextType = {
  selectedSearchFilterPresetId: number | undefined;
  setSelectedSearchFilterPresetId: (id: number | undefined) => void;
  businessDescription: string | null;
  updateBusinessDescription: (businessDescription: string | null) => void;
};

const SelectedSearchFilterPresetContext = createContext<
  SelectedSearchFilterPresetContextType | undefined
>(undefined);

export const useSelectedSearchFilterPreset = () => {
  const context = useContext(SelectedSearchFilterPresetContext);
  if (!context) {
    throw new Error(
      'useSelectedSearchFilterPreset must be used within a SelectedSearchFilterPresetProvider'
    );
  }
  return context;
};

export const SelectedSearchFilterPresetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedSearchFilterPresetId, setSelectedSearchFilterPresetId] = useState<
    number | undefined
  >(undefined);
  const [businessDescription, setBusinessDescription] = useState<string | null>(null);

  const updateBusinessDescription = (description: string | null) => {
    setBusinessDescription(description);
  };

  const value = React.useMemo(
    () => ({
      selectedSearchFilterPresetId,
      setSelectedSearchFilterPresetId,
      businessDescription,
      updateBusinessDescription,
    }),
    [selectedSearchFilterPresetId, businessDescription]
  );

  return (
    <SelectedSearchFilterPresetContext.Provider value={value}>
      {children}
    </SelectedSearchFilterPresetContext.Provider>
  );
};
