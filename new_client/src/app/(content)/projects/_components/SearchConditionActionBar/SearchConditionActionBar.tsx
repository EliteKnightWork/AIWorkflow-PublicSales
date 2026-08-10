'use client';

import { Button } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import { useSubscribeSearchFilterPreset } from '@/api/generated/endpoints/search-filter-presets';
import type { SearchFilterPreset } from '@/api/generated/models';
import {
  CONTENT_PAGE_MAIN_CONTAINER,
  CONTENT_SIDEMENU_PREFIX,
  SAVE_CONDITION_BUTTON,
} from '@/constants';
import { useToast } from '@/context/ToastContext';
import { useSelectedSearchFilterPreset } from '../../_context/selectedSearchFilterPreset';
import styles from './styles.module.css';

type Props = {
  onEditConditions: () => void;
  onSaveConditions: () => void;
  scrollThreshold?: number;
  hasSearchParams: boolean;
  presets: SearchFilterPreset[];
  refreshPresets: () => void;
  actionBarkey: string;
};

export default function SearchConditionActionBar({
  onEditConditions,
  onSaveConditions,
  scrollThreshold = 200,
  hasSearchParams,
  presets,
  refreshPresets,
  actionBarkey,
}: Props) {
  const { selectedSearchFilterPresetId } = useSelectedSearchFilterPreset();
  const [isVisible, setIsVisible] = useState(false);
  const [containerStyle, setContainerStyle] = useState<React.CSSProperties>({});
  const [isSaved, setIsSaved] = useState(false);
  const { enqueueToast } = useToast();
  const { mutate: subscribeMutate } = useSubscribeSearchFilterPreset();

  const contentMainContainerRef = useRef<HTMLElement | null>(null);
  const scrollListenerRef = useRef<(() => void) | null>(null);
  const resizeListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    contentMainContainerRef.current = document.getElementById(CONTENT_PAGE_MAIN_CONTAINER);

    // メインコンテンツエリアの幅を設定する関数
    const updateContainerWidth = () => {
      // サイドバーを見つける
      const sideMenu = document.querySelector(`[id^="${CONTENT_SIDEMENU_PREFIX}"]`) as HTMLElement;

      if (sideMenu) {
        // サイドバーの幅を取得
        const sideMenuRect = sideMenu.getBoundingClientRect();
        const sideMenuWidth = sideMenuRect.width;

        // メインコンテンツはサイドバーの右側から画面端まで
        setContainerStyle({
          left: `${sideMenuWidth}px`,
          width: `calc(100vw - ${sideMenuWidth}px)`,
          right: 'auto',
        });
      }
    };

    const handleScroll = (target?: Window | Document | Element) => {
      // フォールバック: 従来の方法
      let scrollY = 0;
      if (target && target !== window && target !== document) {
        scrollY = (target as Element).scrollTop;
      } else {
        scrollY = window.scrollY;
      }

      setIsVisible(scrollY > scrollThreshold);
    };

    // 案件一覧のスクロール要素を取得する
    const contentMainContainer = contentMainContainerRef.current;

    if (!contentMainContainer) {
      return;
    }

    // 既存のリスナーを削除
    if (scrollListenerRef.current) {
      contentMainContainer.removeEventListener('scroll', scrollListenerRef.current);
    }
    if (resizeListenerRef.current) {
      window.removeEventListener('resize', resizeListenerRef.current);
    }

    // 新しいリスナーを作成・登録
    scrollListenerRef.current = () => handleScroll(contentMainContainer);
    resizeListenerRef.current = () => {
      handleScroll(window);
      updateContainerWidth();
    };

    contentMainContainer.addEventListener('scroll', scrollListenerRef.current);
    window.addEventListener('resize', resizeListenerRef.current);

    // 初期チェック
    handleScroll(contentMainContainer);
    // 初期表示時に幅を設定
    updateContainerWidth();

    return () => {
      if (scrollListenerRef.current) {
        contentMainContainer.removeEventListener('scroll', scrollListenerRef.current);
      }
      if (resizeListenerRef.current) {
        window.removeEventListener('resize', resizeListenerRef.current);
      }
      // クリーンアップ時に参照をクリア
      contentMainContainerRef.current;
      resizeListenerRef.current = null;
      scrollListenerRef.current = null;
    };
  }, [scrollThreshold, actionBarkey]);

  useEffect(() => {
    if (isVisible) {
      const saveConditionButton = document.getElementById(SAVE_CONDITION_BUTTON);

      if (saveConditionButton) {
        setIsSaved((saveConditionButton as HTMLButtonElement).disabled);
      }
    }
  }, [isVisible]);

  // 検索パラメータがない場合は表示しない
  if (!hasSearchParams) {
    return null;
  }

  const combinedStyle = {
    ...containerStyle,
    ...(isVisible ? {} : { transform: 'translateY(-100%)' }),
  };

  return (
    <div
      className={`${styles.stickyContainer} ${isVisible ? styles.visible : styles.hidden}`}
      style={combinedStyle}
      key={actionBarkey}
    >
      <div className={styles.buttonGroup}>
        <Button className={styles.editButton} onClick={onEditConditions}>
          条件を変更する
          <span className='material-icons'>filter_alt</span>
        </Button>
        <Button
          className={`${styles.saveButton} ${isSaved ? styles.savedNoRightRadius : ''}`}
          onClick={onSaveConditions}
          disabled={isSaved}
        >
          {isSaved ? (
            <>
              条件を保存済み
              <span className='material-icons'>check</span>
            </>
          ) : (
            '条件を保存する'
          )}
        </Button>
        {isSaved && (
          <Button
            className={styles.saveButton}
            onClick={() => {
              if (!selectedSearchFilterPresetId) {
                enqueueToast('保存条件が選択されていません', 'error');
                return;
              }
              const preset = presets.find((p) => p.id === selectedSearchFilterPresetId);
              if (!preset) {
                enqueueToast('保存条件が見つかりません', 'error');
                return;
              }
              subscribeMutate(
                { id: preset.id?.toString() as string },
                {
                  onSuccess: () => {
                    enqueueToast('配信条件に設定しました', 'success', 'bottom-center');
                    refreshPresets();
                  },
                  onError: (_error) => {
                    enqueueToast('配信条件の設定に失敗しました', 'error');
                  },
                }
              );
            }}
            disabled={(() => {
              const preset = presets.find((p) => p.id === selectedSearchFilterPresetId);
              return preset?.notificationRequired;
            })()}
          >
            {(() => {
              const preset = presets.find((p) => p.id === selectedSearchFilterPresetId);
              return preset?.notificationRequired ? (
                <>
                  配信条件に設定済み
                  <span className='material-icons'>check</span>
                </>
              ) : (
                '配信条件に設定する'
              );
            })()}
          </Button>
        )}
      </div>
    </div>
  );
}
