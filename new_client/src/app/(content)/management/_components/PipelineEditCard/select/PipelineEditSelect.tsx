'use client';

import * as Popover from '@radix-ui/react-popover';
import { Box } from '@radix-ui/themes';
import { type FC, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './styles.module.css';

export type Option = { id: string; value: string };

type Props = {
  options: Option[];
  selectedId: string | null;
  onChange: (next: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string;
  popoverClassName?: string;
};

export const PipelineEditSelect: FC<Props> = ({
  options,
  selectedId,
  onChange,
  placeholder = '選択...',
  disabled = false,
  emptyText = '該当する項目がありません',
  popoverClassName,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState<number | undefined>();

  useLayoutEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContentWidth(el.offsetWidth));
    ro.observe(el);
    setContentWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const selected = useMemo(
    () => options.find((o) => o.id === selectedId) ?? null,
    [options, selectedId]
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Box
          ref={triggerRef}
          onKeyDown={(e) => e.preventDefault()}
          onClick={() => !disabled && setOpen(true)}
          className={`${styles.trigger} ${disabled ? styles.triggerDisabled : ''}`}
        >
          <input
            type='text'
            readOnly
            disabled={disabled}
            value={selected?.value ?? ''}
            placeholder={placeholder}
            className={styles.input}
            style={{ cursor: 'pointer' }}
          />
          {/* クリアボタン */}
          {selected && !disabled && (
            <button
              type='button'
              aria-label='選択をクリア'
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setOpen(false);
              }}
              className={styles.clearButton}
            >
              <span>クリア</span>
            </button>
          )}
          <span aria-hidden='true' className={`material-icons ${styles.caret}`}>
            keyboard_arrow_down
          </span>
        </Box>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side='bottom'
          align='start'
          sideOffset={6}
          avoidCollisions={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{ width: contentWidth ?? 320 }}
          className={`${styles.content} ${popoverClassName || ''}`}
        >
          <ul aria-label='選択肢' className={styles.list}>
            {options.length === 0 ? (
              <li aria-disabled className={styles.empty}>
                {emptyText}
              </li>
            ) : (
              options.map((opt) => {
                const isSelected = opt.id === selectedId;
                return (
                  <li
                    key={opt.id}
                    className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                    onMouseDown={(e) => e.preventDefault()} // keep focus
                    onKeyDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                  >
                    {opt.value}
                  </li>
                );
              })
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default PipelineEditSelect;
