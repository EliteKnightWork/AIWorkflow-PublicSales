import * as Popover from '@radix-ui/react-popover';
import { Box } from '@radix-ui/themes';
import { type FC, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './styles.module.css';

export type Option = { id: string; value: string };

type Props = {
  options: Option[];
  selectedId: string | null; // 選択値（id）。非制御にしたい場合は外で useState してください
  onChange: (next: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string; // 該当なし表示文言
  className?: string; // 入力のクラス
  popoverClassName?: string; // ポップオーバーのクラス
};

export const PipelineEditFilterableSelect: FC<Props> = ({
  options,
  selectedId,
  onChange,
  placeholder = '選択...',
  disabled = false,
  emptyText = '該当する項目がありません',
  className,
  popoverClassName,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // input / popover の参照
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerBoxRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState<number | undefined>();

  // Trigger 幅に合わせてポップオーバーの幅を揃える
  useLayoutEffect(() => {
    const el = triggerBoxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setContentWidth(el.offsetWidth);
    });
    ro.observe(el);
    setContentWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  // 開いたらクエリ初期化＆アクティブ解除
  useEffect(() => {
    if (open) {
      // 既定：開いた直後は「空検索」で全件表示（ここを currentLabel にすると“編集して上書き”派に）
      setQuery('');
      setActiveIndex(-1);
      // 次フレームでフォーカス
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, inputRef]);

  // フィルタ済みリスト
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.id.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  // 現在値のラベル
  const selected = options.find((o) => o.id === selectedId) ?? null;

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    // 入力へフォーカスを戻す
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // a11y ids
  const listboxId = useId();
  const activeId =
    activeIndex >= 0 && activeIndex < filtered.length
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Box
          ref={triggerBoxRef}
          onClick={() => !disabled && setOpen(true)}
          className={`${styles.trigger} ${disabled ? styles.triggerDisabled : ''}`}
        >
          <input
            ref={inputRef}
            type='text'
            disabled={disabled}
            value={open ? query : (selected?.value ?? '')}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!open) setOpen(true);
              setActiveIndex(0);
            }}
            placeholder={placeholder}
            role='combobox'
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-activedescendant={open ? activeId : undefined}
            aria-autocomplete='list'
            className={`${styles.input} ${className}`}
          />
          {/* クリアボタン */}
          {selected && !disabled && (
            <button
              type='button'
              aria-label='選択をクリア'
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setQuery('');
                setOpen(false);
                inputRef.current?.focus();
              }}
              className={styles.clearButton}
            >
              <span>クリア</span>
            </button>
          )}
          {/* 開閉インジケータ */}
          <span aria-hidden='true' className={`material-icons ${styles.caretIcon}`}>
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
          className={`${styles.content} ${popoverClassName}`}
        >
          <Box ref={listRef} id={listboxId} aria-label='選択肢' className={styles.list}>
            {filtered.length === 0 ? (
              <div aria-disabled={true} className={styles.empty}>
                {emptyText}
              </div>
            ) : (
              filtered.map((opt, i) => {
                const selectedFlag = opt.id === selectedId;
                const activeFlag = i === activeIndex;
                return (
                  <Box
                    key={opt.id}
                    id={`${listboxId}-option-${i}`}
                    aria-selected={selectedFlag}
                    tabIndex={activeFlag ? 0 : -1}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={(e) => e.preventDefault()} // フォーカス移動防止
                    onClick={() => handleSelect(opt.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(opt.id);
                      }
                    }}
                    className={`${styles.item} ${activeFlag ? styles.itemActive : ''} ${selectedFlag ? styles.itemSelected : ''}`}
                  >
                    {opt.value}
                  </Box>
                );
              })
            )}
          </Box>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
