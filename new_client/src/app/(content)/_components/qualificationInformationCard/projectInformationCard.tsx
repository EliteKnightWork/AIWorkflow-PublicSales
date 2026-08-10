import { Flex, Grid, Text } from '@radix-ui/themes';
import type { Project } from '@/api/generated/models';
import parentStyles from '../styles.module.css';
import styles from './styles.module.css';

type Props = {
  project: Project;
  isWide?: boolean;
};

export const ProjectInformationCard = ({ project, isWide }: Props) => {
  const defaultValue = '-';

  if (isWide) {
    return (
      <Grid className={styles.body}>
        <Grid columns={{ initial: '1', lg: '3' }} rows='1' className={styles.grid}>
          <Flex
            direction='column'
            gap='1'
            className={`${parentStyles.item} ${parentStyles.topLeft}`}
          >
            <Text
              className={
                project.isExperienceRequired !== null
                  ? parentStyles.itemTitle
                  : parentStyles.itemTitleDefault
              }
            >
              事業実績の有無
            </Text>
            <Text>
              {project.isExperienceRequired !== null
                ? project.isExperienceRequired
                  ? '有'
                  : '無'
                : defaultValue}
            </Text>
          </Flex>
          <Flex direction='column' gap='1' className={`${parentStyles.item}`}>
            <Text
              className={
                project.isOfficeRequired !== null
                  ? parentStyles.itemTitle
                  : parentStyles.itemTitleDefault
              }
            >
              事業所の有無
            </Text>
            <Text>
              {project.isOfficeRequired !== null
                ? project.isOfficeRequired
                  ? '有'
                  : '無'
                : defaultValue}
            </Text>
          </Flex>
          <Flex
            direction='column'
            gap='1'
            className={`${parentStyles.item} ${parentStyles.topRight}`}
          >
            <Text
              className={
                project.projectSecurityQualifications !== null &&
                project.projectSecurityQualifications &&
                project.projectSecurityQualifications.length > 0
                  ? parentStyles.itemTitle
                  : parentStyles.itemTitleDefault
              }
            >
              セキュリティ要件
            </Text>
            <Text>
              {project.projectSecurityQualifications !== null &&
              project.projectSecurityQualifications &&
              project.projectSecurityQualifications.length > 0
                ? project.projectSecurityQualifications.join(', ')
                : '不要'}
            </Text>
          </Flex>
          <Flex
            direction='column'
            gap='1'
            className={`${parentStyles.item} ${parentStyles.bottomLeft} ${parentStyles.bottomRight}`}
            style={{ gridColumn: '1 / -1' }}
          >
            <Text
              className={
                project.participateQualificationGrades &&
                project.participateQualificationGrades.length > 0
                  ? parentStyles.itemTitle
                  : parentStyles.itemTitleDefault
              }
            >
              入札参加資格
            </Text>
            {project.participateQualificationGrades &&
            project.participateQualificationGrades.length > 0 ? (
              <Flex direction='column' gap='1'>
                {project.participateQualificationGrades.map((grade) => (
                  <Text key={grade.id}>
                    {`${grade.name}: ${grade.grades?.map((g) => g.name || '等級なし').join(', ')}`}
                  </Text>
                ))}
              </Flex>
            ) : (
              <Text>{defaultValue}</Text>
            )}
          </Flex>
        </Grid>
      </Grid>
    );
  }

  return (
    // サイドバーレイアウト
    <Grid columns='2' rows='1' className={styles.body}>
      <Flex direction='column' gap='1' className={`${parentStyles.item} ${parentStyles.topLeft}`}>
        <Text
          className={
            project.isExperienceRequired !== null
              ? parentStyles.itemTitle
              : parentStyles.itemTitleDefault
          }
        >
          事業実績の有無
        </Text>
        <Text>
          {project.isExperienceRequired !== null
            ? project.isExperienceRequired
              ? '有'
              : '無'
            : defaultValue}
        </Text>
      </Flex>
      <Flex direction='column' gap='1' className={`${parentStyles.item} ${parentStyles.topRight}`}>
        <Text
          className={
            project.isOfficeRequired !== null
              ? parentStyles.itemTitle
              : parentStyles.itemTitleDefault
          }
        >
          事業所の有無
        </Text>
        <Text>
          {project.isOfficeRequired !== null
            ? project.isOfficeRequired
              ? '有'
              : '無'
            : defaultValue}
        </Text>
      </Flex>
      <Flex
        direction='column'
        gap='1'
        className={`${parentStyles.item}`}
        style={{ gridColumn: '1 / -1' }}
      >
        <Text
          className={
            project.projectSecurityQualifications !== null &&
            project.projectSecurityQualifications &&
            project.projectSecurityQualifications.length > 0
              ? parentStyles.itemTitle
              : parentStyles.itemTitleDefault
          }
        >
          セキュリティ要件
        </Text>
        <Text>
          {project.projectSecurityQualifications !== null &&
          project.projectSecurityQualifications &&
          project.projectSecurityQualifications.length > 0
            ? project.projectSecurityQualifications.join(', ')
            : '不要'}
        </Text>
      </Flex>
      <Flex
        direction='column'
        gap='1'
        className={`${parentStyles.item} ${parentStyles.bottomLeft} ${parentStyles.bottomRight}`}
        style={{ gridColumn: '1 / -1' }}
      >
        <Text
          className={
            project.participateQualificationGrades &&
            project.participateQualificationGrades.length > 0
              ? parentStyles.itemTitle
              : parentStyles.itemTitleDefault
          }
        >
          参加資格
        </Text>
        {project.participateQualificationGrades &&
        project.participateQualificationGrades.length > 0 ? (
          <Flex direction='column' gap='1'>
            {project.participateQualificationGrades.map((grade) => (
              <Text key={grade.id}>
                {`${grade.name}: ${grade.grades?.map((g) => g.name || '等級なし').join(', ')}`}
              </Text>
            ))}
          </Flex>
        ) : (
          <Text>{defaultValue}</Text>
        )}
      </Flex>
    </Grid>
  );
};
