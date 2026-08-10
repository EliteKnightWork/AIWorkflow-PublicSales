import type { HTMLAttributeAnchorTarget, ReactElement } from 'react';

export type ItemType = {
  id: string;
  label: string;
  link?: string;
  target?: HTMLAttributeAnchorTarget;
  icon: ReactElement;
  helpMessageTitle?: string;
  helpMessage?: string;
  showForUnauthenticated: boolean;
  isExpand?: boolean;
  isSelected?: boolean;
  hidden?: boolean;
  onClick?: () => void;
};
