require 'rails_helper'

RSpec.describe Transactions::CreateProject, type: :model do
  describe '#exec' do
    let(:args) do
      {
        key: 'test_key',
        raw_title: '【テスト】案件タイトル',
        description: '案件の説明文',
        organization_name: 'テスト組織',
        prefecture: '東京都',
        procedure_type: '一般競争入札',
        source: 'test_source',
        publication_date: Date.current,
        registration_date: Date.current,
        attachments: {},
        screenshots: [],
        prefectures: ['東京都']
      }
    end

    context '正常系' do
      it '入札案件を作成し、主要属性と関連データを正しく保存すること' do
        transaction = described_class.new(args)
        expect(transaction.exec).to be true

        project = transaction.project
        expect(project).to be_persisted
        expect(project).to have_attributes(
          key: 'test_key',
          raw_title: '【テスト】案件タイトル',
          description: '案件の説明文',
          organization_name: 'テスト組織',
          prefecture_name: '東京都',
          procedure_type: '一般競争入札',
          procedure_type_group: '一般競争入札',
          source: 'test_source',
          publication_date: Date.current,
          registration_date: Date.current,
        )

        expect(project.lg_codes.first.code).to eq('13')
        expect(project.organization.name).to eq('テスト組織')
      end

      it '既存のOrganizationが存在する場合はそれを利用すること' do
        create(:organization, name: 'テスト組織')

        transaction = described_class.new(args)
        expect(transaction.exec).to be true

        project = transaction.project
        expect(project.organization.name).to eq('テスト組織')
      end
    end

    context '異常系' do
      it 'keyとsourceが重複している場合はfalseを返し、エラーを返すこと' do
        # 既存レコードを作成（key+sourceのユニーク制約）
        create(:project, key: 'test_key', source: 'test_source')

        transaction = described_class.new(args)
        expect(transaction.exec).to be false

        expect(transaction.errors).to be_present
        expect(transaction.errors).to include('Keyはすでに存在します')
      end
    end
  end
end
