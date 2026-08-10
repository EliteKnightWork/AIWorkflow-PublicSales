import { Button, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { useAddBidPipelineCalendarEvent } from '@/api/generated/endpoints/bid-pipeline-calendar-events';
import { useGetCurrentUser } from '@/api/generated/endpoints/users';
import {
  type BidPipeline,
  DueDateType,
  type Project,
  Provider,
  type User,
} from '@/api/generated/models';
import AppTooltip from '@/app/_components/tooltip/AppTooltip';
import { formatPrice } from '@/utils/priceUtils';
import { SettingModal } from '../../_containers/setting-modal';
import parentStyles from '../styles.module.css';
import styles from './styles.module.css';

type Props = {
  project: Project;
  isWide?: boolean;
  pipelineBoardData?: {
    list: Array<{
      id: string;
      pipelines: BidPipeline[];
    }>;
  };
  onUpdatePipeline?: (pipeline: BidPipeline) => void;
  assignedUsers?: User[];
};

export const ProjectInformationCard = ({
  project,
  isWide,
  pipelineBoardData,
  onUpdatePipeline,
  assignedUsers,
}: Props) => {
  const defaultValue = '-';
  const [activeRegistration, setActiveRegistration] = useState<DueDateType | null>(null);
  const [isOpenSettingModal, setIsOpenSettingModal] = useState(false);

  const { data: currentUser } = useGetCurrentUser();
  const { mutate: createCalendarEvent } = useAddBidPipelineCalendarEvent();

  const isCurrentUserAssigned = assignedUsers?.some((user) => user.id === currentUser?.id) || false;
  const isButtonDisabledDueToGoogleAuth = !currentUser?.authorizedProviders?.includes(
    Provider.google_oauth2
  );

  const isButtonDisabledDueToMicrosoftAuth = !currentUser?.authorizedProviders?.includes(
    Provider.microsoft_graph
  );

  const isButtonDisabledDueToAuth =
    isButtonDisabledDueToGoogleAuth && isButtonDisabledDueToMicrosoftAuth;

  const isButtonDisabled = isButtonDisabledDueToAuth || !isCurrentUserAssigned;

  const targetPipeline =
    project.bidPipeline && pipelineBoardData
      ? pipelineBoardData.list
          .flatMap((list) => list.pipelines)
          .find((pipeline) => pipeline.id === project.bidPipeline?.id)
      : undefined;

  const handleRegisterCalendarEvent = (date: string | undefined, dateType: DueDateType) => {
    if (!date || !project.bidPipeline?.id) {
      return;
    }

    setActiveRegistration(dateType);
    const eventDate = new Date(date);
    createCalendarEvent(
      {
        bidPipelineId: project.bidPipeline.id.toString(),
        data: {
          startDateTime: eventDate.toISOString(),
          allDay: true,
          dueDateType: dateType,
        },
      },
      {
        onSuccess: () => {
          if (onUpdatePipeline && targetPipeline) {
            onUpdatePipeline({
              ...targetPipeline,
              eventCreatedDueDateTypes: [
                ...(targetPipeline?.eventCreatedDueDateTypes || []),
                dateType,
              ],
            });
          }
        },
        onSettled: () => {
          setActiveRegistration(null);
        },
      }
    );
  };

  if (isWide) {
    return (
      <>
        <SettingModal
          isOpen={isOpenSettingModal}
          onClose={() => {
            setIsOpenSettingModal(false);
          }}
        />
        <Grid className={styles.body}>
          <Grid columns={{ initial: '1', lg: '4' }} rows='1' className={styles.grid}>
            <Flex
              direction='column'
              gap='1'
              className={`${parentStyles.item} ${parentStyles.topLeft}`}
            >
              <Heading
                className={
                  project.publicationDate ? parentStyles.itemTitle : parentStyles.itemTitleDefault
                }
                as='h3'
                size={'3'}
              >
                公告日
              </Heading>
              <Text>{project.publicationDate ? project.publicationDate : defaultValue}</Text>
            </Flex>
            <Flex align='center' gap='2' className={parentStyles.item}>
              <Flex direction='column' gap='1' style={{ flex: 1 }}>
                <Heading
                  className={
                    project.applicationDocumentDeadlineDate
                      ? parentStyles.itemTitle
                      : parentStyles.itemTitleDefault
                  }
                  as='h3'
                  size={'3'}
                >
                  参加申し込み期日
                </Heading>
                <Text>
                  {project.applicationDocumentDeadlineDate
                    ? project.applicationDocumentDeadlineDate
                    : defaultValue}
                </Text>
              </Flex>
              {project.bidPipeline &&
                onUpdatePipeline &&
                project.applicationDocumentDeadlineDate &&
                (isButtonDisabled ? (
                  <AppTooltip
                    triggerChildren={
                      <Button className={styles.registerButton} disabled={true} onClick={() => {}}>
                        <span className='material-icons' translate='no' aria-hidden='true'>
                          calendar_today
                        </span>
                        登録する
                      </Button>
                    }
                    content={
                      <Flex direction='column' gap='3'>
                        <Text weight='medium'>カレンダー連携機能を使うためには：</Text>
                        <Flex direction='column' gap='2' style={{ paddingLeft: '16px' }}>
                          {isButtonDisabledDueToAuth && (
                            <Flex direction='row' gap='2' align='center'>
                              <Text>•</Text>
                              <Text>
                                <button
                                  type='button'
                                  className={styles.accountSettingLink}
                                  onClick={() => {
                                    setIsOpenSettingModal(true);
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    font: 'inherit',
                                  }}
                                >
                                  アカウント設定
                                </button>
                                へ移動して、Google/Microsoftアカウントと連携する
                              </Text>
                            </Flex>
                          )}
                          {!isCurrentUserAssigned && (
                            <Flex direction='row' gap='2' align='center'>
                              <Text>•</Text>
                              <Text>タスクの担当者を自分に設定する</Text>
                            </Flex>
                          )}
                        </Flex>
                      </Flex>
                    }
                  />
                ) : (
                  <Button
                    className={styles.registerButton}
                    disabled={
                      !project.applicationDocumentDeadlineDate ||
                      activeRegistration === DueDateType.application_document_deadline_date ||
                      targetPipeline?.eventCreatedDueDateTypes?.includes(
                        DueDateType.application_document_deadline_date
                      )
                    }
                    onClick={() =>
                      handleRegisterCalendarEvent(
                        project.applicationDocumentDeadlineDate,
                        DueDateType.application_document_deadline_date
                      )
                    }
                  >
                    <span className='material-icons' translate='no' aria-hidden='true'>
                      calendar_today
                    </span>
                    {targetPipeline?.eventCreatedDueDateTypes?.includes(
                      DueDateType.application_document_deadline_date
                    )
                      ? '登録済み'
                      : activeRegistration === DueDateType.application_document_deadline_date
                        ? '登録中...'
                        : '登録する'}
                  </Button>
                ))}
            </Flex>
            <Flex align='center' gap='2' className={parentStyles.item}>
              <Flex direction='column' gap='1' style={{ flex: 1 }}>
                <Heading
                  className={
                    project.proposalDocumentDeadlineDate
                      ? parentStyles.itemTitle
                      : parentStyles.itemTitleDefault
                  }
                  as='h3'
                  size={'3'}
                >
                  提案書期日
                </Heading>
                <Text>
                  {project.proposalDocumentDeadlineDate
                    ? project.proposalDocumentDeadlineDate
                    : defaultValue}
                </Text>
              </Flex>
              {project.bidPipeline &&
                onUpdatePipeline &&
                project.proposalDocumentDeadlineDate &&
                (isButtonDisabled ? (
                  <AppTooltip
                    triggerChildren={
                      <Button className={styles.registerButton} disabled={true} onClick={() => {}}>
                        <span className='material-icons' translate='no' aria-hidden='true'>
                          calendar_today
                        </span>
                        登録する
                      </Button>
                    }
                    content={
                      <Flex direction='column' gap='3'>
                        <Text weight='medium'>カレンダー連携機能を使うためには：</Text>
                        <Flex direction='column' gap='2' style={{ paddingLeft: '16px' }}>
                          {isButtonDisabledDueToAuth && (
                            <Flex direction='row' gap='2' align='center'>
                              <Text>•</Text>
                              <Text>
                                <button
                                  type='button'
                                  className={styles.accountSettingLink}
                                  onClick={() => {
                                    setIsOpenSettingModal(true);
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    font: 'inherit',
                                  }}
                                >
                                  アカウント設定
                                </button>
                                へ移動して、Google/Microsoftアカウントと連携する
                              </Text>
                            </Flex>
                          )}
                          {!isCurrentUserAssigned && (
                            <Flex direction='row' gap='2' align='center'>
                              <Text>•</Text>
                              <Text>タスクの担当者を自分に設定する</Text>
                            </Flex>
                          )}
                        </Flex>
                      </Flex>
                    }
                  />
                ) : (
                  <Button
                    className={styles.registerButton}
                    disabled={
                      !project.proposalDocumentDeadlineDate ||
                      activeRegistration === DueDateType.proposal_document_deadline_date ||
                      targetPipeline?.eventCreatedDueDateTypes?.includes(
                        DueDateType.proposal_document_deadline_date
                      )
                    }
                    onClick={() =>
                      handleRegisterCalendarEvent(
                        project.proposalDocumentDeadlineDate || undefined,
                        DueDateType.proposal_document_deadline_date
                      )
                    }
                  >
                    <span className='material-icons' translate='no' aria-hidden='true'>
                      calendar_today
                    </span>
                    {targetPipeline?.eventCreatedDueDateTypes?.includes(
                      DueDateType.proposal_document_deadline_date
                    )
                      ? '登録済み'
                      : activeRegistration === DueDateType.proposal_document_deadline_date
                        ? '登録中...'
                        : '登録する'}
                  </Button>
                ))}
            </Flex>
            <Flex
              align='center'
              gap='2'
              className={`${parentStyles.item} ${parentStyles.topRight}`}
            >
              <Flex direction='column' gap='1' style={{ flex: 1 }}>
                <Heading
                  className={
                    project.biddingDeadlineDate
                      ? parentStyles.itemTitle
                      : parentStyles.itemTitleDefault
                  }
                  as='h3'
                  size={'3'}
                >
                  入札日
                </Heading>
                <Text>
                  {project.biddingDeadlineDate ? project.biddingDeadlineDate : defaultValue}
                </Text>
              </Flex>
              {project.bidPipeline &&
                onUpdatePipeline &&
                project.biddingDeadlineDate &&
                (isButtonDisabled ? (
                  <AppTooltip
                    triggerChildren={
                      <Button className={styles.registerButton} disabled={true} onClick={() => {}}>
                        <span className='material-icons' translate='no' aria-hidden='true'>
                          calendar_today
                        </span>
                        登録する
                      </Button>
                    }
                    content={
                      <Flex direction='column' gap='3'>
                        <Text weight='medium'>カレンダー連携機能を使うためには：</Text>
                        <Flex direction='column' gap='2' style={{ paddingLeft: '16px' }}>
                          {isButtonDisabledDueToAuth && (
                            <Flex direction='row' gap='2' align='center'>
                              <Text>•</Text>
                              <Text>
                                <button
                                  type='button'
                                  className={styles.accountSettingLink}
                                  onClick={() => {
                                    setIsOpenSettingModal(true);
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    font: 'inherit',
                                  }}
                                >
                                  アカウント設定
                                </button>
                                へ移動して、Google/Microsoftアカウントと連携する
                              </Text>
                            </Flex>
                          )}
                          {!isCurrentUserAssigned && (
                            <Flex direction='row' gap='2' align='center'>
                              <Text>•</Text>
                              <Text>タスクの担当者を自分に設定する</Text>
                            </Flex>
                          )}
                        </Flex>
                      </Flex>
                    }
                  />
                ) : (
                  <Button
                    className={styles.registerButton}
                    disabled={
                      !project.biddingDeadlineDate ||
                      activeRegistration === DueDateType.bidding_deadline_date ||
                      targetPipeline?.eventCreatedDueDateTypes?.includes(
                        DueDateType.bidding_deadline_date
                      )
                    }
                    onClick={() =>
                      handleRegisterCalendarEvent(
                        project.biddingDeadlineDate,
                        DueDateType.bidding_deadline_date
                      )
                    }
                  >
                    <span className='material-icons' translate='no' aria-hidden='true'>
                      calendar_today
                    </span>
                    {targetPipeline?.eventCreatedDueDateTypes?.includes(
                      DueDateType.bidding_deadline_date
                    )
                      ? '登録済み'
                      : activeRegistration === DueDateType.bidding_deadline_date
                        ? '登録中...'
                        : '登録する'}
                  </Button>
                ))}
            </Flex>
          </Grid>
          <Grid columns={{ initial: '1', lg: '2' }} rows='1' className={styles.grid}>
            <Flex
              direction='column'
              gap='1'
              className={`${parentStyles.item} ${parentStyles.bottomLeft}`}
            >
              <Heading
                className={
                  project.plannedPrice ? parentStyles.itemTitle : parentStyles.itemTitleDefault
                }
                as='h3'
                size={'3'}
              >
                予定価格
              </Heading>
              <Text>{project.plannedPrice ? formatPrice(project.plannedPrice) : defaultValue}</Text>
            </Flex>
            <Flex
              direction='column'
              gap='1'
              className={`${parentStyles.item} ${parentStyles.bottomRight}`}
            >
              <Heading
                className={
                  project.registrationDate ? parentStyles.itemTitle : parentStyles.itemTitleDefault
                }
                as='h3'
                size={'3'}
              >
                登録日
              </Heading>
              <Text>{project.registrationDate ? project.registrationDate : defaultValue}</Text>
            </Flex>
          </Grid>
        </Grid>
      </>
    );
  }

  return (
    // サイドバーレイアウト
    <>
      <SettingModal
        isOpen={isOpenSettingModal}
        onClose={() => {
          setIsOpenSettingModal(false);
        }}
      />
      <Grid columns='2' rows='3' className={styles.body}>
        <Flex direction='column' gap='1' className={`${parentStyles.item} ${parentStyles.topLeft}`}>
          <Heading
            className={
              project.publicationDate ? parentStyles.itemTitle : parentStyles.itemTitleDefault
            }
            as='h3'
            size={'3'}
          >
            公告日
          </Heading>
          <Text>{project.publicationDate ? project.publicationDate : defaultValue}</Text>
        </Flex>
        <Flex align='center' gap='2' className={`${parentStyles.item} ${parentStyles.topRight}`}>
          <Flex direction='column' gap='1' style={{ flex: 1 }}>
            <Heading
              className={
                project.applicationDocumentDeadlineDate
                  ? parentStyles.itemTitle
                  : parentStyles.itemTitleDefault
              }
              as='h3'
              size={'3'}
            >
              参加申し込み期日
            </Heading>
            <Text>
              {project.applicationDocumentDeadlineDate
                ? project.applicationDocumentDeadlineDate
                : defaultValue}
            </Text>
          </Flex>
          {project.bidPipeline &&
            onUpdatePipeline &&
            project.applicationDocumentDeadlineDate &&
            (isButtonDisabled ? (
              <AppTooltip
                triggerChildren={
                  <Button className={styles.registerButton} disabled={true} onClick={() => {}}>
                    <span className='material-icons' translate='no' aria-hidden='true'>
                      calendar_today
                    </span>
                    登録する
                  </Button>
                }
                content={
                  <Flex direction='column' gap='3'>
                    <Text weight='medium'>カレンダー連携機能を使うためには：</Text>
                    <Flex direction='column' gap='2' style={{ paddingLeft: '16px' }}>
                      {isButtonDisabledDueToAuth && (
                        <Flex direction='row' gap='2' align='center'>
                          <Text>•</Text>
                          <Text>
                            <button
                              type='button'
                              className={styles.accountSettingLink}
                              onClick={() => {
                                setIsOpenSettingModal(true);
                              }}
                              style={{
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                font: 'inherit',
                              }}
                            >
                              アカウント設定
                            </button>
                            へ移動して、Google/Microsoftアカウントと連携する
                          </Text>
                        </Flex>
                      )}
                      {!isCurrentUserAssigned && (
                        <Flex direction='row' gap='2' align='center'>
                          <Text>•</Text>
                          <Text>タスクの担当者を自分に設定する</Text>
                        </Flex>
                      )}
                    </Flex>
                  </Flex>
                }
              />
            ) : (
              <Button
                size='1'
                variant='soft'
                className={styles.registerButton}
                disabled={
                  !project.applicationDocumentDeadlineDate ||
                  activeRegistration === DueDateType.application_document_deadline_date ||
                  targetPipeline?.eventCreatedDueDateTypes?.includes(
                    DueDateType.application_document_deadline_date
                  )
                }
                onClick={() =>
                  handleRegisterCalendarEvent(
                    project.applicationDocumentDeadlineDate,
                    DueDateType.application_document_deadline_date
                  )
                }
              >
                <span className='material-icons' translate='no' aria-hidden='true'>
                  calendar_today
                </span>
                {targetPipeline?.eventCreatedDueDateTypes?.includes(
                  DueDateType.application_document_deadline_date
                )
                  ? '登録済み'
                  : activeRegistration === DueDateType.application_document_deadline_date
                    ? '登録中...'
                    : '登録する'}
              </Button>
            ))}
        </Flex>
        <Flex align='center' gap='2' className={parentStyles.item}>
          <Flex direction='column' gap='1' style={{ flex: 1 }}>
            <Heading
              className={
                project.proposalDocumentDeadlineDate
                  ? parentStyles.itemTitle
                  : parentStyles.itemTitleDefault
              }
              as='h3'
              size={'3'}
            >
              提案書期日
            </Heading>
            <Text>
              {project.proposalDocumentDeadlineDate
                ? project.proposalDocumentDeadlineDate
                : defaultValue}
            </Text>
          </Flex>
          {project.bidPipeline &&
            onUpdatePipeline &&
            project.proposalDocumentDeadlineDate &&
            (isButtonDisabled ? (
              <AppTooltip
                triggerChildren={
                  <Button className={styles.registerButton} disabled={true} onClick={() => {}}>
                    <span className='material-icons' translate='no' aria-hidden='true'>
                      calendar_today
                    </span>
                    登録する
                  </Button>
                }
                content={
                  <Flex direction='column' gap='3'>
                    <Text weight='medium'>カレンダー連携機能を使うためには：</Text>
                    <Flex direction='column' gap='2' style={{ paddingLeft: '16px' }}>
                      {isButtonDisabledDueToAuth && (
                        <Flex direction='row' gap='2' align='center'>
                          <Text>•</Text>
                          <Text>
                            <button
                              type='button'
                              className={styles.accountSettingLink}
                              onClick={() => {
                                setIsOpenSettingModal(true);
                              }}
                              style={{
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                font: 'inherit',
                              }}
                            >
                              アカウント設定
                            </button>
                            へ移動して、Google/Microsoftアカウントと連携する
                          </Text>
                        </Flex>
                      )}
                      {!isCurrentUserAssigned && (
                        <Flex direction='row' gap='2' align='center'>
                          <Text>•</Text>
                          <Text>タスクの担当者を自分に設定する</Text>
                        </Flex>
                      )}
                    </Flex>
                  </Flex>
                }
              />
            ) : (
              <Button
                size='1'
                variant='soft'
                className={styles.registerButton}
                disabled={
                  !project.proposalDocumentDeadlineDate ||
                  activeRegistration === DueDateType.proposal_document_deadline_date ||
                  targetPipeline?.eventCreatedDueDateTypes?.includes(
                    DueDateType.proposal_document_deadline_date
                  )
                }
                onClick={() =>
                  handleRegisterCalendarEvent(
                    project.proposalDocumentDeadlineDate || undefined,
                    DueDateType.proposal_document_deadline_date
                  )
                }
              >
                <span className='material-icons' translate='no' aria-hidden='true'>
                  calendar_today
                </span>
                {targetPipeline?.eventCreatedDueDateTypes?.includes(
                  DueDateType.proposal_document_deadline_date
                )
                  ? '登録済み'
                  : activeRegistration === DueDateType.proposal_document_deadline_date
                    ? '登録中...'
                    : '登録する'}
              </Button>
            ))}
        </Flex>
        <Flex align='center' gap='2' className={parentStyles.item}>
          <Flex direction='column' gap='1' style={{ flex: 1 }}>
            <Heading
              className={
                project.biddingDeadlineDate ? parentStyles.itemTitle : parentStyles.itemTitleDefault
              }
              as='h3'
              size={'3'}
            >
              入札日
            </Heading>
            <Text>{project.biddingDeadlineDate ? project.biddingDeadlineDate : defaultValue}</Text>
          </Flex>
          {project.bidPipeline &&
            onUpdatePipeline &&
            project.biddingDeadlineDate &&
            (isButtonDisabled ? (
              <AppTooltip
                triggerChildren={
                  <Button className={styles.registerButton} disabled={true} onClick={() => {}}>
                    <span className='material-icons' translate='no' aria-hidden='true'>
                      calendar_today
                    </span>
                    登録する
                  </Button>
                }
                content={
                  <Flex direction='column' gap='3'>
                    <Text weight='medium'>カレンダー連携機能を使うためには：</Text>
                    <Flex direction='column' gap='2' style={{ paddingLeft: '16px' }}>
                      {isButtonDisabledDueToAuth && (
                        <Flex direction='row' gap='2' align='center'>
                          <Text>•</Text>
                          <Text>
                            <button
                              type='button'
                              className={styles.accountSettingLink}
                              onClick={() => {
                                setIsOpenSettingModal(true);
                              }}
                              style={{
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                font: 'inherit',
                              }}
                            >
                              アカウント設定
                            </button>
                            へ移動して、Google/Microsoftアカウントと連携する
                          </Text>
                        </Flex>
                      )}
                      {!isCurrentUserAssigned && (
                        <Flex direction='row' gap='2' align='center'>
                          <Text>•</Text>
                          <Text>タスクの担当者を自分に設定する</Text>
                        </Flex>
                      )}
                    </Flex>
                  </Flex>
                }
              />
            ) : (
              <Button
                size='1'
                variant='soft'
                className={styles.registerButton}
                disabled={
                  !project.biddingDeadlineDate ||
                  activeRegistration === DueDateType.bidding_deadline_date ||
                  targetPipeline?.eventCreatedDueDateTypes?.includes(
                    DueDateType.bidding_deadline_date
                  )
                }
                onClick={() =>
                  handleRegisterCalendarEvent(
                    project.biddingDeadlineDate,
                    DueDateType.bidding_deadline_date
                  )
                }
              >
                <span className='material-icons' translate='no' aria-hidden='true'>
                  calendar_today
                </span>
                {targetPipeline?.eventCreatedDueDateTypes?.includes(
                  DueDateType.bidding_deadline_date
                )
                  ? '登録済み'
                  : activeRegistration === DueDateType.bidding_deadline_date
                    ? '登録中...'
                    : '登録する'}
              </Button>
            ))}
        </Flex>
        <Flex
          direction='column'
          gap='1'
          className={`${parentStyles.item} ${parentStyles.bottomLeft}`}
        >
          <Heading
            className={
              project.plannedPrice ? parentStyles.itemTitle : parentStyles.itemTitleDefault
            }
            as='h3'
            size={'3'}
          >
            予定価格
          </Heading>
          <Text>{project.plannedPrice ? formatPrice(project.plannedPrice) : defaultValue}</Text>
        </Flex>
        <Flex
          direction='column'
          gap='1'
          className={`${parentStyles.item} ${parentStyles.bottomRight}`}
        >
          <Heading
            className={
              project.registrationDate ? parentStyles.itemTitle : parentStyles.itemTitleDefault
            }
            as='h3'
            size={'3'}
          >
            登録日
          </Heading>
          <Text>{project.registrationDate ? project.registrationDate : defaultValue}</Text>
        </Flex>
      </Grid>
    </>
  );
};
