import { useGetSimilarAwardedProjects } from '@/api/generated/endpoints/projects';
import { Flex, Spinner, Text } from '@radix-ui/themes';
import styles from './SimilarAwardedProjectList.module.css';
import SimilarAwardedProjectCard from '@/app/(content)/_components/similarAwardedProjectCard/SimilarAwardedProjectCard';
import SimilarAwardedProjectCardSp from '@/app/(content)/_components/similarAwardedProjectCard/sp/SimilarAwardedProjectCardSp';

type Props = {
  projectUuid: string;
  isSp?: boolean;
};

// 似ている案件の一覧を表示するコンポーネント
export default function SimilarAwardedProjectList({ projectUuid, isSp = false }: Props) {
  const { data, isLoading, error } = useGetSimilarAwardedProjects(projectUuid, { size: 5 });

  return (
    <Flex direction='column' gap='8'>
      <Text className={styles.similarProjectsTitle}>類似の落札案件</Text>

      <Flex direction='column' gap='0'>
        {isLoading ? (
          <Flex justify={'center'} align={'center'} width={'100%'}>
            <Spinner size={'3'} />
          </Flex>
        ) : error ? (
          <Flex justify={'center'} align={'center'} width={'100%'}>
            <Text>似ている落札条件の取得に失敗しました</Text>
          </Flex>
        ) : data?.projects.length === 0 ? (
          <Flex justify={'center'} align={'center'} width={'100%'}>
            <Text className={styles.notFoundText}>似ている落札案件が見つかりませんでした</Text>
          </Flex>
        ) : (
          data?.projects.map((project) =>
            isSp ? (
              <SimilarAwardedProjectCardSp
                key={project.uuid}
                project={project}
                onClickCard={() => window.open(`/awardedProjects/${project.uuid}`, '_blank')}
              />
            ) : (
              <SimilarAwardedProjectCard
                key={project.uuid}
                project={project}
                onClickCard={() => window.open(`/awardedProjects/${project.uuid}`, '_blank')}
              />
            )
          )
        )}
      </Flex>
    </Flex>
  );
}
