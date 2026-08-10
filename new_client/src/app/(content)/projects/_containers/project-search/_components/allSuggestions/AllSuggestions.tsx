'use client';
import { Flex } from '@radix-ui/themes';
import type { SearchFilterPreset, Suggestions } from '@/api/generated/models';
import { getPrefectureCode } from '@/utils/regionUtils';
import type { SearchTag } from '../../types';
import { SearchFilterPresetSuggestions } from '../searchFilterPresetSuggestions/SearchFilterPresetSuggestions';
import { SuggestionsList } from '../suggestionsList/SuggestionsList';

type Props = {
  text: string;
  isLoading: boolean;
  suggestions: Suggestions | null;
  searchFilterPresets: SearchFilterPreset[];
  onAddSuggestions: (params: SearchTag[], overwrite?: boolean, searchPresetId?: string) => void;
  onSelectedPreset: (presetId: number) => void;
  onClickPresetListButton: () => void;
  isLogin: boolean;
  selectedPresetId?: number;
};

export const AllSuggestions = ({
  text,
  isLoading,
  suggestions,
  searchFilterPresets,
  onAddSuggestions,
  onClickPresetListButton,
  onSelectedPreset,
  isLogin,
  selectedPresetId,
}: Props) => {
  return (
    <Flex direction='column'>
      {text.length > 0 && (
        <SuggestionsList
          title='ORワード'
          suggestions={[
            {
              tagList: text
                .split(/\s+/)
                .filter((t) => t.trim() !== '')
                .map((a) => ({
                  tag_type: 'orKeywords',
                  tag_title: 'ORワード',
                  tag_value: a,
                })),
            },
          ]}
          onClickRow={(suggestion) => {
            onAddSuggestions(suggestion);
          }}
        />
      )}

      {suggestions && suggestions.prefectures.length > 0 && (
        <SuggestionsList
          title='都道府県'
          isLoading={isLoading}
          suggestions={suggestions.prefectures.map((prefecture) => {
            return {
              tagList: [
                {
                  tag_type: 'prefectures',
                  tag_title: '都道府県',
                  tag_value: prefecture.value,
                  meta: {
                    prefectureCode: getPrefectureCode(prefecture.value)?.toString(),
                  },
                },
              ],
            };
          })}
          onClickRow={(suggestion) => {
            onAddSuggestions(suggestion);
          }}
        />
      )}
      {suggestions && suggestions.organizations.length > 0 && (
        <SuggestionsList
          title='発注機関'
          isLoading={isLoading}
          suggestions={suggestions.organizations.map((organization) => {
            return {
              tagList: [
                {
                  tag_type: 'organizationNameArray',
                  tag_title: '発注機関',
                  tag_value: organization.value,
                },
              ],
            };
          })}
          onClickRow={(suggestion) => {
            onAddSuggestions(suggestion);
          }}
        />
      )}
      {suggestions && suggestions.bidCompanies.length > 0 && (
        <SuggestionsList
          title='参加企業'
          isLoading={isLoading}
          suggestions={suggestions.bidCompanies.map((bidCompany) => {
            return {
              tagList: [
                {
                  tag_type: 'bidCompanyName',
                  tag_title: '参加企業',
                  tag_value: bidCompany.value,
                },
              ],
            };
          })}
          onClickRow={(suggestion) => {
            onAddSuggestions(suggestion);
          }}
        />
      )}
      {isLogin && (
        <SearchFilterPresetSuggestions
          searchFilterPresets={searchFilterPresets}
          onAddSuggestions={(preset) => {
            onSelectedPreset(preset.meta?.presetId as number);
            onAddSuggestions(
              preset.tagList,
              true,
              preset.tagList.length > 0 ? (preset.meta?.presetId as string) : undefined
            );
          }}
          selectedPresetId={selectedPresetId}
          onClickPresetListButton={() => {
            onClickPresetListButton();
          }}
        />
      )}
    </Flex>
  );
};
