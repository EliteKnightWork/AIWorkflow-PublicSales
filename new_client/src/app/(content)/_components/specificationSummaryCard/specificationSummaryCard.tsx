'use client';
import { useUser } from '@auth0/nextjs-auth0';
import { Box, Flex, Heading } from '@radix-ui/themes';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { summarizeProject } from '@/api/generated/endpoints/project-summary-usages';
import LoadingSpinner from '@/components/loadingSpinner/LoadingSpinner';
import { RoundButton } from '@/components/roundButton/RoundeButton';
import { useCta } from '@/context/CtaContext';
import parentStyles from '../styles.module.css';
import styles from './styles.module.css';

type Props = {
  project_id: string;
  summary: string | undefined;
};

const SummaryErrorType = {
  limited: 'limited',
  text_empty: 'text_empty',
  other: 'other',
} as const;

type SummaryErrorType = (typeof SummaryErrorType)[keyof typeof SummaryErrorType];

export default function SpecificationSummaryCard(props: Props) {
  const [isExpand, setIsExpand] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<SummaryErrorType | undefined>(undefined);
  const [summary, setSummary] = useState('');
  const [isFirstRender, setIsFirstRender] = useState(true);
  const { user } = useUser();
  const { openCta } = useCta();

  useEffect(() => {
    if (props.summary) {
      setSummary(props.summary);
    }
  }, [props.summary]);

  useEffect(() => {
    setIsFirstRender(false);
  }, []);

  const onClickSummarizeButton = async () => {
    setIsLoading(true);
    try {
      const res = await summarizeProject(props.project_id);
      setSummary(res.summary ?? '');
    } catch (error: any) {
      if (error.status === 429) {
        setSummaryError(SummaryErrorType.limited);
      } else if (error.status === 400) {
        setSummaryError(SummaryErrorType.text_empty);
      } else {
        setSummaryError(SummaryErrorType.other);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex direction='column'>
      <Flex
        direction='row'
        justify='between'
        align='center'
        className={`${parentStyles.title} ${!isExpand && parentStyles.titleNotExpand}`}
        onClick={() => setIsExpand(!isExpand)}
      >
        <Flex direction='row' justify='center' gap='2'>
          <span
            className='material-icons'
            translate='no'
            aria-hidden='true'
            style={{ color: 'var(--app-orange-main)' }}
          >
            join_inner
          </span>
          <Heading as='h2' size='4' weight='bold'>
            仕様書のサマリ
          </Heading>
        </Flex>
        <Box className={parentStyles.expandIcon}>
          <span className='material-symbols-outlined'>
            {isExpand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
        </Box>
      </Flex>
      <AnimatePresence>
        {isExpand && (
          <motion.div
            initial={isFirstRender ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <Box className={styles.body}>
              {summary.length > 0 ? (
                summary.split('\n').map((line, index) => (
                  <Heading
                    key={`${line}-${index.toString()}`}
                    as='h3'
                    size='3'
                    style={{ fontWeight: 'normal' }}
                  >
                    {line}
                    <br />
                  </Heading>
                ))
              ) : (
                <Box className={`messageBox ${styles.messageBox}`}>
                  {isLoading ? (
                    <Box className={styles.messageText}>
                      仕様書を読むのって本当に大変ですよね
                      <br />
                      今読み込んでいます
                      <LoadingSpinner />
                    </Box>
                  ) : summaryError ? (
                    <Box className={styles.messageText}>
                      {summaryError === SummaryErrorType.limited ? (
                        <>
                          たくさんのご利用ありがとうございます！
                          <br />
                          残念ながら要約回数の上限に達しました😢
                          <br />
                          追加する場合はお問い合わせフォームよりご連絡ください
                        </>
                      ) : summaryError === SummaryErrorType.text_empty ? (
                        <>
                          すみません、要約するほど文量がないかもしれません...
                          <br />
                          直接書類を確認してみてください🙇
                        </>
                      ) : (
                        <>
                          <Flex style={{ marginBottom: 16 }} justify={'center'} align={'center'}>
                            すみません、要約中にエラーが発生しました。
                            <br />
                            少し時間をおいて、再度要約ボタンを押してみてください。
                            <br />
                            エラーが続く場合は、お問い合わせください🙇
                          </Flex>
                          <RoundButton
                            hideIcon
                            text='資料を要約する'
                            buttonClassName={`${styles.messageButton} white`}
                            buttonBoxClassName={styles.messageButtonBox}
                            onClick={() => {
                              onClickSummarizeButton();
                            }}
                          />
                        </>
                      )}
                    </Box>
                  ) : (
                    <Box>
                      <RoundButton
                        hideIcon
                        text='資料を要約する'
                        buttonClassName={`${styles.messageButton} white`}
                        buttonBoxClassName={styles.messageButtonBox}
                        onClick={() => {
                          if (!user) {
                            openCta();
                            return;
                          }
                          onClickSummarizeButton();
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Flex>
  );
}
