import * as Dialog from '@radix-ui/react-dialog';
import { FreeDemoCta } from '@/components/freeDemoCta/FreeDemoCta';
import { useCta } from '@/context/CtaContext';
import styles from './styles.module.css';

export default function CtaDialog() {
  const { cta, closeCta } = useCta();

  if (!cta) return null;

  return (
    <Dialog.Root open={cta} onOpenChange={() => {}}>
      <Dialog.Portal forceMount>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content}>
          <FreeDemoCta onClose={closeCta} isDialog />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
