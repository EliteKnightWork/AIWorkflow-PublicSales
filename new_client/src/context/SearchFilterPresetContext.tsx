'use client';
import { useUser } from '@auth0/nextjs-auth0';
import { usePathname } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SearchFilterPreset } from '@/api/generated/models';
import { fetchFilterPresets } from '@/app/_actions/fetchFilterPresets';
import { ALLOW_MAINTENANCE_PATHS } from '@/constants';

type SearchFilterPresetContextType = {
  presets: SearchFilterPreset[];
  isLoading: boolean;
  refreshPresets: () => Promise<void>;
};

const SearchFilterPresetContext = createContext<SearchFilterPresetContextType | undefined>(
  undefined
);

export const useSearchFilterPreset = () => {
  const context = useContext(SearchFilterPresetContext);
  if (!context) {
    throw new Error('useCta must be used within a CtaProvider');
  }
  return context;
};

export const SearchFilterPresetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [presets, setPresets] = useState<SearchFilterPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const pathName = usePathname();

  useEffect(() => {
    const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
    if (!isMaintenanceMode || !ALLOW_MAINTENANCE_PATHS.includes(pathName)) {
      if (user && presets.length === 0) {
        refreshPresets();
      }
    }
  }, [user]);

  const refreshPresets = useCallback(async () => {
    const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
    if (!isMaintenanceMode || !ALLOW_MAINTENANCE_PATHS.includes(pathName)) {
      setIsLoading(true);
      const presets = await fetchFilterPresets();
      if (presets && 'error' in presets) {
        console.error(presets.error);
      } else {
        setPresets(presets);
      }
      setIsLoading(false);
    }
  }, [pathName]);

  const value = React.useMemo(
    () => ({
      presets,
      isLoading,
      refreshPresets,
    }),
    [presets, refreshPresets, isLoading]
  );

  return (
    <SearchFilterPresetContext.Provider value={value}>
      {children}
    </SearchFilterPresetContext.Provider>
  );
};
