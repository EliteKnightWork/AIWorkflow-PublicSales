import { Text } from '@radix-ui/themes';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import ListTable, { type ListTableItem } from './ListTable';

const meta: Meta<typeof ListTable> = {
  title: 'Entities/ListTable',
  component: ListTable,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ListTable>;

const sampleItems: ListTableItem[] = [
  { heading: '法人番号', content: '6030001124558' },
  { heading: '会社名', content: 'Nehan株式会社' },
  { heading: '郵便番号', content: '150-0031' },
  { heading: '住所', content: '東京都新宿区新宿5-15-14 INBOUND LEAGUENehan株式会社' },
  { heading: '代表者名', content: '代表取締役 鶴巻 百門 ／ 木嶋 諄' },
  { heading: '電話番号', content: '03-3333-3333' },
  { heading: 'FAX', content: null },
  { heading: '資本金', content: '16,499,940円' },
  { heading: '従業員数', content: '2,000人' },
  { heading: '業種', content: null },
  {
    heading: '事業内容',
    content: (
      <>
        営業生産性を向上させるAI入札プラットフォーム「Labid（ラビッド）」の企画・開発
        <br />
        入札・自治体ビジネス情報のメディア「Labid Journal（ラビッドジャーナル）」の運営
      </>
    ),
  },
  { heading: '売上高', content: '100,000,000円' },
  { heading: '設立年月日', content: '2025年9月1日' },
  {
    heading: '事業所情報',
    content: (
      <div>
        <div>
          <Text weight='bold'>Sapporo Hub</Text>
          <br />
          北海道札幌市中央区北2条西4-1 札幌三井JPビルディング
        </div>
        <div style={{ marginTop: '8px' }}>
          <Text weight='bold'>Takasaki Hub</Text>
          <br />
          群馬県高崎市栄町14-5 内堀ビル
        </div>
      </div>
    ),
  },
  {
    heading: '関連ファイル',
    content: (
      <div>
        <a href='http://example.com' style={{ color: '#0762fe', textDecoration: 'underline' }}>
          Nehan登記簿.pdf
        </a>
        <br />
        <a href='http://example.com' style={{ color: '#0762fe', textDecoration: 'underline' }}>
          Nehan2025年3Q決算資料.pdf
        </a>
      </div>
    ),
  },
];

export const Default: Story = {
  args: {
    items: sampleItems,
    emptyPlaceholder: '未設定',
    headingColumnWidth: '120px',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // テーブルが存在することを確認
    const table = canvas.getByRole('table');
    await expect(table).toBeVisible();

    // 各アイテムの heading が表示されていることを確認
    await expect(canvas.getByText('法人番号')).toBeVisible();
    await expect(canvas.getByText('会社名')).toBeVisible();
    await expect(canvas.getByText('郵便番号')).toBeVisible();

    // content が正しく表示されていることを確認
    await expect(canvas.getByText('6030001124558')).toBeVisible();
    await expect(canvas.getByText('Nehan株式会社')).toBeVisible();
    await expect(canvas.getByText('150-0031')).toBeVisible();

    // content が null の場合、emptyPlaceholder が表示されることを確認
    const emptyPlaceholder = args.emptyPlaceholder as string;
    const emptyCells = canvas.getAllByText(emptyPlaceholder);
    await expect(emptyCells.length).toBeGreaterThan(0);
  },
};

export const WithHeader: Story = {
  args: {
    items: sampleItems,
    emptyPlaceholder: '未設定',
    headingColumnWidth: '120px',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // テーブルが存在することを確認
    const table = canvas.getByRole('table');
    await expect(table).toBeVisible();

    // 複数の行が存在することを確認
    const rows = canvas.getAllByRole('row');
    await expect(rows.length).toBe(sampleItems.length);

    // ReactNode の content が正しく表示されることを確認
    await expect(canvas.getByText('事業内容')).toBeVisible();
    await expect(canvas.getByText(/営業生産性を向上させるAI入札プラットフォーム/)).toBeVisible();
  },
};

export const CustomWidth: Story = {
  args: {
    items: sampleItems,
    emptyPlaceholder: '未設定',
    headingColumnWidth: '160px',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // テーブルが存在することを確認
    const table = canvas.getByRole('table');
    await expect(table).toBeVisible();

    // カスタム幅が適用されていることを確認（最初の heading cell を取得）
    const firstHeading = canvas.getByText('法人番号');
    const headingCell = firstHeading.closest('td');
    await expect(headingCell).toHaveStyle({ width: args.headingColumnWidth });
  },
};

const itemsWithNullContent: ListTableItem[] = [
  { heading: '項目1', content: '値1' },
  { heading: '項目2', content: null },
  { heading: '項目3', content: null },
];

export const CustomEmptyPlaceholder: Story = {
  args: {
    items: itemsWithNullContent,
    emptyPlaceholder: 'データなし',
    headingColumnWidth: '120px',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // テーブルが存在することを確認
    const table = canvas.getByRole('table');
    await expect(table).toBeVisible();

    // カスタムの emptyPlaceholder が表示されることを確認
    const customPlaceholder = args.emptyPlaceholder as string;
    const emptyCells = canvas.getAllByText(customPlaceholder);
    await expect(emptyCells.length).toBe(2); // 項目2と項目3が null

    // 値がある項目は正しく表示されることを確認
    await expect(canvas.getByText('項目1')).toBeVisible();
    await expect(canvas.getByText('値1')).toBeVisible();
  },
};
