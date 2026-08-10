'use client';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useCallback, useMemo, useState } from 'react';
import { useGetMyCompany } from '@/api/generated/endpoints/companies';
import { FeatureKey, ProjectReactionType, type Project } from '@/api/generated/models';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import { BidIcon } from '@/components/projectIcon/BidIcon';
import { CloseIcon } from '@/components/projectIcon/CloseIcon';
import { OpenIcon } from '@/components/projectIcon/OpenIcon';
import { useBidPipeline } from '@/context/BidPipelineContext';
import { getSearchProjectsQueryParams } from '@/lib/getSearchProjectsQueryParams';
import { getPrefectureCode } from '@/utils/regionUtils';
import { ProcedureType } from '../../bidCompanies/types';
import { isOpenProject } from '../../projects/model';
import { OptionsSelect } from '../optionsSelect/OptionsSelect';
import { ProposalCreateRequestDialog } from '../proposalCreateRequestDialog/proposalCreateRequestDialog';
import IconBadge from '../stateBadge/IconBadge';
import styles from './styles.module.css';
import { useProjectReaction } from '@/context/ProjectReactionContext';
import { ProjectReactionButton } from '@/features/ProjectReactionButton';
import type { ReactionEventSource } from '@/utils/googleAnalyticsUtils';

type Props<T extends Project = Project> = {
  project: T;
  isLogin: boolean;
  isAbbreviated?: boolean;
  onOpen?: (project: T) => void;
  onClose?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  position: ReactionEventSource;
  isMobile?: boolean;
  hideReactionButton?: boolean;
  onUpdateProject?: (project: Project) => void;
};

export default function ProjectTitleCard({
  isLogin,
  project,
  isAbbreviated,
  onOpen,
  onClose,
  onEdit,
  onDelete,
  position,
  isMobile: _isMobile = false,
  hideReactionButton = false,
  onUpdateProject,
}: Props) {
  const isProject = project.type === 'project';
  const { handleAddBidPipeline, openConfirmDeleteBidPipelineDialog } = useBidPipeline();
  const [isProposalCreateRequestDialogOpen, setIsProposalCreateRequestDialogOpen] = useState(false);
  const isCompanyProject = project.companyProjectId != null;

  const { data: myCompany } = useGetMyCompany();

  const { handleUpdateReaction } = useProjectReaction();
  const handleClickReaction = (
    e: React.MouseEvent<HTMLButtonElement>,
    reaction: ProjectReactionType
  ) => {
    e.stopPropagation();

    const source = getReactionEventSource();

    const currentReaction = project.reaction ?? ProjectReactionType.neutral;
    onUpdateProject?.({ ...project, reaction: reaction });
    handleUpdateReaction(project.uuid, reaction, source).catch(() => {
      onUpdateProject?.({ ...project, reaction: currentReaction });
    });
  };

  const searchUrl = useCallback(
    (searchProps: {
      prefName?: string;
      procedureTypeGroup?: ProcedureType;
      organizationName?: string;
    }) => {
      const updateParams = {
        ...(searchProps.prefName && {
          prefectures: [`${getPrefectureCode(searchProps.prefName)}`],
        }),
        ...(searchProps.procedureTypeGroup && {
          procedureTypeGroups: [searchProps.procedureTypeGroup],
        }),
        ...(searchProps.organizationName && {
          organizationNameArray: [searchProps.organizationName],
        }),
        projectType: project.type,
        page: 1,
      };

      const params = getSearchProjectsQueryParams(updateParams);
      return `/projects?${params}`;
    },
    [project.type]
  );

  const handleClickPipeline = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (project.type !== 'project') {
      return;
    }

    if (project.bidPipeline?.id) {
      // 案件管理から外す
      openConfirmDeleteBidPipelineDialog(
        project.bidPipeline.id.toString(),
        () => {
          onUpdateProject?.({ ...project, bidPipeline: undefined });
        },
        () => {}
      );
    } else {
      handleAddBidPipeline(project.uuid, (pipeline) => {
        onUpdateProject?.({
          ...project,
          bidPipeline: {
            id: pipeline.id,
            status: pipeline.status,
          },
        });
      }).catch(() => {
        onUpdateProject?.({ ...project, bidPipeline: undefined });
      });
    }
  };

  const getReactionEventSource = (): ReactionEventSource => {
    if (position === 'search_result') {
      return 'search_result';
    }

    const params = new URLSearchParams(window.location.search);
    const sourceParam = params.get('source');
    if (sourceParam === 'recommendation') {
      return 'detail_via_recommendation';
    }
    return 'detail';
  };

  const prefectureBadges = useMemo(() => {
    return project.prefectures?.map((prefName, index) => (
      <IconBadge
        key={`prefecture-badge-${prefName}`}
        text={prefName}
        icon_name={index === 0 ? 'location_on' : ''}
        active={!!prefName}
        icon_color={'var(--app-blue-light)'}
        href={searchUrl({ prefName: prefName })}
      />
    ));
  }, [project.prefectures, searchUrl]);

  return (
    <Flex direction='column' gap='6'>
      <Flex direction='row' gap='4' justify='between' align='center'>
        <Flex direction='column' gap='4' style={{ overflowX: 'hidden' }}>
          <Flex direction='row' gap='4' align='center'>
            {isProject ? (
              isOpenProject(project) ? (
                <OpenIcon className={styles.projectCardIcon} />
              ) : (
                <CloseIcon className={styles.projectCardIcon} />
              )
            ) : (
              <BidIcon className={styles.projectCardIcon} />
            )}
            <Text weight='bold' size='6'>
              {project.title}
            </Text>
          </Flex>
          <Flex direction='row' gap='2' align={'center'}>
            {isProject && project.isNewArrival && (
              <Box className={styles.newArrivalBadge}>
                <Text>新着</Text>
              </Box>
            )}

            <Flex direction='row' gap='2' align={'center'} className={styles.badgeRow}>
              <Flex direction='row' gap='0' align={'center'}>
                {prefectureBadges}
              </Flex>
              {project.procedureTypeGroup && (
                <IconBadge
                  text={project.procedureTypeGroup}
                  icon_name='rule'
                  active={!!project.procedureTypeGroup}
                  icon_color={'var(--app-purple-main)'}
                  href={searchUrl({ procedureTypeGroup: project.procedureTypeGroup })}
                />
              )}
              {project.organizationName && (
                <IconBadge
                  text={project.organizationName}
                  icon_name='account_balance'
                  active={!!project.organizationName}
                  icon_color={'var(--app-green-main)'}
                  href={searchUrl({ organizationName: project.organizationName })}
                />
              )}
            </Flex>
          </Flex>
        </Flex>
        <Flex direction='row' align='center' gap='4'>
          {(onEdit || onDelete) && (
            <OptionsSelect
              buttonClassName={styles.optionButton}
              buttonIconString='more_horiz'
              contentAlign='end'
              items={[
                ...(onEdit ? [{ label: '編集する', onClick: onEdit }] : []),
                ...(onDelete
                  ? [{ label: '削除する', onClick: onDelete, className: styles.optionDeleteItem }]
                  : []),
              ]}
            />
          )}
          {onOpen && (
            <Box>
              <Button variant='ghost' className={styles.openButton} onClick={() => onOpen(project)}>
                <span className='material-icons' translate='no' aria-hidden='true'>
                  open_in_new
                </span>
              </Button>
            </Box>
          )}
          {onClose && (
            <Box>
              <Button variant='ghost' className={styles.closeButton} onClick={onClose}>
                <span className='material-icons' translate='no' aria-hidden='true'>
                  close
                </span>
              </Button>
            </Box>
          )}
        </Flex>
      </Flex>

      {isLogin && project.type === 'project' && (
        <Flex direction='row' align='center' gap='4'>
          {!isAbbreviated &&
            project.procedureTypeGroup === ProcedureType.PROPOSAL_COMPETITIVE &&
            myCompany?.features?.some((f) => f.key === FeatureKey.proposal_document_create) &&
            (!project.attachments || project.attachments?.length === 0 ? (
              <AppTooltip
                triggerChildren={
                  <Button
                    variant='ghost'
                    className={`${styles.proposalButton} ${styles.proposalDisabledButton}`}
                    disabled
                  >
                    提案書を作成(β版)
                  </Button>
                }
                content={'添付資料がないため提案書の作成ができません'}
              />
            ) : (
              <>
                <Button
                  variant='ghost'
                  className={styles.proposalButton}
                  onClick={() => {
                    setIsProposalCreateRequestDialogOpen(true);
                  }}
                >
                  提案書を作成(β版)
                </Button>
                <ProposalCreateRequestDialog
                  isOpen={isProposalCreateRequestDialogOpen}
                  onClose={() => setIsProposalCreateRequestDialogOpen(false)}
                  onConfirm={() => {}}
                  project={project}
                />
              </>
            ))}

          {!isCompanyProject && !hideReactionButton && !project.bidPipeline?.id && (
            <ProjectReactionButton
              reaction={project.reaction ?? ProjectReactionType.neutral}
              onChangeReaction={(
                e: React.MouseEvent<HTMLButtonElement>,
                newReaction: ProjectReactionType
              ) => {
                handleClickReaction(e, newReaction);
              }}
            />
          )}

          {!isCompanyProject && (
            <Button
              className={`actionButton ${styles.pipelineButton} ${!!project.bidPipeline && 'actionActiveButton'}`}
              onClick={handleClickPipeline}
            >
              <span className='material-icons' translate='no' aria-hidden='true'>
                note
              </span>
              <Text>{project.bidPipeline ? '案件管理に追加済み' : '案件管理に追加する'}</Text>
            </Button>
          )}
        </Flex>
      )}
    </Flex>
  );
}
