export const DATE_REGEXP = /^(\d{4})-(\d{2})-(\d{2})$/;

export const isPastDate = (date: string) => {
  const targetDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return targetDate < today;
};

export const convertDateToYYYYMMDD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateJa = (dateString: string): string => {
  const s = DATE_REGEXP.exec(dateString);
  if (!s) return dateString; // 想定外フォーマットはそのまま表示
  const y = Number(s[1]);
  const m = Number(s[2]);
  const d = Number(s[3]);
  return `${y}年${m}月${d}日`;
};

export const formatDateSlash = (dateString: string): string => {
  const s = DATE_REGEXP.exec(dateString);
  if (!s) return dateString; // 想定外フォーマットはそのまま表示
  const y = Number(s[1]);
  const m = Number(s[2]);
  const d = Number(s[3]);
  // YYYY/MM/DD の形式にパディング
  return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
};
