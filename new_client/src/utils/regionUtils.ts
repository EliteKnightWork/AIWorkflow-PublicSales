export type Prefecture = {
  id: string;
  name: string;
};

export const prefectures: { [key: number]: string } = {
  1: '北海道',
  2: '青森県',
  3: '岩手県',
  4: '宮城県',
  5: '秋田県',
  6: '山形県',
  7: '福島県',
  8: '茨城県',
  9: '栃木県',
  10: '群馬県',
  11: '埼玉県',
  12: '千葉県',
  13: '東京都',
  14: '神奈川県',
  15: '新潟県',
  16: '富山県',
  17: '石川県',
  18: '福井県',
  19: '山梨県',
  20: '長野県',
  21: '岐阜県',
  22: '静岡県',
  23: '愛知県',
  24: '三重県',
  25: '滋賀県',
  26: '京都府',
  27: '大阪府',
  28: '兵庫県',
  29: '奈良県',
  30: '和歌山県',
  31: '鳥取県',
  32: '島根県',
  33: '岡山県',
  34: '広島県',
  35: '山口県',
  36: '徳島県',
  37: '香川県',
  38: '愛媛県',
  39: '高知県',
  40: '福岡県',
  41: '佐賀県',
  42: '長崎県',
  43: '熊本県',
  44: '大分県',
  45: '宮崎県',
  46: '鹿児島県',
  47: '沖縄県',
};

export type Region = {
  name: string;
  prefectures: Prefecture[];
};

// prefecturesの順番は画面の表示順に合わせて入れ替えているためidでのソートになっていない
export const prefecturesWithRegionList = [
  {
    name: '北海道・東北',
    prefectures: [
      { id: '1', name: '北海道' },
      { id: '2', name: '青森県' },
      { id: '3', name: '岩手県' },
      { id: '4', name: '宮城県' },
      { id: '5', name: '秋田県' },
      { id: '6', name: '山形県' },
      { id: '7', name: '福島県' },
    ],
  },
  {
    name: '関東',
    prefectures: [
      { id: '13', name: '東京都' },
      { id: '14', name: '神奈川県' },
      { id: '12', name: '千葉県' },
      { id: '11', name: '埼玉県' },
      { id: '8', name: '茨城県' },
      { id: '9', name: '栃木県' },
      { id: '10', name: '群馬県' },
    ],
  },
  {
    name: '北陸・甲信越',
    prefectures: [
      { id: '15', name: '新潟県' },
      { id: '16', name: '富山県' },
      { id: '17', name: '石川県' },
      { id: '18', name: '福井県' },
      { id: '19', name: '山梨県' },
      { id: '20', name: '長野県' },
    ],
  },
  {
    name: '東海',
    prefectures: [
      { id: '21', name: '岐阜県' },
      { id: '22', name: '静岡県' },
      { id: '23', name: '愛知県' },
      { id: '24', name: '三重県' },
    ],
  },
  {
    name: '近畿',
    prefectures: [
      { id: '27', name: '大阪府' },
      { id: '28', name: '兵庫県' },
      { id: '26', name: '京都府' },
      { id: '25', name: '滋賀県' },
      { id: '29', name: '奈良県' },
      { id: '30', name: '和歌山県' },
    ],
  },
  {
    name: '中国・四国',
    prefectures: [
      { id: '31', name: '鳥取県' },
      { id: '32', name: '島根県' },
      { id: '33', name: '岡山県' },
      { id: '34', name: '広島県' },
      { id: '35', name: '山口県' },
      { id: '36', name: '徳島県' },
      { id: '37', name: '香川県' },
      { id: '38', name: '愛媛県' },
      { id: '39', name: '高知県' },
    ],
  },
  {
    name: '九州・沖縄',
    prefectures: [
      { id: '40', name: '福岡県' },
      { id: '41', name: '佐賀県' },
      { id: '42', name: '長崎県' },
      { id: '43', name: '熊本県' },
      { id: '44', name: '大分県' },
      { id: '45', name: '宮崎県' },
      { id: '46', name: '鹿児島県' },
      { id: '47', name: '沖縄県' },
    ],
  },
];

/**
 * 都道府県コードから都道府県名を取得する
 */
export const getPrefectureName = (code: number): string => {
  return prefectures[code] || '不明';
};

/**
 * 都道府県コードの配列から都道府県名の配列を取得する
 */
export const getPrefectureNames = (codes: number[]): string[] => {
  return codes.map((code) => getPrefectureName(code));
};

/**
 * 都道府県名から都道府県コードを取得する
 */
export const getPrefectureCode = (name: string): number | null => {
  for (const [code, prefectureName] of Object.entries(prefectures)) {
    if (prefectureName === name) {
      return Number.parseInt(code);
    }
  }
  return null;
};
