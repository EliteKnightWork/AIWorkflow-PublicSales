'use client';

import * as Toast from '@radix-ui/react-toast';
import { Flex, IconButton } from '@radix-ui/themes';
import { createPortal } from 'react-dom';
import { useToast } from '../../context/ToastContext';
import styles from './styles.module.css';

export default function AppToast() {
  const { toasts, dequeueToast } = useToast();

  if (toasts.length === 0) return null;

  const topRightToasts = toasts.filter((t) => t.position !== 'bottom-center');
  const bottomCenterToasts = toasts.filter((t) => t.position === 'bottom-center');

  const toastContent = (
    <>
      <Toast.Provider swipeDirection='left' duration={5000}>
        {topRightToasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            className={styles.ToastRoot}
            open={true}
            onOpenChange={() => dequeueToast(toast.id)}
          >
            <Flex direction='row' align='center'>
              <IconButton variant='outline' size='2' onClick={() => dequeueToast(toast.id)}>
                <span
                  className={`material-icons ${styles.CloseButton}`}
                  translate='no'
                  aria-hidden='true'
                >
                  close
                </span>
              </IconButton>
              <Toast.Title className={styles.ToastTitle}>{toast.message}</Toast.Title>
            </Flex>
          </Toast.Root>
        ))}
        <Toast.Viewport className={styles.ToastViewport} />
      </Toast.Provider>
      {bottomCenterToasts.length > 0 && (
        <Toast.Provider swipeDirection='left' duration={5000}>
          {bottomCenterToasts.map((toast) => (
            <Toast.Root
              key={toast.id}
              className={styles.ToastRoot}
              open={true}
              onOpenChange={() => dequeueToast(toast.id)}
            >
              <Flex direction='row' align='center'>
                <IconButton variant='outline' size='2' onClick={() => dequeueToast(toast.id)}>
                  <span
                    className={`material-icons ${styles.CloseButton}`}
                    translate='no'
                    aria-hidden='true'
                  >
                    close
                  </span>
                </IconButton>
                <Toast.Title className={styles.ToastTitle}>{toast.message}</Toast.Title>
              </Flex>
            </Toast.Root>
          ))}
          <Toast.Viewport className={styles.ToastViewportBottomCenter} />
        </Toast.Provider>
      )}
    </>
  );

  return typeof document !== 'undefined' ? createPortal(toastContent, document.body) : null;
}
