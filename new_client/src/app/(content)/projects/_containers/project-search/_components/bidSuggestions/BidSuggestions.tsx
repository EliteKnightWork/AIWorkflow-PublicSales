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

export const BidSuggestions = ({ text, isLoading, suggestions, onAddSuggestions }: Props) => {
  return (
    <Flex direction='column'>
      <SuggestionsList
        title='参加企業'
        isLoading={isLoading}
        suggestions={
          suggestions?.bidCompanies.map((bidCompany) => {
            return {
              tagList: [
                {
                  tag_type: 'bidCompanyName',
                  tag_title: '参加企業',
                  tag_value: bidCompany.value,
                },
              ],
            };
          }) || []
        }
        onClickRow={(suggestion) => {
          onAddSuggestions(suggestion);
        }}
        noSuggestionsText={
          text.length > 0 ? '参加企業が見つかりませんでした' : 'ORワードを入力してください'
        }
      />
    </Flex>
  );
};
