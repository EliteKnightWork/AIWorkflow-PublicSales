import { Box, Text } from '@radix-ui/themes';
import Image from 'next/image';
import styles from './styles.module.css';

const Achievements = () => {
  return (
    <Box className={styles.achievements}>
      <Box className={styles.header}>
        <Image src='/top/topic.svg' alt='導入実績' width={14} height={14} />
        <Text>導入実績</Text>
      </Box>
      <Box className={styles.imageList}>
        <Box className={styles.image}>
          <Image
            src='/top/implementation/neo_marketing.png'
            alt='導入実績'
            fill
            objectFit='contain'
          />
        </Box>
        <Box className={styles.image}>
          <Image src='/top/implementation/trc.png' alt='導入実績' fill objectFit='contain' />
        </Box>
        <Box className={styles.image}>
          <Image src='/top/implementation/medcare.png' alt='導入実績' fill objectFit='contain' />
        </Box>
        <Box className={styles.image}>
          <Image src='/top/implementation/welights.png' alt='導入実績' fill objectFit='contain' />
        </Box>
      </Box>
    </Box>
  );
};

export default Achievements;
