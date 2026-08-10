import { Box, Flex, Spinner, Text } from '@radix-ui/themes';
import type { SearchTag, SearchTagRow } from '../../types';
import styles from './styles.module.css';

type Props = {
  title: string;
  suggestions: SearchTagRow[];
  onClickRow: (params: SearchTag[]) => void;
  noSuggestionsText?: string;
  headerRightChildren?: React.ReactNode;
  isLoading?: boolean;
};

export const SuggestionsList = ({
  title,
  suggestions,
  onClickRow,
  noSuggestionsText,
  headerRightChildren,
  isLoading,
}: Props) => {
  return (
    <Flex direction='column' className={styles.suggestionsList}>
      <Box className={styles.titleBox}>
        <Text className={styles.title}>{title}</Text>
        {headerRightChildren}
      </Box>
      {isLoading ? (
        <Box className={styles.loadingBox}>
          <Spinner size={'3'} />
        </Box>
      ) : (
        suggestions.map((suggestion: SearchTagRow) => (
          <Flex
            key={suggestion.tagList
              .map((s) => s.tag_type + s.tag_value + (s.meta ? Object.values(s.meta).join('') : ''))
              .join('-')}
            direction='row'
            align='center'
            className={`${styles.suggestionRow} ${suggestion.selected && styles.selectedSuggestionRow}`}
            onClick={() => {
              onClickRow(suggestion.tagList);
            }}
          >
            <span className='material-icons-outlined' translate='no' aria-hidden='true'>
              search
            </span>

            <Box className={styles.suggestionTextRow}>
              {suggestion.tagList.map((s) => (
                <Box key={s.tag_type + s.tag_value} className={styles.suggestionTextChip}>
                  <Text className={styles.suggestionText}>
                    {s.tag_title}: {s.tag_value}
                  </Text>
                </Box>
              ))}
            </Box>
            <span className='material-icons-outlined' translate='no' aria-hidden='true'>
              north_west
            </span>
          </Flex>
        ))
      )}

      {!isLoading && suggestions.length === 0 && (
        <Box className={styles.noSuggestionsTextBox}>
          <Text>{noSuggestionsText}</Text>
        </Box>
      )}
    </Flex>
  );
};
