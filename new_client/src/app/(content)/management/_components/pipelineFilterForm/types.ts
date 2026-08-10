// 未選択時のID
export const UNSELECTED_ID = -2;

// 担当者なしのID
export const NO_ASSIGNED_ID = -1;

// 未選択時のステータス
export const UNSELECTED_STATUS = {
  id: UNSELECTED_ID,
  name: '-',
  order: -1,
};

// 未選択時のメンバー
export const UNSELECTED_MEMBER = {
  id: UNSELECTED_ID,
  name: '-',
  email: '',
};

// 担当者なしのメンバー
export const NO_ASSIGNED_MEMBER = {
  id: NO_ASSIGNED_ID,
  name: '担当者なし',
  email: '',
};
