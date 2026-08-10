'use client';

import { Button } from '@radix-ui/themes';
import type { SearchFilterPreset } from '@/api/generated/models';
import { getPrefectureName } from '@/utils/regionUtils';
import type { SearchTag, SearchTagRow } from '../../types';
import { SuggestionsList } from '../suggestionsList/SuggestionsList';
import styles from './styles.module.css';

type Props = {
  searchFilterPresets: SearchFilterPreset[];
  onAddSuggestions: (params: SearchTagRow) => void;
  onClickPresetListButton: () => void;
  selectedPresetId?: number;
};

export const SearchFilterPresetSuggestions = ({
  searchFilterPresets,
  onAddSuggestions,
  onClickPresetListButton,
  selectedPresetId,
}: Props) => {
  const createSearchTag = (preset: SearchFilterPreset) => {
    const suggestions: SearchTag[] = [];

    if (preset.filter?.keywords) {
      for (const keyword of preset.filter.keywords) {
        suggestions.push({
          tag_type: 'keywords',
          tag_title: 'フリーワード',
          tag_value: keyword,
          meta: {
            title: preset.title,
          },
        });
      }
    }

    if (preset.filter?.orKeywords) {
      for (const keyword of preset.filter.orKeywords) {
        suggestions.push({
          tag_type: 'orKeywords',
          tag_title: 'ORワード',
          tag_value: keyword,
          meta: {
            title: preset.title,
          },
        });
      }
    }

    if (preset.filter?.notKeywords) {
      for (const keyword of preset.filter.notKeywords) {
        suggestions.push({
          tag_type: 'notKeywords',
          tag_title: '除外ワード',
          tag_value: keyword,
          meta: {
            title: preset.title,
          },
        });
      }
    }

    if (preset.filter?.organizations) {
      for (const organization of preset.filter.organizations) {
        suggestions.push({
          tag_type: 'organizationNameArray',
          tag_title: '発注機関',
          tag_value: organization,
          meta: {
            title: preset.title,
          },
        });
      }
    }

    if (preset.filter?.prefectures) {
      for (const prefecture of preset.filter.prefectures) {
        suggestions.push({
          tag_type: 'prefectures',
          tag_title: '都道府県',
          tag_value: getPrefectureName(prefecture),
          meta: {
            prefectureCode: prefecture.toString(),
            title: preset.title,
          },
        });
      }
    }

    if (preset.filter?.procedureTypeGroups) {
      for (const procedureTypeGroup of preset.filter.procedureTypeGroups) {
        suggestions.push({
          tag_type: 'procedureTypeGroups',
          tag_title: '入札方式',
          tag_value: procedureTypeGroup,
          meta: {
            title: preset.title,
          },
        });
      }
    }

    if (preset.filter?.publicationDateFrom) {
      suggestions.push({
        tag_type: 'publicationDateFrom',
        tag_title: '公告日',
        tag_value: preset.filter?.publicationDateFrom.toString(),
      });
    }

    if (preset.filter?.publicationDateTo) {
      suggestions.push({
        tag_type: 'publicationDateTo',
        tag_title: '公告日',
        tag_value: preset.filter?.publicationDateTo.toString(),
      });
    }

    if (preset.filter?.plannedPriceFrom) {
      suggestions.push({
        tag_type: 'plannedPriceFrom',
        tag_title: '予定価格',
        tag_value: preset.filter?.plannedPriceFrom.toString(),
      });
    }

    if (preset.filter?.plannedPriceTo) {
      suggestions.push({
        tag_type: 'plannedPriceTo',
        tag_title: '予定価格',
        tag_value: preset.filter?.plannedPriceTo.toString(),
      });
    }

    if (preset.filter?.projectSecurityQualifications) {
      for (const security of preset.filter.projectSecurityQualifications) {
        suggestions.push({
          tag_type: 'projectSecurityQualifications',
          tag_title: '情報セキュリティ',
          tag_value: security,
          meta: {
            title: preset.title,
          },
        });
      }
    }

    if (
      preset.filter?.isExperienceRequired !== undefined &&
      preset.filter.isExperienceRequired !== null
    ) {
      suggestions.push({
        tag_type: 'isExperienceRequired',
        tag_title: '事業実績の有無',
        tag_value: preset.filter.isExperienceRequired.toString(),
        meta: {
          title: preset.title,
        },
      });
    }

    if (preset.filter?.isOfficeRequired !== undefined && preset.filter.isOfficeRequired !== null) {
      suggestions.push({
        tag_type: 'isOfficeRequired',
        tag_title: '事業所の有無',
        tag_value: preset.filter.isOfficeRequired.toString(),
        meta: {
          title: preset.title,
        },
      });
    }

    if (preset.filter?.deadlineDaysRemaining) {
      suggestions.push({
        tag_type: 'deadlineDaysRemaining',
        tag_title: '締切日',
        tag_value: preset.filter.deadlineDaysRemaining.toString(),
        meta: {
          title: preset.title,
        },
      });
    }

    if (preset.filter?.participateQualificationIds) {
      for (const id of preset.filter.participateQualificationIds) {
        suggestions.push({
          tag_type: 'participateQualificationIds',
          tag_title: '参加資格',
          tag_value: id.toString(),
          meta: {
            title: preset.title,
          },
        });
      }
    }

    if (preset.filter?.noQualification) {
      suggestions.push({
        tag_type: 'noQualification',
        tag_title: '参加資格なし',
        tag_value: 'true',
        meta: {
          title: preset.title,
        },
      });
    }

    if (preset.filter?.participateQualificationGradeIds) {
      for (const gradeId of preset.filter.participateQualificationGradeIds) {
        suggestions.push({
          tag_type: 'participateQualificationGradeIds',
          tag_title: '参加資格等級',
          tag_value: gradeId.toString(),
          meta: {
            title: preset.title,
          },
        });
      }
    }

    if (preset.filter?.participateQualificationTypes) {
      for (const type of preset.filter.participateQualificationTypes) {
        suggestions.push({
          tag_type: 'participateQualificationTypes',
          tag_title: '参加資格種別',
          tag_value: type,
          meta: {
            title: preset.title,
          },
        });
      }
    }

    if (preset.filter?.participateQualificationPrefectures) {
      for (const prefectureCode of preset.filter.participateQualificationPrefectures) {
        suggestions.push({
          tag_type: 'participateQualificationPrefectures',
          tag_title: '参加資格都道府県',
          tag_value: getPrefectureName(Number(prefectureCode)),
          meta: {
            prefectureCode: prefectureCode,
            title: preset.title,
          },
        });
      }
    }

    if (preset.filter?.tenderOpeningDateFrom) {
      suggestions.push({
        tag_type: 'tenderOpeningDateFrom',
        tag_title: '落札日',
        tag_value: preset.filter?.tenderOpeningDateFrom.toString(),
      });
    }

    if (preset.filter?.tenderOpeningDateTo) {
      suggestions.push({
        tag_type: 'tenderOpeningDateTo',
        tag_title: '落札日',
        tag_value: preset.filter?.tenderOpeningDateTo.toString(),
      });
    }

    if (preset.filter?.useSynonymSearch) {
      suggestions.push({
        tag_type: 'useSynonymSearch',
        tag_title: '類義語検索',
        tag_value: preset.filter?.useSynonymSearch.toString(),
      });
    }

    return {
      tagList: suggestions,
      meta: {
        presetId: preset.id,
      },
    };
  };

  return (
    <SuggestionsList
      title='保存条件'
      headerRightChildren={
        <Button
          variant='ghost'
          className={styles.presetButton}
          onClick={() => {
            onClickPresetListButton();
          }}
        >
          保存条件一覧へ
          <span className='material-symbols-outlined'>chevron_right</span>
        </Button>
      }
      suggestions={searchFilterPresets.map((preset) => {
        return {
          tagList: [
            {
              tag_type: 'search_filter_preset',
              tag_title: '保存条件',
              tag_value: preset.title ?? '',
              meta: {
                preset_id: preset.id ?? 0,
              },
            },
          ],
          selected: !!selectedPresetId && selectedPresetId === preset.id,
        };
      })}
      onClickRow={(suggestion) => {
        const res = searchFilterPresets.find(
          (preset) => preset.id === suggestion[0].meta?.preset_id
        );
        if (res) {
          onAddSuggestions(createSearchTag(res));
        }
      }}
    />
  );
};
