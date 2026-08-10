'use client';
import { Box, Flex, Separator } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getSuggestions } from '@/api/generated/endpoints/suggestions';
import {
  GetSuggestionsTypesItem,
  type SearchBidCompaniesParams,
  type Suggestions as SuggestionType,
} from '@/api/generated/models';
import Suggestions from '@/app/_components/suggestions/Suggestions';
import FilterClearButton from '@/components/filterClearButton/FilterClearButton';
import { useBidCompanyList } from '../../_context/bidConpanyListContext';
import { SuggestionChipList } from './_components/suggestionChipList/SuggestionChipList';
import { SuggestionsList } from './_components/suggestionsList/SuggestionsList';
import type { SearchInputChip } from './model';
import styles from './styles.module.css';

type Props = {
  searchParams: SearchBidCompaniesParams;
};

export default function BidCompanySearchPresentational({ searchParams }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionType | null>(null);
  const [searchBidCompanyParams, setSearchBidCompanyParams] =
    useState<SearchBidCompaniesParams>(searchParams);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { setLoading } = useBidCompanyList();
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
        types: [GetSuggestionsTypesItem.bidCompanies],
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
    const convertBidCompanyName = (bidCompanyNames?: string[]): SearchInputChip[] => {
      if (!bidCompanyNames) {
        return [];
      }
      return bidCompanyNames.map((o: string) => {
        return {
          type: 'keywords',
          keyName: '参加企業',
          value: o,
          displayValue: o,
        };
      });
    };

    return convertBidCompanyName(searchBidCompanyParams?.keywords || []);
  };

  const convertToSearchParams = (chips: SearchInputChip[]) => {
    const params: SearchBidCompaniesParams = {};

    const groupedChips = chips.reduce(
      (acc, chip) => {
        if (!acc[chip.type]) {
          acc[chip.type] = [];
        }
        acc[chip.type].push(chip.value);
        return acc;
      },
      {} as Record<keyof SearchBidCompaniesParams, string[]>
    );

    // SearchBidCompaniesParamsに変換
    for (const [type, values] of Object.entries(groupedChips)) {
      switch (type) {
        case 'keywords':
          params.keywords = values;
          break;
      }
    }

    return params;
  };

  const searchBidCompany = () => {
    const updatedParams = { ...searchBidCompanyParams, page: 1 };
    if (inputValue.length > 0) {
      if (updatedParams.keywords && updatedParams.keywords?.length > 0) {
        updatedParams.keywords = [...updatedParams.keywords, inputValue];
      } else {
        updatedParams.keywords = [inputValue];
      }
    }

    setSearchBidCompanyParams(updatedParams);

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
    router.push(`/bidCompanies?${params}`);
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
              setSearchBidCompanyParams(
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
              placeholder='企業名を入力'
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  searchBidCompany();
                } else if (e.key === 'Backspace' && inputValue.length === 0) {
                  // 一番後ろのchipを削除する
                  const chips = convertToSearchInputChip();
                  const lastChip = chips[chips.length - 1];
                  setSearchBidCompanyParams(
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
            {searchBidCompanyParams?.keywords && searchBidCompanyParams?.keywords.length > 0 && (
              <FilterClearButton
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchBidCompanyParams({});
                }}
              />
            )}
          </Flex>
        </Box>
        <Box
          className={styles.suggestionBox}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter') {
              searchBidCompany();
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
                    title='参加企業'
                    isLoading={isLoading}
                    noSuggestionsText={
                      inputValue.length > 0
                        ? '参加企業が見つかりませんでした'
                        : 'ORワードを入力してください'
                    }
                    suggestions={
                      suggestions
                        ? suggestions.bidCompanies.map((bidCompany) => {
                            return {
                              tagList: [
                                {
                                  tag_type: 'bidCompanyName',
                                  tag_title: '参加企業',
                                  tag_value: bidCompany.value,
                                },
                              ],
                            };
                          })
                        : []
                    }
                    onClickRow={(suggestion) => {
                      const addWords: string[] = [];
                      if (searchBidCompanyParams.keywords) {
                        const keywords = searchBidCompanyParams.keywords;
                        for (const s of suggestion) {
                          if (!keywords?.find((k) => k === s.tag_value)) {
                            addWords.push(s.tag_value);
                          }
                        }
                        setSearchBidCompanyParams({
                          ...searchBidCompanyParams,
                          keywords: [...keywords, ...addWords],
                        });
                      } else {
                        addWords.push(...suggestion.map((s) => s.tag_value));
                        setSearchBidCompanyParams({
                          ...searchBidCompanyParams,
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
