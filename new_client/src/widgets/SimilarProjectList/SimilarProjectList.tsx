import { useGetV1ProjectsUuidSimilarProjects } from '@/api/generated/endpoints/projects';
import SimilarProjectCard from '@/app/(content)/_components/similarProjectCard/SimilarProjectCard';
import { Flex, Spinner, Text } from '@radix-ui/themes';
import styles from './SimilarProjectList.module.css';
import SimilarProjectCardSp from '@/app/(content)/_components/similarProjectCard/sp/SimilarProjectCardSp';

type Props = {
  projectUuid: string;
  isSp?: boolean;
};

// 似ている案件の一覧を表示するコンポーネント
export default function SimilarProjectList({ projectUuid, isSp = false }: Props) {
  const { data, isLoading, error } = useGetV1ProjectsUuidSimilarProjects(projectUuid, { size: 5 });

  return (
    <Flex direction='column' gap='8'>
      <Text className={styles.similarProjectsTitle}>類似の入札案件</Text>

      <Flex direction='column' gap='0'>
        {isLoading ? (
          <Flex justify={'center'} align={'center'} width={'100%'}>
            <Spinner size={'3'} />
          </Flex>
        ) : error ? (
          <Flex justify={'center'} align={'center'} width={'100%'}>
            <Text>類似入札案件データの取得に失敗しました</Text>
          </Flex>
        ) : data?.projects.length === 0 ? (
          <Flex justify={'center'} align={'center'} width={'100%'}>
            <Text className={styles.notFoundText}>似ている入札案件が見つかりませんでした</Text>
          </Flex>
        ) : (
          data?.projects.map((project) =>
            isSp ? (
              <SimilarProjectCardSp
                key={project.uuid}
                project={project}
                onClickCard={() => window.open(`/projects/${project.uuid}`, '_blank')}
              />
            ) : (
              <SimilarProjectCard
                key={project.uuid}
                project={project}
                onClickCard={() => window.open(`/projects/${project.uuid}`, '_blank')}
              />
            )
          )
        )}
      </Flex>
    </Flex>
  );
}
