import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import type { CompanyInformationResponse } from '@/api/generated/models/companyInformationResponse';
import { CompanyInformationForm } from './index';

const meta = {
  title: 'Features/CompanyInformationForm',
  component: CompanyInformationForm,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof CompanyInformationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// ダミーの初期値データ
const mockInitialValue: CompanyInformationResponse = {
  companyInformation: {
    companyName: 'Nehan株式会社',
    corporateNumber: '6030001124558',
    postalCode: '150-0031',
    address: '東京都新宿区新宿5-15-14 INBOUND LEAGUE',
    director: '代表取締役 鶴巻 百門 ／ 木嶋 諄',
    telNum: '03-1234-5678',
    faxNum: '03-1234-5679',
    capital: 164999400,
    employeesNum: 2000,
    industryType: 'IT',
    businessDescription: '営業生産性を向上させるAI入札プラットフォーム',
    sales: 100000000,
    establishedAt: '2025-09-01',
  },
  offices: [
    {
      id: 1,
      name: '本社',
      address: '北海道札幌市中央区北2条西4-1 札幌三井JPビルディング',
    },
  ],
  attachments: [],
};

export const Basic: Story = {
  name: '基本（表示のみ）',
  args: {
    initialValue: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 説明文が存在
    const description = await canvas.findByText(
      '設定した企業情報をもとにLabidが案件の収集や参加申請書類の自動化などを行います'
    );
    await expect(description).toBeInTheDocument();

    // 主要なフィールドが存在
    await expect(await canvas.findByText('法人番号')).toBeInTheDocument();
    await expect(await canvas.findByText('会社名')).toBeInTheDocument();
    await expect(await canvas.findByText('郵便番号')).toBeInTheDocument();
    await expect(await canvas.findByText('住所')).toBeInTheDocument();
    await expect(await canvas.findByText('代表者名')).toBeInTheDocument();
    await expect(await canvas.findByText('電話番号')).toBeInTheDocument();
    await expect(await canvas.findByText('FAX')).toBeInTheDocument();
    await expect(await canvas.findByText('資本金')).toBeInTheDocument();
    await expect(await canvas.findByText('従業員数')).toBeInTheDocument();
    await expect(await canvas.findByText('業種')).toBeInTheDocument();
    await expect(await canvas.findByText('売上高')).toBeInTheDocument();
    await expect(await canvas.findByText('設立年月日')).toBeInTheDocument();
    await expect(await canvas.findByText('事業所名')).toBeInTheDocument();
    await expect(await canvas.findByText('事業所住所')).toBeInTheDocument();
    await expect(await canvas.findByText('関連ファイル')).toBeInTheDocument();

    // 保存ボタンが存在
    const saveButton = await canvas.findByRole('button', { name: '保存' });
    await expect(saveButton).toBeInTheDocument();

    // キャンセルボタンが存在
    const cancelButton = canvas.queryByRole('button', { name: 'キャンセル' });
    await expect(cancelButton).toBeInTheDocument();
  },
};

export const WithInitialValue: Story = {
  name: '初期値あり',
  args: {
    initialValue: mockInitialValue,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 初期値が表示されていることを確認
    const companyNameInput = canvas.getByPlaceholderText('会社名を入力');
    await expect(companyNameInput).toHaveValue('Nehan株式会社');

    const corporateNumberInput = canvas.getByPlaceholderText('法人番号を入力');
    await expect(corporateNumberInput).toHaveValue('6030001124558');

    const postalCodeInput = canvas.getByPlaceholderText('郵便番号を入力');
    await expect(postalCodeInput).toHaveValue('150-0031');

    const addressInput = canvas.getByPlaceholderText('住所を入力');
    await expect(addressInput).toHaveValue('東京都新宿区新宿5-15-14 INBOUND LEAGUE');

    // 事業所が表示されていることを確認
    const officeNameInputs = canvas.getAllByPlaceholderText('事業所名を入力');
    await expect(officeNameInputs[0]).toHaveValue('本社');
  },
};

export const Validation: Story = {
  name: '検証: バリデーションチェック',
  args: {
    initialValue: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1) 電話番号の形式チェック
    const telInput = await canvas.findByPlaceholderText('電話番号を入力');
    await userEvent.type(telInput, 'abc');
    await userEvent.tab(); // blur をトリガー

    // エラーメッセージの確認
    await waitFor(async () => {
      const errorMessage = await canvas.findByText(
        '電話番号は半角の数字・+・-・()のみ利用できます'
      );
      await expect(errorMessage).toBeInTheDocument();
    });

    // 2) 文字数上限（255文字）: 会社名/住所/代表者/業種
    const over255 = 'a'.repeat(256);
    const companyNameInput = await canvas.findByPlaceholderText('会社名を入力');
    await userEvent.clear(companyNameInput);
    await userEvent.type(companyNameInput, over255);
    await userEvent.tab();

    const addressInput = await canvas.findByPlaceholderText('住所を入力');
    await userEvent.clear(addressInput);
    await userEvent.type(addressInput, over255);
    await userEvent.tab();

    const directorInput = await canvas.findByPlaceholderText('代表者名を入力');
    await userEvent.clear(directorInput);
    await userEvent.type(directorInput, over255);
    await userEvent.tab();

    const industryTypeInput = await canvas.findByPlaceholderText('業種を入力');
    await userEvent.clear(industryTypeInput);
    await userEvent.type(industryTypeInput, over255);
    await userEvent.tab();

    // エラーメッセージの確認
    await waitFor(async () => {
      const countOfErrorMessage = await canvas.findAllByText('255文字以内で入力してください');
      await expect(countOfErrorMessage.length).toBe(4);
    });

    // 3) 郵便番号の文字数上限（20文字）
    const over20 = 'a'.repeat(21);
    const postalCodeInput = await canvas.findByPlaceholderText('郵便番号を入力');
    await userEvent.clear(postalCodeInput);
    await userEvent.type(postalCodeInput, over20);
    await userEvent.tab();

    // エラーメッセージの確認
    await waitFor(async () => {
      const errorMessage = await canvas.findByText('20文字以内で入力してください');
      await expect(errorMessage).toBeInTheDocument();
    });

    // 5) 数値フィールドのバリデーション
    // 資本金: 小数を入力
    const capitalInput = await canvas.findByPlaceholderText('資本金を入力');
    await userEvent.clear(capitalInput);
    await userEvent.type(capitalInput, '1.5');
    await userEvent.tab();

    // エラーメッセージの確認
    await waitFor(async () => {
      const errorMessage = await canvas.findByText('整数で入力してください');
      await expect(errorMessage).toBeInTheDocument();
    });

    // 従業員数: 負数を入力
    const employeesNumInput = await canvas.findByPlaceholderText('従業員数を入力');
    await userEvent.clear(employeesNumInput);
    await userEvent.type(employeesNumInput, '-1');
    await userEvent.tab();

    // エラーメッセージの確認
    await waitFor(async () => {
      const errorMessage = await canvas.findByText('0以上の数値を入力してください');
      await expect(errorMessage).toBeInTheDocument();
    });

    // 売上高: 非数値を入力
    const salesInput = await canvas.findByPlaceholderText('売上高を入力');
    await userEvent.clear(salesInput);
    await userEvent.type(salesInput, 'abc');
    await userEvent.tab();

    // エラーメッセージの確認
    await waitFor(async () => {
      const errorMessage = await canvas.findByText('数値で入力してください');
      await expect(errorMessage).toBeInTheDocument();
    });

    // 4) 設立年月日のバリデーション
    // 形式エラー: ハイフン形式を入力
    const establishedAtInput = await canvas.findByPlaceholderText('設立年月日を入力(YYYY/MM/DD)');
    await userEvent.clear(establishedAtInput);
    await userEvent.type(establishedAtInput, '2025-01-01');
    await userEvent.tab();

    // エラーメッセージの確認
    await waitFor(async () => {
      const errorMessage = await canvas.findByText('YYYY/MM/DDの形式で入力してください');
      await expect(errorMessage).toBeInTheDocument();
    });

    // 存在しない日付を入力
    await userEvent.clear(establishedAtInput);
    await userEvent.type(establishedAtInput, '2025/02/30');
    await userEvent.tab();

    // エラーメッセージの確認
    await waitFor(async () => {
      const errorMessage = await canvas.findByText('存在する日付を入力してください');
      await expect(errorMessage).toBeInTheDocument();
    });

    // 未来の日付を入力
    const today = new Date();
    const tomorrow = new Date(today.setDate(today.getDate() + 1));
    const tomorrowDate = `${tomorrow.getFullYear()}/${tomorrow.getMonth() + 1}/${tomorrow.getDate()}`;
    await userEvent.clear(establishedAtInput);
    await userEvent.type(establishedAtInput, tomorrowDate);
    await userEvent.tab();

    // エラーメッセージの確認
    await waitFor(async () => {
      const errorMessage = await canvas.findByText('未来の日付を入力できません');
      await expect(errorMessage).toBeInTheDocument();
    });

    // 6) 事業所: 必須チェック
    const addOfficeButton = await canvas.findByTestId('add-office-button');
    await userEvent.click(addOfficeButton);

    const officeNameInputs = await canvas.findAllByPlaceholderText('事業所名を入力');
    const officeAddressInputs = await canvas.findAllByPlaceholderText('事業所住所を入力');

    // 事業所名のみ空(事業所住所は空ではない)のままblurをトリガー
    if (officeAddressInputs[0]) {
      await userEvent.clear(officeAddressInputs[0]);
      await userEvent.type(officeAddressInputs[0], '東京都千代田区千代田1-1-1');
      await userEvent.tab();
    }

    if (officeNameInputs[0]) {
      await userEvent.click(officeNameInputs[0]);
      await userEvent.tab();
    }

    // エラーメッセージの確認
    await waitFor(async () => {
      const errorMessage = await canvas.findByText('事業所名は必須です');
      await expect(errorMessage).toBeInTheDocument();
    });

    // 事業所住所のみ空(事業所名は空ではない)のままblurをトリガー
    if (officeNameInputs[1]) {
      await userEvent.clear(officeNameInputs[1]);
      await userEvent.type(officeNameInputs[1], '事業所');
      await userEvent.tab();
    }

    if (officeAddressInputs[1]) {
      await userEvent.click(officeAddressInputs[1]);
      await userEvent.tab();
    }

    // エラーメッセージの確認
    await waitFor(async () => {
      const errorMessage = await canvas.findByText('住所は必須です');
      await expect(errorMessage).toBeInTheDocument();
    });
  },
};

export const FunctionalSubmit: Story = {
  name: '機能: 入力→送信',
  args: {
    initialValue: null,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // 会社名を入力
    const companyNameInput = await canvas.findByPlaceholderText('会社名を入力');
    await userEvent.clear(companyNameInput);
    await userEvent.type(companyNameInput, 'テスト株式会社');

    // 法人番号を入力
    const corporateNumberInput = await canvas.findByPlaceholderText('法人番号を入力');
    await userEvent.type(corporateNumberInput, '1234567890123');

    // 郵便番号を入力
    const postalCodeInput = await canvas.findByPlaceholderText('郵便番号を入力');
    await userEvent.type(postalCodeInput, '100-0001');

    // 住所を入力
    const addressInput = await canvas.findByPlaceholderText('住所を入力');
    await userEvent.type(addressInput, '東京都千代田区千代田1-1-1');

    // 代表者名を入力
    const directorInput = await canvas.findByPlaceholderText('代表者名を入力');
    await userEvent.type(directorInput, '山田 太郎');

    // 電話番号を入力
    const telInput = await canvas.findByPlaceholderText('電話番号を入力');
    await userEvent.type(telInput, '03-1234-5678');

    // 資本金を入力
    const capitalInput = await canvas.findByPlaceholderText('資本金を入力');
    await userEvent.type(capitalInput, '1000000');

    // 従業員数を入力
    const employeesNumInput = await canvas.findByPlaceholderText('従業員数を入力');
    await userEvent.type(employeesNumInput, '50');

    // 業種を入力
    const industryTypeInput = await canvas.findByPlaceholderText('業種を入力');
    await userEvent.type(industryTypeInput, 'IT');

    // 売上高を入力
    const salesInput = await canvas.findByPlaceholderText('売上高を入力');
    await userEvent.type(salesInput, '50000000');

    // 設立年月日を入力
    const establishedAtInput = await canvas.findByPlaceholderText('設立年月日を入力(YYYY/MM/DD)');
    await userEvent.type(establishedAtInput, '2025/01/01');

    // 事業所を追加
    const addOfficeButton = await canvas.findByTestId('add-office-button');
    await userEvent.click(addOfficeButton);

    const officeNameInputs = await canvas.findAllByPlaceholderText('事業所名を入力');
    await userEvent.type(officeNameInputs[officeNameInputs.length - 1], 'Tokyo Hub');

    const officeAddressInputs = await canvas.findAllByPlaceholderText('事業所住所を入力');
    await userEvent.type(
      officeAddressInputs[officeAddressInputs.length - 1],
      '東京都千代田区丸の内1-1-1'
    );

    // 保存ボタンをクリックしてフォームを送信
    const saveButton = await canvas.findByRole('button', { name: '保存' });
    await userEvent.click(saveButton);

    // onSubmitが呼ばれたことを確認
    await waitFor(() => {
      expect(args.onSubmit).toHaveBeenCalled();
    });
  },
};

export const WithOffices: Story = {
  name: '事業所の追加・削除',
  args: {
    initialValue: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 事業所名と住所を入力
    const officeNameInputs = await canvas.findAllByPlaceholderText('事業所名を入力');
    await expect(officeNameInputs.length).toBe(1);
    await userEvent.type(officeNameInputs[0], '本社');

    const officeAddressInputs = await canvas.findAllByPlaceholderText('事業所住所を入力');
    await userEvent.type(officeAddressInputs[0], '東京都新宿区新宿1-1-1');

    // 事業所を追加
    const addOfficeButton = await canvas.findByLabelText('事業所を追加');
    await userEvent.click(addOfficeButton);
    const officeNameInputs2 = await canvas.findAllByPlaceholderText('事業所名を入力');
    await expect(officeNameInputs2.length).toBe(2);
    await userEvent.type(officeNameInputs2[1], '大阪支社');

    const officeAddressInputs2 = await canvas.findAllByPlaceholderText('事業所住所を入力');
    await userEvent.type(officeAddressInputs2[1], '大阪府大阪市北区梅田1-1-1');

    // 最初の事業所を削除
    const deleteButtons = await canvas.findAllByRole('button', { name: '事業所を削除' });
    await expect(deleteButtons.length).toBe(2);
    await userEvent.click(deleteButtons[0]);

    // 事業所が1つになったことを確認
    const officeNameInputs3 = await canvas.findAllByPlaceholderText('事業所名を入力');
    await expect(officeNameInputs3.length).toBe(1);
    await expect(officeNameInputs3[0]).toHaveValue('本社');
  },
};

export const WithAttachments: Story = {
  name: '添付ファイルの追加・削除',
  args: {
    initialValue: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 関連ファイルセクションが存在することを確認
    const attachmentsLabel = await canvas.findByText('関連ファイル');
    await expect(attachmentsLabel).toBeInTheDocument();

    // ファイルアップロードエリアが存在することを確認（初期状態ではドロップゾーンが表示される）
    const fileUploadArea = await canvas.findByText('ファイルをドラッグ&ドロップ');
    await expect(fileUploadArea).toBeInTheDocument();

    // 関連ファイルを追加
    const addAttachmentButton = await canvas.findByTestId('add-attachment-button');
    await expect(addAttachmentButton).toBeInTheDocument();
    await userEvent.click(addAttachmentButton);

    // 追加後、ファイルアップロードエリアが複数存在することを確認
    const fileUploadAreas = await canvas.findAllByText('ファイルをドラッグ&ドロップ');
    await expect(fileUploadAreas.length).toBeGreaterThan(0);

    // 削除ボタンが存在することを確認
    const deleteButtons = await canvas.findAllByRole('button', { name: '関連ファイルを削除' });
    await expect(deleteButtons.length).toBeGreaterThan(0);

    // 最初の関連ファイルを削除
    await userEvent.click(deleteButtons[0]);

    // 削除後、ファイルアップロードエリアの数が減ったことを確認
    const fileUploadAreasAfterDelete = canvas.queryAllByText('ファイルをドラッグ&ドロップ');
    await expect(fileUploadAreasAfterDelete.length).toBeLessThan(fileUploadAreas.length);
  },
};
