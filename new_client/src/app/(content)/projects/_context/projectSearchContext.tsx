'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from 'react';
import type { SearchProjectsParams } from '@/api/generated/models';
import { convertQueryToSearchParams, convertSearchParamsToQuery } from '../utils';

type ProjectSearchContextType = {
  projectSearchParams: SearchProjectsParams;
  updateProjectSearchParams: (params: SearchProjectsParams) => void;
  isPending: boolean;
};

const ProjectSearchContext = createContext<ProjectSearchContextType | undefined>(undefined);

export const useProjectSearch = () => {
  const context = useContext(ProjectSearchContext);
  if (!context) {
    throw new Error('useProjectSearch must be used within a ProjectSearchProvider');
  }
  return context;
};

export const ProjectSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectSearchParams, setProjectsSearchParams] = useState<SearchProjectsParams>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const params: SearchProjectsParams = convertQueryToSearchParams(searchParams);
    setProjectsSearchParams(params);
  }, [searchParams]);

  const updateProjectSearchParams = useCallback(
    (params: SearchProjectsParams) => {
      const queryParams = convertSearchParamsToQuery(params);
      startTransition(() => {
        router.push(queryParams ? `?${queryParams.toString()}` : '');
      });
    },
    [projectSearchParams]
  );

  const value = React.useMemo(
    () => ({
      projectSearchParams,
      updateProjectSearchParams,
      isPending,
    }),
    [projectSearchParams, isPending]
  );

  return <ProjectSearchContext.Provider value={value}>{children}</ProjectSearchContext.Provider>;
};
