'use client';
import { Box, Link, Text } from '@radix-ui/themes';
import Image from 'next/image';
import styles from './styles.module.css';

export function Footer() {
  return (
    <Box className={styles.footerOutline}>
      <Box className={styles.footer}>
        <Image src='/labid_logo_orange.png' alt='Labid' width={174} height={48} />
        <Box className={styles.footerMenu}>
          <Link
            className={styles.footerMenuButton}
            onClick={() => {
              const form = document.getElementById('service');
              if (form) {
                form.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.open('https://labid.jp/#service');
              }
            }}
          >
            Labidとは
          </Link>
          <Link
            className={styles.footerMenuButton}
            onClick={() => {
              const form = document.getElementById('problem');
              if (form) {
                form.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.open('https://labid.jp/#problem');
              }
            }}
          >
            お悩み
          </Link>
          <Link
            className={styles.footerMenuButton}
            onClick={() => {
              const form = document.getElementById('solution');
              if (form) {
                form.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.open('https://labid.jp/#solution');
              }
            }}
          >
            ソリューション
          </Link>
          <Link
            className={styles.footerMenuButton}
            onClick={() => {
              window.open('https://journal.labid.jp/', '_blank');
            }}
          >
            Labid Journal
          </Link>
          <Link
            className={styles.footerMenuButton}
            onClick={() => {
              window.open('https://nehan6.com/', '_blank');
            }}
          >
            運営会社
          </Link>
        </Box>
      </Box>
      <Text className={styles.nehanInc}>© Nehan Inc.</Text>
    </Box>
  );
}
