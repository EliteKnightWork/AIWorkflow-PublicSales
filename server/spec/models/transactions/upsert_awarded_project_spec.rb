require 'rails_helper'

RSpec.describe Transactions::UpsertAwardedProject do
  describe '#exec' do
    let(:transaction) do
      described_class.new(args)
    end
    let(:args) do
      {
        prefectures: ['東京都', '神奈川県'],
        title: 'hoge',
        url: 'https://example.com',
        procedure_type: '一般競争入札',
        city: '千代田区',
        ulid: SecureRandom.uuid,
        source: 'fuga',
        organization_name: '〇〇県',
        planned_price: 1000000,
        successful_bid_price: 900000,
        is_unsuccessful: false,
        tender_opening_datetime: 1.day.ago,
        bidders: [
          { company_name: '株式会社hoge', is_successful_bidder: true },
          { company_name: '株式会社fuga', is_successful_bidder: false }
        ],
        attachments: [
          fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf')
        ],
        screenshots: [
          {
            source_url: 'https://example.com',
            file: fixture_file_upload(Rails.root.join("spec/fixtures/dummy.png"), 'image/png')
          }
        ],
        source_files: [
          fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf')
        ]
      }
    end

    context '一意キーで重複する落札案件が存在しない場合' do
      before do
        described_class.new({
          prefectures: ['東京都'],
          title: 'fuga',
          url: 'https://different-example.com',
          procedure_type: '一般競争入札',
          city: '千代田区',
          ulid: SecureRandom.uuid,
          source: 'fuga',
          organization_name: '△△県',
          planned_price: 500000,
          successful_bid_price: 400000,
        }).exec
      end

      it 'ProjectとAwardedProjectが新規作成されること' do
        expect { transaction.exec }.
          to change(Project, :count).by(1).
          and change(AwardedProject, :count).by(1).
          and change(ProjectLgCode, :count).by(2).
          and change(Organization, :count).by(1).
          and change(BidCompany, :count).by(2).
          and change(Bidder, :count).by(2).
          and change(ExternalDocument, :count).by(1).
          and change(Screenshot, :count).by(1).
          and change(SourceFile, :count).by(1).
          and change(ActiveStorage::Attachment, :count).by(3)
        expect(transaction.errors).to be_empty
      end

      it 'ProjectとAwardedProjectが正しく関連付けられること' do
        transaction.exec

        project = Project.last
        awarded_project = AwardedProject.last

        expect(awarded_project.project).to eq(project)
        expect(project.awarded_project).to eq(awarded_project)
      end

      it 'Projectに統合されたフィールドが正しく設定されること' do # rubocop:disable RSpec/MultipleExpectations
        transaction.exec

        project = Project.last

        expect(project.title).to eq('hoge')
        expect(project.organization_name).to eq('〇〇県')
        expect(project.procedure_type).to eq('一般競争入札')
        expect(project.source).to eq('fuga')
        expect(project.planned_price).to eq(1000000)
        expect(project.ulid).to eq(args[:ulid])
        expect(project.tender_opening_date).to eq(args[:tender_opening_datetime].to_date)
      end

      it 'AwardedProjectに落札結果固有の情報が設定されること' do
        transaction.exec

        awarded_project = AwardedProject.last

        expect(awarded_project.url).to eq('https://example.com')
        expect(awarded_project.successful_bid_price).to eq(900000)
        expect(awarded_project.is_unsuccessful).to be(false)
      end

      it '関連レコードがProjectに紐づくこと' do
        transaction.exec

        project = Project.last

        expect(project.external_documents.count).to eq(1)
        expect(project.screenshots.count).to eq(1)
        expect(project.source_files.count).to eq(1)
        expect(project.lg_codes.count).to eq(2)
        expect(project.lg_codes.pluck(:code)).to contain_exactly('13', '14') # 東京都、神奈川県のコード
      end

      it '入札者がAwardedProjectに紐づくこと' do
        transaction.exec

        awarded_project = AwardedProject.last

        expect(awarded_project.bidders.count).to eq(2)
        expect(awarded_project.bidders.map { |b| b.bid_company.name }).to contain_exactly('株式会社hoge', '株式会社fuga')
        expect(awarded_project.bidders.find_by(is_successful: true).bid_company.name).to eq('株式会社hoge')
      end
    end

    context '一意キーで重複する落札案件が存在する場合' do
      before do
        # 同じ条件でProject + AwardedProjectを事前作成
        described_class.new({
          prefectures: ['東京都', '神奈川県'],
          title: 'hoge',
          url: 'https://example.com',
          procedure_type: '一般競争入札',
          city: '千代田区',
          ulid: args[:ulid], # 同じulidを使用
          source: 'fuga',
          organization_name: '〇〇県',
          planned_price: 800000, # 異なる値で作成
          successful_bid_price: 700000,
          bidders: [
            { company_name: '株式会社existing', is_successful_bidder: true }
          ],
          attachments: [
            fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf'),
            fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf')
          ],
          screenshots: [
            {
              source_url: 'https://example.com',
              file: fixture_file_upload(Rails.root.join("spec/fixtures/dummy.png"), 'image/png')
            },
            {
              source_url: 'https://example.com',
              file: fixture_file_upload(Rails.root.join("spec/fixtures/dummy.png"), 'image/png')
            }
          ],
          source_files: [
            fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf'),
            fixture_file_upload(Rails.root.join("spec/fixtures/dummy.pdf"), 'application/pdf')
          ]
        }).exec
      end

      it '既存のProjectとAwardedProjectが更新されること' do
        expect { transaction.exec }.
          to not_change(Project, :count).
          and not_change(AwardedProject, :count).
          and not_change(ProjectLgCode, :count).
          and change(BidCompany, :count).by(2). # 新しい入札者の会社が2社追加
          and change(Bidder, :count).by(1).     # 既存1件削除、新規2件追加で+1
          and change(ExternalDocument, :count).by(-1). # 既存2件削除、新規1件追加で-1
          and change(Screenshot, :count).by(-1).
          and change(SourceFile, :count).by(-1).
          and change(ActiveStorage::Attachment, :count).by(-3)
      end

      it 'ProjectとAwardedProjectの情報が更新されること' do
        transaction.exec

        project = Project.find_by(ulid: args[:ulid])
        awarded_project = project.awarded_project

        # Projectの更新確認
        expect(project.planned_price).to eq(1000000) # 更新された値

        # AwardedProjectの更新確認
        expect(awarded_project.successful_bid_price).to eq(900000) # 更新された値
      end
    end

    context 'lg_codesが空で重複する落札案件が存在する場合' do
      before do
        described_class.new({
          title: 'empty_lg_test',
          url: 'https://example.com/empty',
          procedure_type: '一般競争入札',
          city: '千代田区',
          ulid: SecureRandom.uuid,
          source: 'test_source'
        }).exec
      end

      it '更新されること（重複作成されない）' do
        transaction_empty = described_class.new({
          title: 'empty_lg_test',
          url: 'https://example.com/empty',
          procedure_type: '一般競争入札',
          city: '千代田区',
          ulid: SecureRandom.uuid,
          source: 'test_source'
        })

        expect { transaction_empty.exec }.
          to not_change(AwardedProject, :count).
          and not_change(ProjectLgCode, :count)
      end
    end

    context '開札日時が未来の場合' do
      let(:future_date) { 7.days.from_now }
      let(:args) do
        {
          prefectures: ['東京都'],
          title: '未来日テスト案件',
          url: 'https://example.com/future',
          procedure_type: '一般競争入札',
          city: '千代田区',
          ulid: SecureRandom.uuid,
          source: 'test',
          organization_name: 'テスト機関',
          planned_price: 1000000,
          successful_bid_price: 900000,
          tender_opening_datetime: future_date
        }
      end

      it 'AwardedProjectのtender_opening_datetimeがnilになること' do
        # Slack通知をモック化
        allow_any_instance_of(NotifySlackService).to receive(:send_message).and_return(true)
        
        transaction = described_class.new(args)
        expect(transaction.exec).to be_truthy
        expect(transaction.errors).to be_empty

        project = Project.last
        
        expect(project.tender_opening_date).to be_nil
        
      end
    end

    context 'keyパラメータが指定されている場合' do
      let(:custom_key) { 'custom-project-key-123' }
      let(:args) do
        {
          key: custom_key,
          prefectures: ['東京都'],
          title: 'カスタムキー案件',
          url: 'https://example.com/custom-key',
          procedure_type: '一般競争入札',
          city: '千代田区',
          ulid: SecureRandom.uuid,
          source: 'test',
          organization_name: 'テスト機関',
          planned_price: 1000000,
          successful_bid_price: 900000,
          tender_opening_datetime: 1.day.ago
        }
      end

      it '指定されたkeyがProjectに設定されること' do
        transaction = described_class.new(args)
        expect(transaction.exec).to be_truthy
        expect(transaction.errors).to be_empty

        project = Project.last
        expect(project.key).to eq(custom_key)
      end
    end

    context 'keyパラメータが指定されていない場合' do
      let(:args) do
        {
          prefectures: ['東京都'],
          title: '自動生成キー案件',
          url: 'https://example.com/auto-key',
          procedure_type: '一般競争入札',
          city: '千代田区',
          ulid: SecureRandom.uuid,
          source: 'test',
          organization_name: 'テスト機関',
          planned_price: 1000000,
          successful_bid_price: 900000,
          tender_opening_datetime: 1.day.ago
        }
      end

      it '自動生成されたkeyがProjectに設定されること' do
        transaction = described_class.new(args)
        expect(transaction.exec).to be_truthy
        expect(transaction.errors).to be_empty

        project = Project.last
        expect(project.key).to be_present
        # 自動生成されたkeyは特定のフォーマットに従うことを確認
        expect(project.key).to match(/^[a-f0-9]+$/)
      end
    end
  end
end
