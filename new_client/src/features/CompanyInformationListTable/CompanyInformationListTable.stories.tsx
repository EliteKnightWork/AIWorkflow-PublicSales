import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { CompanyInformationResponse } from '@/api/generated/models';
import CompanyInformationListTable from './CompanyInformationListTable';

const meta: Meta<typeof CompanyInformationListTable> = {
  title: 'Features/CompanyInformationListTable',
  component: CompanyInformationListTable,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onEditClick: fn(),
  },
  decorators: [
    (Story) => {
      return (
        <div style={{ width: '800px', padding: '32px' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof CompanyInformationListTable>;

// サンプルデータ
const sampleData: CompanyInformationResponse = {
  companyInformation: {
    corporateNumber: '6030001124558',
    companyName: 'Nehan株式会社',
    postalCode: '150-0031',
    address: '東京都新宿区新宿5-15-14 INBOUND LEAGUENehan株式会社',
    director: '代表取締役 鶴巻 百門 ／ 木嶋 諄',
    telNum: '03-3333-3333',
    faxNum: null,
    capital: 16499940,
    employeesNum: 2000,
    industryType: null,
    businessDescription:
      '営業生産性を向上させるAI入札プラットフォーム「Labid（ラビッド）」の企画・開発\n入札・自治体ビジネス情報のメディア「Labid Journal（ラビッドジャーナル）」の運営',
    sales: 100000000,
    establishedAt: '2025-09-01',
  },
  offices: [
    {
      id: 1,
      name: 'Sapporo Hub',
      address: '北海道札幌市中央区北2条西4-1 札幌三井JPビルディング',
    },
    {
      id: 2,
      name: 'Takasaki Hub',
      address: '群馬県高崎市栄町14-5 内堀ビル',
    },
  ],
  attachments: [
    {
      id: 1,
      fileType: 'others' as const,
      url: 'https://example.com/nehan-register.pdf',
      name: 'Nehan登記簿.pdf',
    },
    {
      id: 2,
      fileType: 'financial_statements' as const,
      url: 'https://example.com/nehan-financial.pdf',
      name: 'Nehan2025年3Q決算資料.pdf',
    },
  ],
};

export const Default: Story = {
  name: '通常表示',
  args: {
    data: sampleData,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ラベルが表示されている
    const label = await canvas.findByText('基本情報');
    await expect(label).toBeInTheDocument();

    // 各項目が表示されている
    await expect(await canvas.findByText('法人番号')).toBeInTheDocument();
    await expect(await canvas.findByText('6030001124558')).toBeInTheDocument();
    await expect(await canvas.findByText('会社名')).toBeInTheDocument();
    await expect(await canvas.findByText('Nehan株式会社')).toBeInTheDocument();
    await expect(await canvas.findByText('資本金')).toBeInTheDocument();
    await expect(await canvas.findByText('16,499,940円')).toBeInTheDocument();
    await expect(await canvas.findByText('従業員数')).toBeInTheDocument();
    await expect(await canvas.findByText('2,000人')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  name: 'ローディング状態',
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ラベルが表示されている
    const label = await canvas.findByText('基本情報');
    await expect(label).toBeInTheDocument();

    // Skeletonが表示されている（複数のSkeleton要素が存在する）
    const skeletons = canvasElement.querySelectorAll('[class*="rt-Skeleton"]');
    await expect(skeletons.length).toBeGreaterThan(0);
  },
};

export const WithEditButton: Story = {
  name: '編集ボタン付き',
  args: {
    data: sampleData,
    onEditClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 編集ボタンが表示されている
    const editButton = await canvas.findByRole('button', { name: /基本情報を編集/ });
    await expect(editButton).toBeInTheDocument();

    // ボタンをクリック
    await userEvent.click(editButton);
    await expect(args.onEditClick).toHaveBeenCalledTimes(1);
  },
};

export const WithoutEditButton: Story = {
  name: '編集ボタンなし',
  args: {
    data: sampleData,
    onEditClick: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ラベルが表示されている
    const label = await canvas.findByText('基本情報');
    await expect(label).toBeInTheDocument();

    // 編集ボタンが表示されていない
    const editButtons = canvas.queryAllByRole('button', { name: /基本情報を編集/ });
    await expect(editButtons).toHaveLength(0);
  },
};

export const EmptyData: Story = {
  name: 'データが空',
  args: {
    data: {
      companyInformation: {},
      offices: [],
      attachments: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ラベルが表示されている
    const label = await canvas.findByText('基本情報');
    await expect(label).toBeInTheDocument();

    // 各項目のラベルは表示されているが、値は「未設定」が表示される
    await expect(await canvas.findByText('法人番号')).toBeInTheDocument();
    await expect(await canvas.findByText('未設定')).toBeInTheDocument();
  },
};

export const WithOffices: Story = {
  name: '事業所情報あり',
  args: {
    data: sampleData,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 事業所情報が表示されている
    await expect(await canvas.findByText('事業所情報')).toBeInTheDocument();
    await expect(await canvas.findByText('Sapporo Hub')).toBeInTheDocument();
    await expect(
      await canvas.findByText('北海道札幌市中央区北2条西4-1 札幌三井JPビルディング')
    ).toBeInTheDocument();
    await expect(await canvas.findByText('Takasaki Hub')).toBeInTheDocument();
    await expect(await canvas.findByText('群馬県高崎市栄町14-5 内堀ビル')).toBeInTheDocument();
  },
};

export const WithAttachments: Story = {
  name: '関連ファイルあり',
  args: {
    data: sampleData,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 関連ファイルが表示されている
    await expect(await canvas.findByText('関連ファイル')).toBeInTheDocument();
    const attachmentLink1 = await canvas.findByText('Nehan登記簿.pdf');
    await expect(attachmentLink1).toBeInTheDocument();
    await expect(attachmentLink1.closest('a')).toHaveAttribute(
      'href',
      'https://example.com/nehan-register.pdf'
    );

    const attachmentLink2 = await canvas.findByText('Nehan2025年3Q決算資料.pdf');
    await expect(attachmentLink2).toBeInTheDocument();
    await expect(attachmentLink2.closest('a')).toHaveAttribute(
      'href',
      'https://example.com/nehan-financial.pdf'
    );
  },
};
