import { Flex, IconButton } from '@radix-ui/themes';
import styles from './ProjectReactionButton.module.css';
import { ProjectReactionType } from '@/api/generated/models';
import { useEffect, useState } from 'react';

export type ProjectReactionButtonProps = {
  /** 現在のリアクション状態 */
  reaction: ProjectReactionType;
  /** リアクション変更時のコールバック */
  onChangeReaction: (e: React.MouseEvent<HTMLButtonElement>, reaction: ProjectReactionType) => void;
};

/**
 * プロジェクトに対するリアクション（いいね/よくないね）ボタンコンポーネント
 * @param props - コンポーネントのプロパティ
 * @returns リアクションボタンコンポーネント
 */
export default function ProjectReactionButton({
  reaction,
  onChangeReaction,
}: ProjectReactionButtonProps) {
  // prop の reaction を初期値として使用
  const [targetReaction, setTargetReaction] = useState<ProjectReactionType>(reaction);

  useEffect(() => {
    setTargetReaction(reaction);
  }, [reaction]);

  const onClickButton = (
    e: React.MouseEvent<HTMLButtonElement>,
    newReaction: ProjectReactionType
  ) => {
    setTargetReaction(newReaction);
    onChangeReaction(e, newReaction);
  };

  // 表示/非表示の判定
  const isLikeVisible = targetReaction !== ProjectReactionType.dislike;
  const isDislikeVisible = targetReaction !== ProjectReactionType.like;

  return (
    <Flex direction='row'>
      <IconButton
        variant='outline'
        className={`${styles.likeButton} ${targetReaction === ProjectReactionType.like ? styles.likeActiveButton : styles.likeInactiveButton} ${isLikeVisible ? styles.visible : styles.hidden}`}
        onClick={(e) =>
          onClickButton(
            e,
            targetReaction === ProjectReactionType.like
              ? ProjectReactionType.neutral
              : ProjectReactionType.like
          )
        }
      >
        {targetReaction === ProjectReactionType.like ? (
          <span className='material-icons' translate='no' aria-hidden='true'>
            thumb_up
          </span>
        ) : (
          <span className='material-icons' translate='no' aria-hidden='true'>
            thumb_up
          </span>
        )}
      </IconButton>
      <IconButton
        variant='outline'
        className={`${styles.dislikeButton} ${targetReaction === ProjectReactionType.dislike ? styles.dislikeActiveButton : styles.dislikeInactiveButton} ${isDislikeVisible ? styles.visible : styles.hidden}`}
        onClick={(e) =>
          onClickButton(
            e,
            targetReaction === ProjectReactionType.dislike
              ? ProjectReactionType.neutral
              : ProjectReactionType.dislike
          )
        }
      >
        {targetReaction === ProjectReactionType.dislike ? (
          <span className='material-icons' translate='no' aria-hidden='true'>
            thumb_down
          </span>
        ) : (
          <span className='material-icons-outlined' translate='no' aria-hidden='true'>
            thumb_down
          </span>
        )}
      </IconButton>
    </Flex>
  );
}
