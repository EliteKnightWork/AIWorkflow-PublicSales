'use client';
import { Box, Flex, Separator } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getSuggestions } from '@/api/generated/endpoints/suggestions';
import {
  GetSuggestionsTypesItem,
  type SearchOrganizationsParams,
  type Suggestions as SuggestionType,
} from '@/api/generated/models';
import Suggestions from '@/app/_components/suggestions/Suggestions';
import FilterClearButton from '@/components/filterClearButton/FilterClearButton';
import { useOrganizationList } from '../../_context/organizationListContext';
import { SuggestionChipList } from './_components/suggestionChipList/SuggestionChipList';
import { SuggestionsList } from './_components/suggestionsList/SuggestionsList';
import type { SearchInputChip } from './model';
import styles from './styles.module.css';

type Props = {
  searchParams: SearchOrganizationsParams;
};

export default function OrganizationSearchPresentational({ searchParams }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionType | null>(null);
  const [searchOrganizationParams, setSearchOrganizationParams] =
    useState<SearchOrganizationsParams>(searchParams);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { setLoading } = useOrganizationList();
  const router = useRouter();

  const handleClickOutside = (e: MouseEvent) => {
    if (
      !inputRef.current?.contains(e.target as Node) &&
      !searchRef.current?.contains(e.target as Node)
    ) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length === 0) {
        setSuggestions(null);
        return;
      }
      setIsLoading(true);
      const data = await getSuggestions({
        keyword: inputValue,
        limit: 10,
        types: [GetSuggestionsTypesItem.organizations],
      });
      setSuggestions(data.suggestions || null);
      setIsLoading(false);
    };

    const debounceTimeout = setTimeout(() => {
      fetchSuggestions();
    }, 500);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [inputValue]);

  const convertToSearchInputChip = () => {
    const convertOrganizationName = (organizationNames?: string[]): SearchInputChip[] => {
      if (!organizationNames) {
        return [];
      }
      return organizationNames.map((o) => {
        return {
          type: 'keywords',
          keyName: '発注機関',
          value: o,
          displayValue: o,
        };
      });
    };

    return convertOrganizationName(searchOrganizationParams?.keywords || []);
  };

  const convertToSearchParams = (chips: SearchInputChip[]) => {
    const params: SearchOrganizationsParams = {};

    // typeごとにグループ化
    const groupedChips = chips.reduce(
      (acc, chip) => {
        if (!acc[chip.type]) {
          acc[chip.type] = [];
        }
        acc[chip.type].push(chip.value);
        return acc;
      },
      {} as Record<keyof SearchOrganizationsParams, string[]>
    );

    // SearchProjectsParamsに変換
    for (const [type, values] of Object.entries(groupedChips)) {
      switch (type) {
        case 'keywords':
          params.keywords = values;
          break;
      }
    }

    return params;
  };

  const searchOrganization = () => {
    const updatedParams = { ...searchOrganizationParams, page: 1 };
    if (inputValue.length > 0) {
      if (updatedParams.keywords && updatedParams.keywords?.length > 0) {
        updatedParams.keywords = [...updatedParams.keywords, inputValue];
      } else {
        updatedParams.keywords = [inputValue];
      }
    }

    setSearchOrganizationParams(updatedParams);

    const params = new URLSearchParams();
    if (updatedParams.keywords) {
      params.set('keywords', updatedParams.keywords.join(','));
    }
    if (updatedParams.page) {
      params.set('page', updatedParams.page.toString());
    }
    setInputValue('');
    setSuggestions(null);
    setShowSuggestions(false);
    setLoading(true);
    router.push(`/organizations?${params}`);
  };

  return (
    <Box className={styles.searchContainer} ref={searchRef}>
      <Box style={{ position: 'relative', width: '100%' }}>
        <Box className={styles.searchInputBox}>
          <span className='material-icons-outlined' translate='no' aria-hidden='true'>
            search
          </span>
          <SuggestionChipList
            inputChips={convertToSearchInputChip()}
            onClickClose={(chip) => {
              setSearchOrganizationParams(
                convertToSearchParams(
                  convertToSearchInputChip().filter(
                    (c) => c.type !== chip.type || c.value !== chip.value
                  )
                )
              );
              inputRef.current?.focus();
            }}
          >
            <input
              type='text'
              ref={inputRef}
              className={styles.searchInput}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder='発注機関名'
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  searchOrganization();
                } else if (e.key === 'Backspace' && inputValue.length === 0) {
                  // 一番後ろのchipを削除する
                  const chips = convertToSearchInputChip();
                  const lastChip = chips[chips.length - 1];
                  setSearchOrganizationParams(
                    convertToSearchParams(
                      chips.filter((c) => c.type !== lastChip.type || c.value !== lastChip.value)
                    )
                  );
                }
              }}
            />
          </SuggestionChipList>
          <Flex gap='2' align={'center'}>
            <Box width='4px' height='100%'>
              <Separator orientation='vertical' className={styles.projectInputSeparator} />
            </Box>
            {searchOrganizationParams?.keywords &&
              searchOrganizationParams?.keywords.length > 0 && (
                <FilterClearButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchOrganizationParams({});
                  }}
                />
              )}
          </Flex>
        </Box>
        <Box
          className={styles.suggestionBox}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter') {
              searchOrganization();
            } else if (e.key === 'Backspace') {
              inputRef.current?.focus();
            } else if (e.key !== 'Tab' && e.key.length === 1) {
              inputRef.current?.focus();
            }
          }}
        >
          {showSuggestions && (
            <Suggestions
              element={
                <Flex
                  direction={'column'}
                  style={{ width: '100%', maxHeight: '70vh', overflowY: 'auto' }}
                >
                  <SuggestionsList
                    title='発注機関'
                    isLoading={isLoading}
                    noSuggestionsText={
                      inputValue.length > 0
                        ? '発注機関が見つかりませんでした'
                        : 'ORワードを入力してください'
                    }
                    suggestions={
                      suggestions
                        ? suggestions.organizations.map((organization) => {
                            return {
                              tagList: [
                                {
                                  tag_type: 'organizationNameArray',
                                  tag_title: '発注機関',
                                  tag_value: organization.value,
                                },
                              ],
                            };
                          })
                        : []
                    }
                    onClickRow={(suggestion) => {
                      const addWords: string[] = [];
                      if (searchOrganizationParams.keywords) {
                        const keywords = searchOrganizationParams.keywords;
                        for (const s of suggestion) {
                          if (!keywords?.find((k) => k === s.tag_value)) {
                            addWords.push(s.tag_value);
                          }
                        }
                        setSearchOrganizationParams({
                          ...searchOrganizationParams,
                          keywords: [...keywords, ...addWords],
                        });
                      } else {
                        addWords.push(...suggestion.map((s) => s.tag_value));
                        setSearchOrganizationParams({
                          ...searchOrganizationParams,
                          keywords: suggestion.map((s) => s.tag_value),
                        });
                      }
                      setInputValue('');
                    }}
                  />
                </Flex>
              }
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
