'use client';
import { Box, Button, Flex, IconButton, Spinner, Text } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ProjectReactionType,
  type GetProjectReactionLikes200ReactedProjectsItem,
  type Project,
  type User,
} from '@/api/generated/models';
import { ProjectSummaryCard } from '@/app/(content)/_components/projectSummaryCard/ProjectSummaryCard';
import { RoundButton } from '@/components/roundButton/RoundeButton';
import { RoundSelect } from '@/components/roundSelect/RoundSelect';
import { useBidPipeline } from '@/context/BidPipelineContext';
import { downloadCSV } from '@/lib/csv/downloadCSV';
import { convertProjectToCSV } from '@/lib/csv/project/convertProjectToCSV';
import { CompanyMemberSelect } from '../../_components/companyMemberSelect/CompanyMemberSelect';
import pageStyles from '../../styles.module.css';
import styles from './styles.module.css';
import { getProjectReactionLikes } from '@/api/generated/endpoints/project-reactions';

type LikedProjectsListProps = {
  likedProjectsItems: GetProjectReactionLikes200ReactedProjectsItem[];
  companyMembers: User[];
};

// お気に入り案件の表示
export default function LikedProjectsListPresentational({
  likedProjectsItems,
  companyMembers,
}: LikedProjectsListProps) {
  const router = useRouter();
  const { handleAddBidPipeline, openConfirmDeleteBidPipelineDialog } = useBidPipeline();

  const [isExpand, setIsExpand] = useState(true);
  const [loading, setLoading] = useState(false);

  const [projectItems, setProjectItems] =
    useState<GetProjectReactionLikes200ReactedProjectsItem[]>(likedProjectsItems);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('publication_date_desc');
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const onChangeSort = (value: string) => {
    setSortBy(value);
    setLoading(true);
    getProjectReactionLikes({
      sort_by: value,
      reaction: ProjectReactionType.like,
      user_ids: selectedMembers,
    })
      .then((res) => {
        setProjectItems(res.reactedProjects ?? []);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onClickProjectPipelineButton = (
    e: React.MouseEvent<HTMLButtonElement>,
    item: GetProjectReactionLikes200ReactedProjectsItem
  ) => {
    e.stopPropagation();

    if (item.bidPipeline?.id) {
      // 案件管理から外す
      openConfirmDeleteBidPipelineDialog(
        item.bidPipeline.id.toString(),
        () => {
          setProjectItems(
            projectItems.map((project: GetProjectReactionLikes200ReactedProjectsItem) => {
              if (project.uuid === item.uuid) {
                return {
                  ...project,
                  bidPipeline: undefined,
                } as GetProjectReactionLikes200ReactedProjectsItem;
              }
              return project;
            })
          );
        },
        () => {}
      );
    } else {
      if (item.uuid) {
        handleAddBidPipeline(item.uuid, (pipeline) => {
          return setProjectItems(
            projectItems.map((project) => {
              if (project.uuid === item.uuid) {
                return {
                  ...project,
                  bidPipeline: {
                    id: pipeline.id,
                    status: pipeline.status,
                  },
                } as GetProjectReactionLikes200ReactedProjectsItem;
              }
              return project;
            })
          );
        }).catch(() => {
          setProjectItems(
            projectItems.map((project) => {
              if (project.uuid === item.uuid) {
                return {
                  ...project,
                  bidPipeline: undefined,
                } as GetProjectReactionLikes200ReactedProjectsItem;
              }
              return project;
            })
          );
        });
      }
    }
  };

  const onSelectMembers = (selectedIds: string[]) => {
    setSelectedMembers(selectedIds);
    setLoading(true);
    getProjectReactionLikes({
      sort_by: sortBy,
      reaction: ProjectReactionType.like,
      user_ids: selectedIds,
    })
      .then((res) => {
        setProjectItems(res.reactedProjects ?? []);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateScrollState();
    container.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [projectItems, isExpand]);

  const updateScrollState = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      Math.ceil(container.scrollLeft) < container.scrollWidth - container.clientWidth
    );
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = 500;
    containerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const createCsv = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    const timestamp =
      now.getFullYear() +
      `0${now.getMonth() + 1}`.slice(-2) +
      `0${now.getDate()}`.slice(-2) +
      `0${now.getHours()}`.slice(-2) +
      `0${now.getMinutes()}`.slice(-2) +
      `0${now.getSeconds()}`.slice(-2);
    const csv = convertProjectToCSV(projectItems.map((item) => item as Project));
    downloadCSV(csv, `お気に入り案件_${timestamp}.csv`);
  };

  return (
    <Flex direction={'column'} gap={'4'} className={pageStyles.mypageContentBoard}>
      <Flex
        justify={'between'}
        align={'center'}
        className={pageStyles.mypageContentHeader}
        onClick={() => setIsExpand(!isExpand)}
      >
        <Text className={pageStyles.mypageContentBoxTitle}>お気に入り</Text>
        <Flex gap={'4'} align={'center'}>
          {isExpand && (
            <>
              <CompanyMemberSelect
                members={companyMembers}
                selectedIds={selectedMembers}
                onSelect={onSelectMembers}
              />
              <RoundSelect
                value={sortBy}
                label='表示順'
                options={[
                  { value: 'publication_date_desc', label: '公告日が新しい順' },
                  { value: 'publication_date_asc', label: '公告日が古い順' },
                ]}
                onSelect={(value) => {
                  onChangeSort(value);
                }}
              />
              <Button
                variant='outline'
                onClick={createCsv}
                className={styles.downloadButton}
                disabled={projectItems.length === 0}
              >
                CSV出力
                <span className={'material-icons'} translate='no' aria-hidden='true'>
                  download
                </span>
              </Button>
            </>
          )}
          <span
            className={`material-icons ${pageStyles.mypageExpandIcon}`}
            translate='no'
            aria-hidden='true'
          >
            {isExpand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
        </Flex>
      </Flex>
      {isExpand && (
        <Flex
          direction={'row'}
          gap={'4'}
          overflow={'auto'}
          className={pageStyles.expandableContent}
        >
          {loading ? (
            <Flex justify={'center'} align={'center'} width={'100%'}>
              <Spinner size={'3'} />
            </Flex>
          ) : projectItems.length === 0 ? (
            <Box className={`${pageStyles.messageBox} ${styles.messageBox}`}>
              <Flex
                direction={'column'}
                justify={'center'}
                align={'center'}
                width={'100%'}
                gap={'7'}
                className={styles.noItemFlex}
              >
                <Text className={pageStyles.messageText}>
                  お気に入りをすると、イチオシ案件のマッチ度が向上します👍
                  <br />
                  希望に合いそうな案件を探して、まずは10件お気に入りしてみましょう🔥
                </Text>
                <RoundButton
                  hideIcon
                  text='案件を探す'
                  buttonClassName={`${pageStyles.messageButton} white`}
                  buttonBoxClassName={pageStyles.messageButtonBox}
                  onClick={() => {
                    router.push('/projects');
                  }}
                />
              </Flex>
            </Box>
          ) : (
            <>
              {canScrollLeft && (
                <IconButton
                  radius='full'
                  variant='soft'
                  className={pageStyles.leftScrollButton}
                  onClick={() => scroll('left')}
                >
                  <span
                    className={`material-icons ${pageStyles.leftScrollIcon}`}
                    translate='no'
                    aria-hidden='true'
                  >
                    chevron_left
                  </span>
                </IconButton>
              )}
              {canScrollRight && (
                <IconButton
                  radius='full'
                  variant='soft'
                  className={pageStyles.rightScrollButton}
                  onClick={() => scroll('right')}
                >
                  <span
                    className={`material-icons ${pageStyles.rightScrollIcon}`}
                    translate='no'
                    aria-hidden='true'
                  >
                    chevron_right
                  </span>
                </IconButton>
              )}
              <div ref={containerRef} className={pageStyles.scrollContainer}>
                {projectItems.map((item) => (
                  <Box key={item.uuid} className={pageStyles.projectCardBox}>
                    <ProjectSummaryCard
                      source='liked'
                      project={item as Project}
                      showProjectReactionButton={false}
                      showBidPipelineIcon={false}
                      topElement={
                        <Flex gap='2' justify='between' align='center' width='100%'>
                          {item.reactedByList && item.reactedByList.length > 1 ? (
                            <Box className={styles.favoriteProjectCardTopElementBox}>
                              <Text className={styles.favoriteProjectCardTopElementText}>
                                {item.reactedByList[0]} 他{item.reactedByList.length - 1}人
                              </Text>
                              <span
                                className={`material-icons ${styles.favoriteProjectCardTopElementIcon}`}
                                translate='no'
                                aria-hidden='true'
                              >
                                thumb_up
                              </span>
                            </Box>
                          ) : (
                            <Box className={styles.favoriteProjectCardTopElementBox}>
                              <Text className={styles.favoriteProjectCardTopElementText}>
                                {item.reactedByList?.join(', ')}
                              </Text>
                              <span
                                className={`material-icons ${styles.favoriteProjectCardTopElementIcon}`}
                                translate='no'
                                aria-hidden='true'
                              >
                                thumb_up
                              </span>
                            </Box>
                          )}
                          <Button
                            className={`actionButton ${styles.projectPipelineButton} ${!!item.bidPipeline && 'actionActiveButton'}`}
                            onClick={(e) => onClickProjectPipelineButton(e, item)}
                          >
                            <span className={'material-icons'} translate='no' aria-hidden='true'>
                              note
                            </span>
                            <Text>{item.bidPipeline?.id ? '追加済み' : '追加する'}</Text>
                          </Button>
                        </Flex>
                      }
                    />
                  </Box>
                ))}
              </div>
            </>
          )}
        </Flex>
      )}
    </Flex>
  );
}
