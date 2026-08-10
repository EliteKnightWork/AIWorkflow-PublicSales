'use client';
import { Box, Button, Flex } from '@radix-ui/themes';
import Image from 'next/image';
import { useState } from 'react';
import { DownloadButton } from '@/components/downloadButton/DownloadButton';
import { LoginButton } from '@/components/loginButton/LoginButton';
import { LogoutButton } from '@/components/loginButton/LogoutButton';
import { MenuButton } from '@/components/menuButton/MenuButton';
import MenuModal from '@/components/menuModal/MenuModal';
import { ToServiceButton } from '@/components/toServiceButton/ToServiceButton';
import { TrialButton } from '@/components/trialButton/TrialButton';
import styles from './styles.module.css';

type Props = {
  isLogin: boolean;
  isMaintenance?: boolean;
};

export function Header({ isLogin, isMaintenance }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Box
        width={'100vw'}
        height={{ lg: '85px', initial: '85px' }}
        px={{ lg: '64px', initial: '16px' }}
        py={{ lg: '20px', initial: '16px' }}
        className={styles.header}
      >
        <Flex>
          <Box className={styles.headerLogo}>
            <Image src='/labid_logo_orange.png' alt='Labid Logo' width={95} height={21} />
          </Box>
          <Flex className={styles.headerMenu}>
            <Button
              variant='ghost'
              className={styles.headerMenuButton}
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
            </Button>
            <Button
              variant='ghost'
              className={styles.headerMenuButton}
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
            </Button>
            <Button
              variant='ghost'
              className={styles.headerMenuButton}
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
            </Button>
            <Button
              variant='ghost'
              className={styles.headerMenuButton}
              onClick={() => {
                window.open('https://journal.labid.jp/', '_blank');
              }}
            >
              Labid Journal
            </Button>
          </Flex>
        </Flex>

        {!isMaintenance &&
          (!isLogin ? (
            <>
              <Box className={styles.headerAuthMenu}>
                <LoginButton />
                <DownloadButton />
                <TrialButton />
              </Box>
              <Box className={styles.headerAuthMenuSp}>
                <TrialButton />
                <MenuButton onClick={() => setIsModalOpen(true)} />
              </Box>
            </>
          ) : (
            <>
              <Box className={styles.headerAuthMenu}>
                <ToServiceButton />
                <LogoutButton />
              </Box>
              <Box className={styles.headerAuthMenuSp}>
                <MenuButton onClick={() => setIsModalOpen(true)} />
              </Box>
            </>
          ))}
      </Box>
      <MenuModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
