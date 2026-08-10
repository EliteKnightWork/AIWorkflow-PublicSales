'use client';
import { Flex } from '@radix-ui/themes';
import type { Suggestions } from '@/api/generated/models';
import type { SearchTag } from '../../types';
import { SuggestionsList } from '../suggestionsList/SuggestionsList';

type Props = {
  text: string;
  isLoading: boolean;
  suggestions: Suggestions | null;
  onAddSuggestions: (params: SearchTag[]) => void;
};

export const OrganizationSuggestions = ({
  text,
  isLoading,
  suggestions,
  onAddSuggestions,
}: Props) => {
  return (
    <Flex direction='column'>
      <SuggestionsList
        title='発注機関'
        isLoading={isLoading}
        suggestions={
          suggestions?.organizations.map((organization) => {
            return {
              tagList: [
                {
                  tag_type: 'organizationNameArray',
                  tag_title: '発注機関',
                  tag_value: organization.value,
                },
              ],
            };
          }) || []
        }
        onClickRow={(suggestion) => {
          onAddSuggestions(suggestion);
        }}
        noSuggestionsText={
          text.length > 0 ? '発注機関が見つかりませんでした' : 'ORワードを入力してください'
        }
      />
    </Flex>
  );
};
