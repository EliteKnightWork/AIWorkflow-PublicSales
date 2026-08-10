'use client';
import { Box, Flex, Text } from '@radix-ui/themes';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type Aggregation,
  type Pagination,
  type Project,
  ProjectStatusTab,
  type SortBy,
} from '@/api/generated/models';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import AppPagination from '@/components/pagination/AppPagination';
import {
  CONTENT_PAGE_MAIN_CONTAINER,
  PROJECT_SEARCH_INPUT,
  SAVE_CONDITION_BUTTON,
  SMARTPHONE_WIDTH,
} from '@/constants';
import { useSearchFilterPreset } from '@/context/SearchFilterPresetContext';
import { useParticipateQualifications } from '@/hooks/useParticipateQualifications';
import AwardedProjectCard from '../../_components/awardedProjectCard/AwardedProjectCard';
import ProjectCard from '../../_components/projectCard/ProjectCard';
import ProjectSideBar from '../../_components/projectSideBar/ProjectSideBar';
import { ProjectSortSelect } from '../../_components/projectSortSelect/ProjectSortSelect';
import ProjectTabs from '../../_components/projectTabs/ProjectTabs';
import SearchConditionActionBar from '../../_components/SearchConditionActionBar/SearchConditionActionBar';
import { useProjectList } from '../../_context/projectListContext';
import { useProjectSearch } from '../../_context/projectSearchContext';
import { convertToSearchInputChip } from '../project-search/model';
import styles from './styles.module.css';

type ProjectListProps = {
  projects: Project[];
  pagination: Pagination;
  aggregate: Aggregation;
  onSelectProject: (project: Project) => void;
  initPage: number;
  onSelectPage: (page: number) => void;
  sortBy?: SortBy;
  onChangeSort: (sort: SortBy) => void;
  selectedProject: Project | null;
  onCloseSideBar: () => void;
  recommendListElement: React.ReactNode;
  isSp?: boolean;
  isLogin: boolean;
};

export function ProjectList({
  projects,
  pagination,
  aggregate,
  initPage,
  onSelectPage,
  sortBy,
  onChangeSort,
  recommendListElement,
  isSp,
  isLogin,
}: ProjectListProps) {
  const { projectSearchParams, updateProjectSearchParams, isPending } = useProjectSearch();
  const [targetTab, setTargetTab] = useState(projectSearchParams.tab || ProjectStatusTab.all);
  const { loading, setLoading } = useProjectList();
  const [targetProjects, setTargetProjects] = useState<Project[]>([]);
  const { presets, refreshPresets } = useSearchFilterPreset();
  const handleProjectUpdate = (updated: Project) => {
    setTargetProjects((prev) =>
      prev.map((p) =>
        p.uuid === updated.uuid
          ? { ...p, bidPipeline: updated.bidPipeline, reaction: updated.reaction }
          : p
      )
    );
    setSelectedProject(updated);
  };
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const onSelectProject = (project: Project) => {
    if (isSp) {
      return;
    }
    setSelectedProject(project);
  };

  const onCloseSideBar = () => {
    setSelectedProject(null);
  };

  // 参加資格データを取得
  const { data: qualifications } = useParticipateQualifications({
    ids: projectSearchParams.participateQualificationIds,
    gradeIds: projectSearchParams.participateQualificationGradeIds,
  });

  // 検索パラメータが存在するか判定
  const hasSearchParams =
    convertToSearchInputChip(projectSearchParams, qualifications || []).length > 0;

  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((id) => clearTimeout(id));
      timeoutIdsRef.current = [];
    };
  }, [loading]);

  // Sticky buttons handlers
  const handleEditConditions = () => {
    // 既存のタイマーをすべてクリア
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];

    // スクロール対象を探索
    const contentMainContainer = document.getElementById(CONTENT_PAGE_MAIN_CONTAINER);
    if (!contentMainContainer) {
      return;
    }
    contentMainContainer.scrollTo({ top: 0, behavior: 'smooth' });

    // スクロール完了を待ってからinputへfocus
    const scrollTimeout = setTimeout(() => {
      const searchInput = document.getElementById(PROJECT_SEARCH_INPUT) as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        const detailTimeout = setTimeout(() => {
          const detailButton = document.querySelector(
            '[class*="addDetailButton"]'
          ) as HTMLButtonElement;
          if (detailButton) {
            detailButton.click();
          }
        }, 100);
        timeoutIdsRef.current.push(detailTimeout);
      }
    }, 600); // スクロールアニメーションの時間に合わせて調整
    timeoutIdsRef.current.push(scrollTimeout);
  };

  const handleSaveConditions = () => {
    const contentMainContainer = document.getElementById(CONTENT_PAGE_MAIN_CONTAINER);
    if (contentMainContainer) {
      contentMainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const scrollTimeout = setTimeout(() => {
      // Find and click the actual "条件を保存する" button in the search area
      const saveConditionButton = document.getElementById(
        SAVE_CONDITION_BUTTON
      ) as HTMLButtonElement;
      if (saveConditionButton) {
        saveConditionButton.click();
      }
    }, 600); // スクロールアニメーションの時間に合わせて調整
    timeoutIdsRef.current.push(scrollTimeout);
  };

  useEffect(() => {
    if (!isPending) {
      setTargetProjects(projects);
      setLoading(false);
    }
  }, [projects, isPending]);

  useEffect(() => {
    if (loading) {
      setTargetProjects([]);
    }
  }, [loading]);

  const projectListElement = useMemo(
    () => (
      <>
        <Box className={styles.pagenatesPerBox}>
          <ProjectSortSelect
            value={sortBy}
            tab={targetTab}
            onChange={(sortBy) => {
              setLoading(true);
              onChangeSort(sortBy);
            }}
          />
        </Box>
        <Flex direction='column' gap='4' data-project-cards-container>
          {targetProjects.map((project) =>
            project.type === 'project' ? (
              isSp ? (
                <a
                  key={project.uuid}
                  href={`/projects/${project.uuid}`}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <ProjectCard project={project} onClickCard={onSelectProject} isSp={isSp} />
                </a>
              ) : (
                <ProjectCard
                  key={project.uuid}
                  project={project}
                  onClickCard={onSelectProject}
                  isSp={isSp}
                />
              )
            ) : isSp ? (
              <a
                key={project.uuid}
                href={`/awardedProjects/${project.uuid}`}
                target='_blank'
                rel='noopener noreferrer'
              >
                <AwardedProjectCard project={project} onClickCard={onSelectProject} isSp={isSp} />
              </a>
            ) : (
              <AwardedProjectCard
                key={project.uuid}
                project={project}
                onClickCard={onSelectProject}
                isSp={isSp}
              />
            )
          )}
          {targetProjects.length === 0 && (
            <Box className={styles.noProjectBox}>
              <p>該当する案件が見つかりませんでした。検索条件を変更して再度お試しください。</p>
            </Box>
          )}
        </Flex>
        <Box className={styles.paginationBox}>
          <AppPagination
            currentPage={Math.max(Math.min(initPage, pagination.pages ?? 1), 1)}
            minPage={Math.max(1, initPage - 2)}
            maxPage={Math.min(pagination.pages ?? initPage, initPage + 2)}
            onSelectPage={(page) => {
              setLoading(true);
              onSelectPage(page);
            }}
          />
        </Box>
      </>
    ),
    [targetProjects, pagination, sortBy, onChangeSort, targetTab]
  );

  const isAwardedSort = (sort?: SortBy) =>
    sort === 'tender_opening_date_desc' || sort === 'tender_opening_date_asc';

  return (
    <Box
      className={`${styles.projectListBox} ${typeof window !== 'undefined' && window.innerWidth <= SMARTPHONE_WIDTH && !isLogin && styles.unAuthMobileProjectListBox}`}
    >
      <Flex direction='column' gap='4'>
        <ProjectTabs
          aggregate={aggregate}
          pagination={pagination}
          disableTabs={loading}
          nodes={{
            tab1: (
              <>
                {loading ? (
                  <Flex justify='center' direction='column' align='center'>
                    <Text className={styles.loadingDataText}>今案件を探しています・・・🔍</Text>
                    <LoadingSpinner />
                  </Flex>
                ) : (
                  <Flex direction='column' gap={isSp ? '6' : '4'}>
                    {!isSp && recommendListElement}
                    {projectListElement}
                  </Flex>
                )}
              </>
            ),
            tab2: (
              <>
                {loading ? (
                  <Flex justify='center' direction='column' align='center'>
                    <Text className={styles.loadingDataText}>今案件を探しています・・・🔍</Text>
                    <LoadingSpinner />
                  </Flex>
                ) : (
                  <Flex direction='column' gap='4'>
                    {!isSp && recommendListElement}
                    {projectListElement}
                  </Flex>
                )}
              </>
            ),
            tab3: (
              <>
                {loading ? (
                  <Flex justify='center' direction='column' align='center'>
                    <Text className={styles.loadingDataText}>今案件を探しています・・・🔍</Text>
                    <LoadingSpinner />
                  </Flex>
                ) : (
                  <Flex direction='column' gap='4'>
                    {projectListElement}
                  </Flex>
                )}
              </>
            ),
            tab4: (
              <>
                {loading ? (
                  <Flex justify='center' direction='column' align='center'>
                    <Text className={styles.loadingDataText}>今案件を探しています・・・🔍</Text>
                    <LoadingSpinner />
                  </Flex>
                ) : (
                  <Flex direction='column' gap='4'>
                    {projectListElement}
                  </Flex>
                )}
              </>
            ),
          }}
          tab={targetTab}
          onChangeTab={(newTab) => {
            if (loading || newTab === targetTab) {
              return;
            }

            setLoading(true);
            setTargetProjects([]);
            setTargetTab(newTab);

            const updatedParams = { ...projectSearchParams };
            updatedParams.tab = newTab;
            updatedParams.page = 1;
            if (newTab !== ProjectStatusTab.awarded && isAwardedSort(updatedParams.sortBy)) {
              delete updatedParams.sortBy;
            }

            updateProjectSearchParams(updatedParams);
          }}
          isSp={isSp}
          isLogin={isLogin}
        />
      </Flex>
      {selectedProject !== null && !isSp && (
        <ProjectSideBar
          project={selectedProject}
          onOpen={() => window.open(`/projects/${selectedProject.uuid}`, '_blank')}
          onClose={onCloseSideBar}
          onProjectUpdate={handleProjectUpdate}
        />
      )}
      <SearchConditionActionBar
        hasSearchParams={hasSearchParams}
        onEditConditions={handleEditConditions}
        onSaveConditions={handleSaveConditions}
        scrollThreshold={200}
        presets={presets}
        refreshPresets={refreshPresets}
        actionBarkey={targetTab}
      />
    </Box>
  );
}
