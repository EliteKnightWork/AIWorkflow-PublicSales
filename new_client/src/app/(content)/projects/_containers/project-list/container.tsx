'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type {
  Aggregation,
  Pagination,
  Project,
  ProjectStatusTab as ProjectStatusTabType,
  SortBy,
} from '@/api/generated/models';
import { ProjectStatusTab } from '@/api/generated/models';
import { useProjectSearch } from '../../_context/projectSearchContext';
import { ProjectList } from './presentational';

type ProjectListProps = {
  projects: Project[];
  pagination: Pagination;
  aggregate: Aggregation;
  recommendListElement: React.ReactNode;
  isMobile?: boolean;
  isLogin: boolean;
};

export const ProjectListContainer = ({
  projects,
  pagination,
  aggregate,
  recommendListElement,
  isMobile = false,
  isLogin,
}: ProjectListProps) => {
  const searchParams = useSearchParams();
  const { updateProjectSearchParams, projectSearchParams } = useProjectSearch();
  // URLSearchParams を使用することで page=1 の文字列を取得できる
  const initPage = Number(searchParams.get('page')) || 1;

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const getDefaultSort = (tab?: ProjectStatusTabType): SortBy =>
    tab === ProjectStatusTab.awarded ? 'tender_opening_date_desc' : 'publication_date_desc';

  const [currentSort, setCurrentSort] = useState<SortBy>(
    (projectSearchParams.sortBy as SortBy) || getDefaultSort(projectSearchParams.tab)
  );

  const handleChangeSort = (sort: SortBy) => {
    setCurrentSort(sort);
    const { sortBy: _sort, ...rest } = projectSearchParams;
    const defaultSortForTab = getDefaultSort(projectSearchParams.tab);
    const nextParams = {
      ...rest,
      ...(sort === defaultSortForTab ? {} : { sortBy: sort }),
      page: 1,
    };
    updateProjectSearchParams(nextParams);
  };

  useEffect(() => {
    const defaultSort = getDefaultSort(projectSearchParams.tab);
    const nextSort = (projectSearchParams.sortBy as SortBy) ?? defaultSort;
    setCurrentSort((prev) => (prev === nextSort ? prev : nextSort));
  }, [projectSearchParams.sortBy, projectSearchParams.tab]);

  return (
    <ProjectList
      aggregate={aggregate}
      projects={projects}
      pagination={pagination}
      onSelectProject={
        isMobile
          ? (_project: Project) => {
              return;
            }
          : setSelectedProject
      }
      initPage={initPage}
      onSelectPage={(page) => {
        updateProjectSearchParams({
          ...projectSearchParams,
          page: page,
        });
      }}
      sortBy={currentSort}
      onChangeSort={handleChangeSort}
      selectedProject={selectedProject}
      onCloseSideBar={() => setSelectedProject(null)}
      recommendListElement={recommendListElement}
      isSp={isMobile}
      isLogin={isLogin}
    />
  );
};
