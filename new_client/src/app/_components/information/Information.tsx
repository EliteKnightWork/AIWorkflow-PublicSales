import { Box, Flex, Text } from '@radix-ui/themes';
import Image from 'next/image';
import { INFORMATION_ATTACHMENT_LIST, INFORMATION_SEMINAR_LIST } from '@/constants';
import styles from './styles.module.css';

const Information = () => {
  return (
    <Box className={styles.informationContainer}>
      <Box className={styles.informationContent}>
        <Box className={styles.header}>
          <Text className={styles.title}>セミナー</Text>
          <a href={INFORMATION_SEMINAR_LIST} target='_blank' rel='noreferrer'>
            <Flex direction='row'>
              <Text>セミナー一覧を見る</Text>
              <span className='material-symbols-outlined'>keyboard_arrow_right</span>
            </Flex>
          </a>
        </Box>

        <a
          href='https://journal.labid.jp/seminar/2024/10-archive?utm_source=labid_journal&utm_medium=referral&utm_campaign=service_under_banner'
          target='_blank'
          rel='noreferrer'
          className={styles.information}
        >
          <Flex direction='row'>
            <Box className={styles.informationImage}>
              <Image src='/top/seminar1.png' alt='セミナー1サムネイル' fill objectFit='contain' />
            </Box>
            <Flex className={styles.informationDescription}>
              <Text>
                【アーカイブ配信】
                <br />
                AIを活用してプロポーザルの成果向上と業務効率化を実現する「入札情報の検索方法」とは？
              </Text>
            </Flex>
          </Flex>
        </a>

        <a
          href='https://journal.labid.jp/seminar/2024/07-archive?utm_source=labid_journal&utm_medium=referral&utm_campaign=service_under_banner'
          target='_blank'
          rel='noreferrer'
          className={styles.information}
        >
          <Flex direction='row'>
            <Box className={styles.informationImage}>
              <Image src='/top/seminar2.png' alt='セミナー2サムネイル' fill objectFit='contain' />
            </Box>
            <Flex className={styles.informationDescription}>
              <Text>
                【アーカイブ配信】
                <br />
                公共営業経験者が解説！
                <br />
                プロポーザルで勝率を上げるために知っておくべきポイントと対策セミナー
              </Text>
            </Flex>
          </Flex>
        </a>

        <a
          href='https://journal.labid.jp/seminar/2024/06-archive?utm_source=labid_journal&utm_medium=referral&utm_campaign=service_under_banner'
          target='_blank'
          rel='noreferrer'
          className={styles.information}
        >
          <Flex direction='row'>
            <Box className={styles.informationImage}>
              <Image src='/top/seminar3.png' alt='セミナー3サムネイル' fill objectFit='contain' />
            </Box>
            <Flex className={styles.informationDescription}>
              <Text>
                【アーカイブ配信】
                <br />
                落札情報の見方と活用方法徹底解説セミナー
              </Text>
            </Flex>
          </Flex>
        </a>
      </Box>

      <Flex direction='column' className={styles.informationContent}>
        <Flex direction='row' justify='between' align='end' className={styles.header}>
          <Text className={styles.title}>お役立ち資料</Text>
          <a href={INFORMATION_ATTACHMENT_LIST} target='_blank' rel='noreferrer'>
            <Flex direction='row'>
              <Text>資料一覧を見る</Text>
              <span className='material-symbols-outlined'>keyboard_arrow_right</span>
            </Flex>
          </a>
        </Flex>

        <a
          href='https://journal.labid.jp/whitepaper/bid-introduction?utm_source=labid_journal&utm_medium=referral&utm_campaign=service_under_banner'
          target='_blank'
          rel='noreferrer'
          className={styles.information}
        >
          <Flex direction='row'>
            <Box className={styles.informationImage}>
              <Image
                src='/top/attachment1.png'
                alt='お役立ち資料1サムネイル'
                fill
                objectFit='contain'
              />
            </Box>
            <Flex className={styles.informationDescription}>
              <Text>
                【初めての入札マスターガイド】入札における売上獲得の ポイントや仕組みを解説！
              </Text>
            </Flex>
          </Flex>
        </a>

        <a
          href='https://journal.labid.jp/whitepaper/proposal?utm_source=labid_journal&utm_medium=referral&utm_campaign=service_under_banner'
          target='_blank'
          rel='noreferrer'
          className={styles.information}
        >
          <Flex direction='row'>
            <Box className={styles.informationImage}>
              <Image
                src='/top/attachment2.png'
                alt='お役立ち資料2サムネイル'
                fill
                objectFit='contain'
              />
            </Box>
            <Flex className={styles.informationDescription}>
              <Text>プロポーザルの特徴から課題・解決策を徹底解説</Text>
            </Flex>
          </Flex>
        </a>

        <a
          href='https://journal.labid.jp/whitepaper/kaisatsu?utm_source=labid_journal&utm_medium=referral&utm_campaign=service_under_banner'
          target='_blank'
          rel='noreferrer'
          className={styles.information}
        >
          <Flex direction='row'>
            <Box className={styles.informationImage}>
              <Image
                src='/top/attachment3.png'
                alt='お役立ち資料3サムネイル'
                fill
                objectFit='contain'
              />
            </Box>
            <Flex className={styles.informationDescription}>
              <Text>入札参加資格より重要？落札情報の見方と活用方法を徹底解説</Text>
            </Flex>
          </Flex>
        </a>
      </Flex>
    </Box>
  );
};

export default Information;
