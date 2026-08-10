# == Schema Information
#
# Table name: projects
# Database name: primary
#
#  id                                                                                                 :bigint           not null, primary key
#  application_document_deadline_date(応募書類提出期日)                                               :date
#  bidding_deadline_date(入札日)                                                                      :date
#  briefing_session_date(入札説明会日)                                                                :date
#  city_code(市区町村コード)                                                                          :string(255)
#  city_name(市区町村)                                                                                :string(255)
#  delivery_deadline_date(納入期限日)                                                                 :date
#  description(公告文)                                                                                :text(4294967295)
#  external_document_url(公告情報のURL)                                                               :text(65535)
#  hidden_at(非表示日時)                                                                              :datetime
#  is_backfilled(過去分取り込みによるデータかどうか)                                                  :boolean          default(FALSE), not null
#  is_experience_required(実績が必要かどうか)                                                         :boolean          default(FALSE), not null
#  is_office_required(事業所が必要かどうか)                                                           :boolean
#  key(公告情報のキー(取得元で採番されたキー))                                                        :string(255)      not null
#  keywords(キーワード)                                                                               :text(65535)
#  lg_code(都道府県コード)                                                                            :string(255)
#  organization_name(発注機関名)                                                                      :string(255)
#  participation_qualification(参加資格)                                                              :string(255)
#  planned_price(予定価格)                                                                            :bigint
#  prefecture_name(都道府県名)                                                                        :string(255)
#  procedure_type(入札方式)                                                                           :string(255)
#  procedure_type_group(入札方式グループ)                                                             :string(255)
#  processing_status(処理状況 (pending, processing_documents, processing_summary, completed, failed)) :string(255)      default("pending")
#  proposal_document_deadline_date(提案書類提出期日)                                                  :date
#  publication_date(公告日)                                                                           :date
#  raw_title(整形前の件名)                                                                            :string(255)
#  registration_date(登録日)                                                                          :date             not null
#  source(公告情報の取得元)                                                                           :string(255)      not null
#  summary(案件詳細の要約)                                                                            :text(4294967295)
#  tender_opening_date(開札日)                                                                        :date
#  title(件名)                                                                                        :string(255)      not null
#  ulid(ULID(ルーター側で採番したキー))                                                               :string(255)
#  uuid(UUID(Labid側で採番したキー))                                                                  :string(255)      not null
#  created_at                                                                                         :datetime         not null
#  updated_at                                                                                         :datetime         not null
#  company_project_id(企業プロジェクトID)                                                             :bigint
#  organization_id(発注機関ID)                                                                        :bigint
#
# Indexes
#
#  index_projects_on_application_document_deadline_date  (application_document_deadline_date)
#  index_projects_on_bidding_deadline_date               (bidding_deadline_date)
#  index_projects_on_city_code                           (city_code)
#  index_projects_on_company_project_id                  (company_project_id)
#  index_projects_on_hidden_at                           (hidden_at)
#  index_projects_on_key_and_source                      (key,source) UNIQUE
#  index_projects_on_lg_code                             (lg_code)
#  index_projects_on_organization_id                     (organization_id)
#  index_projects_on_organization_name                   (organization_name)
#  index_projects_on_proposal_document_deadline_date     (proposal_document_deadline_date)
#  index_projects_on_raw_title                           (raw_title)
#  index_projects_on_registration_date                   (registration_date)
#  index_projects_on_title                               (title)
#  index_projects_on_updated_at                          (updated_at)
#  index_projects_on_uuid                                (uuid) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_project_id => company_projects.id)
#  fk_rails_...  (organization_id => organizations.id)
#
require 'rails_helper'

RSpec.describe Project, type: :model do
  describe 'validations' do
    subject { build(:project) }

    # NOTE: callback で uuid が設定されるためいくつかのテストケースを省略
    it { is_expected.to validate_presence_of(:key) }
    it { is_expected.to validate_presence_of(:source) }
    it { is_expected.to validate_presence_of(:registration_date) }
  end

  describe '#check_date' do
    it '全ての期日が空ならSlackに通知（ひとつも値がありません）すること' do
      slack = instance_double(NotifySlackService)
      allow(slack).to receive(:send_message)
      allow(NotifySlackService).to receive(:new).and_return(slack)

      project = build(:project,
        publication_date: nil,
        application_document_deadline_date: nil,
        proposal_document_deadline_date: nil,
        bidding_deadline_date: nil
      )

      project.valid?

      expect(slack).to have_received(:send_message).with(include('日付にひとつも値がありません'))
    end

    it '公告日が未来日の場合はnilにし、Slackに「公告日が空です」を通知すること' do
      slack = instance_double(NotifySlackService)
      allow(slack).to receive(:send_message)
      allow(NotifySlackService).to receive(:new).and_return(slack)

      project = build(:project,
        publication_date: Time.zone.today + 1.day,
        application_document_deadline_date: Time.zone.today + 10.days,
        proposal_document_deadline_date: nil,
        bidding_deadline_date: nil
      )

      project.valid?

      expect(project.publication_date).to be_nil
      expect(slack).to have_received(:send_message).with(include('公告日が空です'))
    end

    it 'allow_future_publication_date が true の場合は公告日の未来日を許容し、Slackに「公告日が空です」を通知しないこと' do
      slack = instance_double(NotifySlackService)
      allow(slack).to receive(:send_message)
      allow(NotifySlackService).to receive(:new).and_return(slack)

      future_date = Time.zone.today + 1.day
      project = build(
        :project,
        publication_date: future_date,
        application_document_deadline_date: Time.zone.today + 10.days,
        proposal_document_deadline_date: nil,
        bidding_deadline_date: nil
      )

      # 企業プロジェクトなどで未来日を許容するフラグを有効化
      project.allow_future_publication_date = true
      project.valid?

      expect(project.publication_date).to eq(future_date)
      expect(slack).not_to have_received(:send_message).with(include('公告日が空です'))
    end

    it '公告日しか登録がない場合はSlackに「公告日しか登録されていません」を通知すること' do
      slack = instance_double(NotifySlackService)
      allow(slack).to receive(:send_message)
      allow(NotifySlackService).to receive(:new).and_return(slack)

      project = build(:project,
        publication_date: Time.zone.today,
        application_document_deadline_date: nil,
        proposal_document_deadline_date: nil,
        bidding_deadline_date: nil
      )

      project.valid?

      expect(slack).to have_received(:send_message).with(include('公告日しか登録されていません'))
    end

    it 'いずれかが3ヶ月以上ずれている場合はSlackに通知すること' do
      slack = instance_double(NotifySlackService)
      allow(slack).to receive(:send_message)
      allow(NotifySlackService).to receive(:new).and_return(slack)

      project = build(:project,
        publication_date: Time.zone.today,
        application_document_deadline_date: Time.zone.today + 100.days,
        proposal_document_deadline_date: nil,
        bidding_deadline_date: nil
      )

      project.valid?

      expect(slack).to have_received(:send_message).with(include('3ヵ月以上ずれている期日があります'))
    end

    describe '相関チェックによる日付の無効化' do
      it '参加期日が公告日より過去ならnilになること' do
        project = build(:project,
          publication_date: Time.zone.today,
          application_document_deadline_date: Time.zone.today - 1.day,
          proposal_document_deadline_date: nil,
          bidding_deadline_date: nil
        )

        # Slack通知は不要なのでスタブして無視
        allow(NotifySlackService).to receive(:new).and_return(instance_double(NotifySlackService, send_message: true))

        project.valid?
        expect(project.application_document_deadline_date).to be_nil
      end

      it '提案期日が参加期日より過去ならnilになること' do
        project = build(:project,
          publication_date: Time.zone.today,
          application_document_deadline_date: Time.zone.today + 5.days,
          proposal_document_deadline_date: Time.zone.today + 1.day,
          bidding_deadline_date: nil
        )

        allow(NotifySlackService).to receive(:new).and_return(instance_double(NotifySlackService, send_message: true))

        project.valid?
        expect(project.proposal_document_deadline_date).to be_nil
      end

      it '入札日が他の日付より過去ならnilになること' do
        project = build(:project,
          publication_date: Time.zone.today,
          application_document_deadline_date: Time.zone.today + 10.days,
          proposal_document_deadline_date: Time.zone.today + 15.days,
          bidding_deadline_date: Time.zone.today - 1.day
        )

        allow(NotifySlackService).to receive(:new).and_return(instance_double(NotifySlackService, send_message: true))

        project.valid?
        expect(project.bidding_deadline_date).to be_nil
      end
    end
  end

  describe 'associations' do
    it { is_expected.to have_many(:external_documents).dependent(:destroy) }
    it { is_expected.to have_many(:screenshots).dependent(:destroy) }
    it { is_expected.to have_many(:source_files).dependent(:destroy) }
    it { is_expected.to have_many(:date_extraction_logs).dependent(:destroy) }
    it { is_expected.to have_many(:project_embeddings).dependent(:destroy) }
    it { is_expected.to have_many(:lg_codes).dependent(:destroy) }
    it { is_expected.to have_many(:favorites).dependent(:destroy) }
    it { is_expected.to have_many(:project_summary_usages).dependent(:destroy) }
    it { is_expected.to have_many(:business_description_favorite_projects).dependent(:destroy) }
    it { is_expected.to have_many(:browsing_histories).dependent(:destroy) }
    it { is_expected.to have_many(:bid_pipelines).dependent(:destroy) }
    it { is_expected.to have_many(:project_grades).dependent(:destroy) }
    it { is_expected.to have_many(:project_security_qualifications).dependent(:destroy) }
    it { is_expected.to have_many(:project_participate_qualification_grades).dependent(:destroy) }
    it { is_expected.to have_many(:participate_qualification_grades).through(:project_participate_qualification_grades).dependent(:destroy) }
    it { is_expected.to have_many(:project_awarded_links).dependent(:destroy) }
    it { is_expected.to have_many(:awarded_links).class_name('ProjectAwardedLink').with_foreign_key('project_awarded_id').inverse_of(:project_awarded).dependent(:destroy) }
    it { is_expected.to belong_to(:organization).optional }
    it { is_expected.to have_one(:summary_embedding).dependent(:destroy) }
    it { is_expected.to have_one(:awarded_project).dependent(:destroy) }
  end

  describe 'callbacks' do
    describe 'before_validation' do
      describe 'set_title' do
        context 'raw_titleが空の場合' do
          it '何もしないこと' do
            project = build(:project, raw_title: nil, title: nil)
            project.valid?
            expect(project.title).to be_nil
          end
        end

        context 'titleの先頭に【】で囲まれた文字列が含まれる場合' do
          it '【】で囲まれた文字列を削除した文字列をtitleに設定すること' do
            project = build(:project, raw_title: '【hoge】aaaaa')
            project.valid?
            expect(project.title).to eq 'aaaaa'
          end
        end

        context 'titleの先頭に【】で囲まれた文字列が含まれており、かつ年度で終わる場合' do
          it '【】で囲まれた文字列を削除した文字列をtitleに設定すること' do
            project = build(:project, raw_title: '【hoge年度】aaaaa')
            project.valid?
            expect(project.title).to eq 'aaaaa'
          end
        end

        context 'titleの先頭に【】で囲まれた文字列が含まれており、かつ年度で終わらない場合' do
          it '【】で囲まれた文字列を削除せず文字列をそのままtitleに設定すること' do
            project = build(:project, raw_title: '【hoge年度hoge】aaaaa')
            project.valid?
            expect(project.title).to eq '【hoge年度hoge】aaaaa'
          end
        end

        context 'PHRASES_TO_REMOVEで定義された文字列が含まれる場合' do
          it '削除した文字列をtitleに設定すること' do
            project = build(:project, raw_title: 'hogehogeに係るプロポーザル')
            project.valid?
            expect(project.title).to eq 'hogehoge'
          end
        end

        context 'PHRASES_TO_REMOVEで定義された文字列が複数含まれる場合' do
          it '文字数が長い順に削除した文字列をtitleに設定すること' do
            project = build(:project, raw_title: '（公示）fugaに係る企画運営業務委託の募集を開始します')
            project.valid?
            expect(project.title).to eq 'fuga'
          end
        end

        context 'PHRASES_TO_REMOVEで定義された文字列と【】で囲まれた文字列が含まれる場合' do
          it '文字列を削除した文字列をtitleに設定すること' do
            project = build(:project, raw_title: '【ｅスポーツイベント運営業務委託】公募型プロポーザルの実施')
            project.valid?
            expect(project.title).to eq '【ｅスポーツイベント運営業務委託】'
          end
        end
      end

      describe 'nullify_date_if_past' do
        context 'publication_dateより過去日だったら' do
          it 'nilにすること' do
            project = build(:project,
              publication_date: Time.zone.today.to_date,
              briefing_session_date: Time.zone.yesterday.to_date,
              application_document_deadline_date: Time.zone.yesterday.to_date,
              proposal_document_deadline_date: Time.zone.yesterday.to_date,
              bidding_deadline_date: Time.zone.yesterday.to_date,
              tender_opening_date: Time.zone.yesterday.to_date,
              delivery_deadline_date: Time.zone.yesterday.to_date,
            )
            project.valid?

            aggregate_failures do
              expect(project.briefing_session_date).to be_nil
              expect(project.application_document_deadline_date).to be_nil
              expect(project.proposal_document_deadline_date).to be_nil
              expect(project.bidding_deadline_date).to be_nil
              expect(project.tender_opening_date).to be_nil
              expect(project.delivery_deadline_date).to be_nil
            end
          end
        end
      end

      it 'UUIDが自動生成されること' do
        project = build(:project, uuid: nil)
        expect { project.valid? }.to change { project.uuid }.from(nil).to(be_present)
      end
    end

    describe 'after_validation' do
      it 'check_dateが呼ばれること' do
        project = build(:project)
        allow(project).to receive(:check_date)
        project.valid?
        expect(project).to have_received(:check_date)
      end

      it 'エラーがある場合はcheck_dateが呼ばれないこと' do
        project = build(:project, key: nil)
        allow(project).to receive(:check_date)
        project.valid?
        expect(project).not_to have_received(:check_date)
      end

      it 'skip_check_date_callbackがtrueの場合はcheck_dateが呼ばれないこと' do
        project = build(:project)
        project.skip_check_date_callback = true
        allow(project).to receive(:check_date)
        project.valid?
        expect(project).not_to have_received(:check_date)
      end
    end

    describe 'after_commit' do
      it 'check_and_build_project_embeddingsが呼ばれること' do
        project = build(:project)
        allow(project).to receive(:check_and_build_project_embeddings)
        project.save!
        expect(project).to have_received(:check_and_build_project_embeddings)
      end
    end
  end

  describe 'scopes' do
    describe '.visible' do
      it 'hidden_atがnilのものを取得すること' do
        _project_1 = create(:project, hidden_at: Time.zone.now)
        project_2 = create(:project, hidden_at: nil)

        expect(Project.visible).to contain_exactly(project_2)
      end
    end

    describe '.hidden' do
      it 'hidden_atがnilでないものを取得すること' do
        project_1 = create(:project, hidden_at: Time.zone.now)
        _project_2 = create(:project, hidden_at: nil)

        expect(Project.hidden).to contain_exactly(project_1)
      end
    end

    describe '.open' do
      it 'application_document_deadline_dateがある場合はそれを使用すること' do
        project_1 = create(:project, application_document_deadline_date: Time.zone.now.to_date + 7.days)
        _project_2 = create(:project, application_document_deadline_date: nil, proposal_document_deadline_date: nil, bidding_deadline_date: nil)
        project_3 = create(:project, application_document_deadline_date: nil, proposal_document_deadline_date: Time.zone.now.to_date + 7.days)
        project_4 = create(:project, application_document_deadline_date: nil, proposal_document_deadline_date: nil, bidding_deadline_date: Time.zone.now.to_date + 7.days)

        expect(Project.open).to contain_exactly(project_1, project_3, project_4)
      end

      it '期限が過去の案件を含まないこと' do
        _project_1 = create(:project, application_document_deadline_date: Time.zone.now.to_date - 1.day)
        _project_2 = create(:project, application_document_deadline_date: nil, proposal_document_deadline_date: Time.zone.now.to_date - 1.day)
        _project_3 = create(:project, application_document_deadline_date: nil, proposal_document_deadline_date: nil, bidding_deadline_date: Time.zone.now.to_date - 1.day)

        expect(Project.open).to be_empty
      end
    end

    describe '.for_company' do
      let(:company) { create(:company) }
      let(:other_company) { create(:company) }
      let(:project) { create(:project, company_project: nil) }
      let(:project_for_company) { create(:project, company_project: create(:company_project, company: company)) }
      let(:project_for_other_company) { create(:project, company_project: create(:company_project, company: other_company)) }

      before do
        allow_any_instance_of(Project).to receive(:check_and_build_project_embeddings)
      end

      context '会社IDが指定された場合' do
        it '指定した会社に紐づく案件と共通案件を取得すること' do
          expect(Project.for_company(company.id)).to contain_exactly(project, project_for_company)
        end

        it '他の会社に紐づく案件は含まれないこと' do
          expect(Project.for_company(company.id)).not_to include(project_for_other_company)
        end
      end

      context '会社IDが空の場合' do
        it '共通案件のみ取得すること' do
          expect(Project.for_company(nil)).to contain_exactly(project)
        end

        it '会社に紐づく案件は含まれないこと' do
          expect(Project.for_company(nil)).not_to include(project_for_company, project_for_other_company)
        end
      end
    end
  end

  describe '#bid_pipeline_for_company' do
    it '指定した会社のパイプラインを返すこと' do
      project = create(:project)
      company = create(:company)
      pipeline = create(:bid_pipeline, project: project, company: company)

      expect(project.bid_pipeline_for_company(company)).to eq(pipeline)
    end

    it '同一案件に複数社のパイプラインがあっても、該当会社のものだけ返すこと' do
      project = create(:project)
      company_a = create(:company)
      company_b = create(:company)
      pipeline_a = create(:bid_pipeline, project: project, company: company_a)
      _pipeline_b = create(:bid_pipeline, project: project, company: company_b)

      expect(project.bid_pipeline_for_company(company_a)).to eq(pipeline_a)
    end
  end

  describe '#update_with' do
    let(:project) { create(:project) }
    let(:update_args) do
      {
        title: '更新されたタイトル',
        procedure_type: '更新された入札方式',
        source: '更新されたソース',
        organization_name: '更新された組織名',
        publication_date: Date.current + 1.day,
        prefectures: ['大阪府']
      }
    end

    before do
      allow(LgCodeConverter).to receive(:to_code).with('大阪府').and_return('27')
    end

    it 'プロジェクト情報の更新が成功すること' do
      expect(project.update_with(update_args)).to be true
    end

    it 'タイトルと入札方式の情報が更新されること' do
      project.update_with(update_args)
      project.reload
      expect(project.title).to eq('更新されたタイトル')
      expect(project.raw_title).to be_nil
      expect(project.procedure_type).to eq('更新された入札方式')
    end

    it 'ソースと組織名と日付の情報が更新されること' do
      project.update_with(update_args)
      project.reload
      expect(project.source).to eq('更新されたソース')
      expect(project.organization_name).to eq('更新された組織名')
      expect(project.publication_date).to eq(Date.current + 1.day)
    end

    it 'lg_codesを更新すること' do
      project.lg_codes.create!(code: '13') # 東京都

      expect(project.update_with(update_args)).to be true

      project.reload
      expect(project.lg_codes.size).to eq(1)
      expect(project.lg_codes.first.code).to eq('27')
    end
  end

  describe '#all_documents_processed?' do
    let(:project) { create(:project) }

    context '未処理のドキュメントがない場合' do
      before do
        external_documents = instance_double(ActiveRecord::Relation)
        where_result = instance_double(ActiveRecord::Relation)

        allow(project).to receive(:external_documents).and_return(external_documents)
        allow(external_documents).to receive(:where).and_return(where_result)
        allow(where_result).to receive(:none?).and_return(true)
      end

      it 'trueを返すこと' do
        expect(project.all_documents_processed?).to be true
      end
    end

    context '未処理のドキュメントがある場合' do
      before do
        external_documents = instance_double(ActiveRecord::Relation)
        where_result = instance_double(ActiveRecord::Relation)

        allow(project).to receive(:external_documents).and_return(external_documents)
        allow(external_documents).to receive(:where).and_return(where_result)
        allow(where_result).to receive(:none?).and_return(false)
      end

      it 'falseを返すこと' do
        expect(project.all_documents_processed?).to be false
      end
    end
  end

  describe '#check_and_build_project_embeddings' do

  context 'ドキュメントがない場合' do
    let(:project) { create(:project) }

      it 'build_project_embeddingsを呼び出さないこと' do
        allow(project).to receive(:build_project_embeddings)
        project.check_and_build_project_embeddings
        expect(project).not_to have_received(:build_project_embeddings)
      end
    end

    context 'すべてのドキュメントが処理済みの場合' do
      let(:project) { create(:project, :with_external_documents) }

      before do
        allow(project).to receive(:all_documents_processed?).and_return(true)
      end

      it 'build_project_embeddingsを呼び出すこと' do
        allow(project).to receive(:build_project_embeddings)
        project.check_and_build_project_embeddings
        expect(project).to have_received(:build_project_embeddings)
      end
    end

    context '未処理のドキュメントがある場合' do
      let(:project) { create(:project, :with_external_documents) }

      before do
        allow(project).to receive(:all_documents_processed?).and_return(false)
      end

      it 'build_project_embeddingsを呼び出さないこと' do
        allow(project).to receive(:build_project_embeddings)
        project.check_and_build_project_embeddings
        expect(project).not_to have_received(:build_project_embeddings)
      end
    end
  end

  describe '#aggregate_external_document_texts' do
    it '外部ドキュメントのtextを改行で結合して返すこと' do
      project = create(:project)
      create(:external_document, attachable: project, text: 'text1')
      create(:external_document, attachable: project, text: 'text2')

      result = project.aggregate_external_document_texts

      expect(result.split("\n")).to match_array(%w[text1 text2])
    end

    it '外部ドキュメントが存在しない場合は空文字を返すこと' do
      project = create(:project)
      expect(project.aggregate_external_document_texts).to eq ''
    end

    it 'nilのtextは空文字として扱われること' do
      project = create(:project)
      create(:external_document, attachable: project, text: nil)
      create(:external_document, attachable: project, text: 'only_text')

      result = project.aggregate_external_document_texts

      # 余分な空行を除いて確認
      lines = result.split("\n").compact_blank
      expect(lines).to contain_exactly('only_text')
    end
  end

  describe '.build_key' do
    it '全てのパラメータが揃っている場合、正しいSHA256ハッシュを生成すること' do
      title = 'テスト案件'
      procedure_type = '一般競争入札'
      city = '東京都'
      url = 'https://example.com/project/1'
      lg_codes = ['13', '14']

      expected_values = [title, procedure_type, city, url, lg_codes.sort]
      expected_hash = Digest::SHA256.hexdigest(expected_values.to_json)

      result = Project.build_key(
        title: title,
        procedure_type: procedure_type,
        city: city,
        url: url,
        lg_codes: lg_codes
      )

      expect(result).to eq(expected_hash)
    end

    it 'lg_codesが空配列の場合、正しいハッシュを生成すること' do
      title = 'テスト案件'
      procedure_type = '一般競争入札'
      city = '東京都'
      url = 'https://example.com/project/1'
      lg_codes = []

      expected_values = [title, procedure_type, city, url, []]
      expected_hash = Digest::SHA256.hexdigest(expected_values.to_json)

      result = Project.build_key(
        title: title,
        procedure_type: procedure_type,
        city: city,
        url: url,
        lg_codes: lg_codes
      )

      expect(result).to eq(expected_hash)
    end

    it 'lg_codesが省略された場合、空配列として扱うこと' do
      title = 'テスト案件'
      procedure_type = '一般競争入札'
      city = '東京都'
      url = 'https://example.com/project/1'

      expected_values = [title, procedure_type, city, url, []]
      expected_hash = Digest::SHA256.hexdigest(expected_values.to_json)

      result = Project.build_key(
        title: title,
        procedure_type: procedure_type,
        city: city,
        url: url
      )

      expect(result).to eq(expected_hash)
    end

    it 'lg_codesにnilが含まれている場合、compactされること' do
      title = 'テスト案件'
      procedure_type = '一般競争入札'
      city = '東京都'
      url = 'https://example.com/project/1'
      lg_codes = ['13', nil, '14', nil]

      expected_values = [title, procedure_type, city, url, ['13', '14']]
      expected_hash = Digest::SHA256.hexdigest(expected_values.to_json)

      result = Project.build_key(
        title: title,
        procedure_type: procedure_type,
        city: city,
        url: url,
        lg_codes: lg_codes
      )

      expect(result).to eq(expected_hash)
    end

    it 'lg_codesが順序バラバラでも、ソート後に同じハッシュが生成されること' do
      title = 'テスト案件'
      procedure_type = '一般競争入札'
      city = '東京都'
      url = 'https://example.com/project/1'

      result1 = Project.build_key(
        title: title,
        procedure_type: procedure_type,
        city: city,
        url: url,
        lg_codes: ['13', '14', '27']
      )

      result2 = Project.build_key(
        title: title,
        procedure_type: procedure_type,
        city: city,
        url: url,
        lg_codes: ['27', '13', '14']
      )

      expect(result1).to eq(result2)
    end

    it '同じパラメータであれば常に同じハッシュが生成されること' do
      params = {
        title: 'テスト案件',
        procedure_type: '一般競争入札',
        city: '東京都',
        url: 'https://example.com/project/1',
        lg_codes: ['13', '14']
      }

      result1 = Project.build_key(**params)
      result2 = Project.build_key(**params)

      expect(result1).to eq(result2)
    end

    it '異なるパラメータでは異なるハッシュが生成されること' do
      base_params = {
        title: 'テスト案件',
        procedure_type: '一般競争入札',
        city: '東京都',
        url: 'https://example.com/project/1',
        lg_codes: ['13']
      }

      result_base = Project.build_key(**base_params)
      result_different_title = Project.build_key(**base_params.merge(title: '異なる案件'))
      result_different_city = Project.build_key(**base_params.merge(city: '大阪府'))
      result_different_lg_codes = Project.build_key(**base_params.merge(lg_codes: ['27']))

      expect(result_base).not_to eq(result_different_title)
      expect(result_base).not_to eq(result_different_city)
      expect(result_base).not_to eq(result_different_lg_codes)
    end
  end

  describe '.fetch_new_projects' do
    let(:user) { create(:user) }
    let(:first_preset) { create(:search_filter_preset, user: user) }
    let(:second_preset) { create(:search_filter_preset, user: user) }
    let!(:first_notification) { create(:search_filter_preset_notification, user: user, search_filter_preset: first_preset) }
    let!(:second_notification) { create(:search_filter_preset_notification, user: user, search_filter_preset: second_preset) }
    let(:relation) { SearchFilterPresetNotification.where(id: [first_notification.id, second_notification.id]) }
    let(:last_notified_at) { 2.hours.ago }

    it '各通知のプリセットごとに新着案件を取得し、ハッシュで返すこと' do
      projects_for_first = create_list(:project, 2)
      projects_for_second = [create(:project)]

      allow(Project).to receive(:search_with_search_filter_preset)
        .with(first_preset, last_notified_at)
        .and_return(instance_double(Elasticsearch::Model::Response::Response, records: projects_for_first))
      allow(Project).to receive(:search_with_search_filter_preset)
        .with(second_preset, last_notified_at)
        .and_return(instance_double(Elasticsearch::Model::Response::Response, records: projects_for_second))

      result = Project.fetch_new_projects(search_filter_preset_notifications: relation, last_notified_at: last_notified_at)

      expect(result.keys).to contain_exactly(first_preset, second_preset)
      expect(result[first_preset]).to match_array(projects_for_first)
      expect(result[second_preset]).to match_array(projects_for_second)

      expect(Project).to have_received(:search_with_search_filter_preset).with(first_preset, last_notified_at).once
      expect(Project).to have_received(:search_with_search_filter_preset).with(second_preset, last_notified_at).once
    end
  end

  describe '.fetch_new_recommendations' do
    let(:user) { create(:user) }
    let(:recommended_preset) { create(:search_filter_preset, user: user, recommended: true, business_description_embedding: { 'embedding' => 'vec' }) }
    let(:not_recommended_preset) { create(:search_filter_preset, user: user, recommended: false) }
    let!(:recommended_notification) { create(:search_filter_preset_notification, user: user, search_filter_preset: recommended_preset) }
    let!(:not_recommended_notification) { create(:search_filter_preset_notification, user: user, search_filter_preset: not_recommended_preset) }
    let(:relation) { SearchFilterPresetNotification.where(id: [recommended_notification.id, not_recommended_notification.id]) }

    it 'おすすめフラグがtrueのプリセットのみを対象にレコメンドを取得し、ハッシュで返すこと' do
      recommended_projects = create_list(:project, 2)

      allow(Project).to receive(:recommendation_search)
        .with([recommended_preset[:business_description_embedding]['embedding']], recommended_preset, [], size: 10, status: 'new')
        .and_return(instance_double(Elasticsearch::Model::Response::Response, records: recommended_projects))

      result = Project.fetch_new_recommendations(search_filter_preset_notifications: relation)

      expect(result.keys).to contain_exactly(recommended_preset)
      expect(result[recommended_preset]).to match_array(recommended_projects)
      expect(Project).to have_received(:recommendation_search).once
    end
  end

  describe '#summarize_and_save_summary' do
    before do
      # local? 環境だと早期returnするため、falseにスタブ
      allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('test'))
    end

    let(:project) { create(:project) }

    context '外部ドキュメントのテキストが空の場合' do
      it 'nilを返し、要約処理を実行しないこと' do
        allow(LlmTextSummarizer).to receive(:summarize)
        expect(project.summarize_and_save_summary).to be_nil
        expect(LlmTextSummarizer).not_to have_received(:summarize)
      end
    end

    context '要約と保存が成功する場合' do
      let(:summarized_text) { "【案件概要】概要\n\n【業務内容】\n- 作業A\n\n【応募要件】\n- 要件1" }
      let(:refines) do
        {
          'grades' => %w[A B],
          'is_experience_required' => '1',
          'is_office_required' => '0',
          'project_security_qualifications' => %w[ISMS ISO]
        }
      end

      before do
        # 外部ドキュメントのテキストを用意
        create(:external_document, attachable: project, text: '仕様書の本文1')
        create(:external_document, attachable: project, text: '仕様書の本文2')
        allow(LlmTextSummarizer).to receive(:summarize).and_return({ summary: summarized_text, refines: refines })
      end

      it 'サマリ文字列を返す' do
        result = project.summarize_and_save_summary
        expect(result).to eq(summarized_text)
      end

      it 'summary が更新される' do
        project.summarize_and_save_summary
        expect(project.reload.summary).to eq(summarized_text)
      end

      it '関連情報が更新される' do
        project.summarize_and_save_summary
        project.reload

        expect(project.project_grades.pluck(:grade)).to match_array(%w[A B])
        expect(project.is_experience_required).to be(true)
        expect(project.is_office_required).to be(false)
        expect(project.project_security_qualifications.pluck(:security_qualification)).to match_array(%w[ISMS ISO])
      end
    end

    context '更新に失敗する場合' do
      it ':update_failed を返し、値は更新されないこと' do
        create(:external_document, attachable: project, text: '仕様書の本文')

        summarized_text = 'dummy summary'
        refines = { 'grades' => %w[A], 'is_experience_required' => '0', 'is_office_required' => '1', 'project_security_qualifications' => [] }

        allow(LlmTextSummarizer).to receive(:summarize).and_return({ summary: summarized_text, refines: refines })
        allow(project).to receive(:update_with).and_return(false)

        original_summary = project.summary

        result = project.summarize_and_save_summary

        expect(result).to eq(:update_failed)
        expect(project.reload.summary).to eq(original_summary)
      end
    end
  end

  describe '#update_with (company project 用)' do
    let(:project) { create(:project) }
    let(:update_args) do
      {
        title: '更新された会社プロジェクト',
        procedure_type: '企画競争入札',
        organization_name: '更新された発注者',
        publication_date: Date.current + 1.day,
        application_document_deadline_date: Date.current + 11.days,
        proposal_document_deadline_date: Date.current + 16.days,
        bidding_deadline_date: Date.current + 21.days,
        planned_price: 8000000,
        is_experience_required: false,
        is_office_required: true
      }
    end

    it '更新が成功した場合は true を返すこと' do
      result = project.update_with(update_args)
      expect(result).to be true
    end

    it 'タイトルとraw_titleが更新されること' do
      project.update_with(update_args)
      project.reload
      expect(project.title).to eq('更新された会社プロジェクト')
      expect(project.raw_title).to be_nil
    end

    it 'URLと入札方式が更新されること' do
      project.update_with(update_args)
      project.reload
      expect(project.procedure_type).to eq('企画競争入札')
      expect(project.procedure_type_group).to eq('企画競争入札')
    end

    it '組織名と日付が更新されること' do
      project.update_with(update_args)
      project.reload
      expect(project.organization_name).to eq('更新された発注者')
      expect(project.publication_date).to eq(Date.current + 1.day)
      expect(project.application_document_deadline_date).to eq(Date.current + 11.days)
      expect(project.proposal_document_deadline_date).to eq(Date.current + 16.days)
      expect(project.bidding_deadline_date).to eq(Date.current + 21.days)
    end

    it '価格と必要条件が更新されること' do
      project.update_with(update_args)
      project.reload
      expect(project.planned_price).to eq(8000000)
      expect(project.is_experience_required).to be false
      expect(project.is_office_required).to be true
    end

    context '都道府県を更新する場合' do
      before do
        create(:project_lg_code, project: project, code: '13') # 元々東京都
        allow(LgCodeConverter).to receive(:to_code).with('大阪府').and_return('27')
      end

      it '既存のlg_codesを削除して新しいものを追加すること' do
        args_with_prefectures = update_args.merge(prefectures: ['大阪府'])

        expect {
          project.update_with(args_with_prefectures)
        }.to change { project.lg_codes.reload.pluck(:code) }.from(['13']).to(['27'])

        expect(project.lg_codes.reload.first.code).to eq('27')
      end
    end

    context 'セキュリティ資格を更新する場合' do
      before do
        project.project_security_qualifications.create!(security_qualification: 'ISMS')
      end

      it '既存の資格を削除して新しいものを追加すること' do
        # 有効な資格名を使用
        args_with_security = update_args.merge(project_security_qualifications: ['ISO', 'Pマーク'])

        expect {
          project.update_with(args_with_security)
        }.to change { project.project_security_qualifications.reload.count }.from(1).to(2)

        qualifications = project.project_security_qualifications.reload.pluck(:security_qualification)
        expect(qualifications).to contain_exactly('ISO', 'Pマーク')
      end
    end

    context '参加資格等級IDを更新する場合' do
      let!(:existing_grade) { create(:participate_qualification_grade) }
      let!(:first_new_grade) { create(:participate_qualification_grade) }
      let!(:second_new_grade) { create(:participate_qualification_grade) }

      before do
        project.project_participate_qualification_grades.create!(participate_qualification_grade: existing_grade)
      end

      it '既存の等級を削除して新しいものを追加すること' do
        args_with_grades = update_args.merge(participate_qualification_grade_ids: [first_new_grade.id, second_new_grade.id])

        expect {
          project.update_with(args_with_grades)
        }.to change { project.project_participate_qualification_grades.reload.count }.from(1).to(2)

        grade_ids = project.project_participate_qualification_grades.reload.pluck(:participate_qualification_grade_id)
        expect(grade_ids).to contain_exactly(first_new_grade.id, second_new_grade.id)
      end
    end

    it 'キーが存在しない属性は更新されないこと' do
      original_source = project.source
      original_key = project.key

      project.update_with(update_args)

      expect(project.source).to eq(original_source)
      expect(project.key).to eq(original_key)
    end
  end

  describe '#extract_participation_qualification_and_save' do
    before do
      # local? 環境だと早期returnするため、falseにスタブ
      allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('test'))
    end

    let(:project) { create(:project, summary: 'テスト案件のサマリ') }

    context 'summaryが空の場合' do
      it 'nilを返し、抽出処理を実行しないこと' do
        project.update(summary: nil)
        allow(LlmParticipateQualificationGradeExtractor).to receive(:extract)

        result = project.extract_participation_qualification_and_save

        expect(result).to be_nil
        expect(LlmParticipateQualificationGradeExtractor).not_to have_received(:extract)
      end
    end

    context 'LLMから参加資格が抽出できない場合' do
      before do
        allow(LlmParticipateQualificationGradeExtractor).to receive(:extract).and_return(
          { participate_qualifications: [], grades: [] }
        )
      end

      it 'nilを返し、update_withを呼び出さないこと' do
        allow(project).to receive(:update_with)

        result = project.extract_participation_qualification_and_save

        expect(result).to be_nil
        expect(project).not_to have_received(:update_with)
      end
    end

    context '参加資格等級が見つからない場合' do
      before do
        allow(LlmParticipateQualificationGradeExtractor).to receive(:extract).and_return(
          {
            participate_qualifications: ['存在しない参加資格'],
            grades: ['A']
          }
        )
      end

      it 'nilを返し、update_withを呼び出さないこと' do
        allow(project).to receive(:update_with)

        result = project.extract_participation_qualification_and_save

        expect(result).to be_nil
        expect(project).not_to have_received(:update_with)
      end
    end

    context '正常に参加資格等級が見つかった場合' do
      let!(:participate_qualification) { create(:participate_qualification, name: '東京都入札参加資格') }
      let!(:grade_a) { create(:participate_qualification_grade, participate_qualification: participate_qualification, name: 'A') }
      let!(:grade_b) { create(:participate_qualification_grade, participate_qualification: participate_qualification, name: 'B') }

      before do
        allow(LlmParticipateQualificationGradeExtractor).to receive(:extract).and_return(
          {
            participate_qualifications: ['東京都入札参加資格'],
            grades: ['A', 'B']
          }
        )
      end

      it 'ParticipateQualificationGradeの配列を返すこと' do
        result = project.extract_participation_qualification_and_save

        expect(result).to be_an(Array)
        expect(result.length).to eq(2)
        expect(result).to all(be_a(ParticipateQualificationGrade))
        expect(result.map(&:id)).to contain_exactly(grade_a.id, grade_b.id)
      end

      it 'update_withが正しいキー名（participate_qualification_grade_ids）で呼ばれること' do
        allow(project).to receive(:update_with).and_call_original

        project.extract_participation_qualification_and_save

        expect(project).to have_received(:update_with).with(
          hash_including(participate_qualification_grade_ids: [grade_a.id, grade_b.id])
        )
        project.extract_participation_qualification_and_save
      end

      it '参加資格等級が正しく保存されること' do
        expect {
          project.extract_participation_qualification_and_save
        }.to change { project.project_participate_qualification_grades.reload.count }.from(0).to(2)

        grade_ids = project.project_participate_qualification_grades.reload.pluck(:participate_qualification_grade_id)
        expect(grade_ids).to contain_exactly(grade_a.id, grade_b.id)
      end

      it '既存の参加資格等級を削除して新しいものを追加すること' do
        existing_grade = create(:participate_qualification_grade)
        project.project_participate_qualification_grades.create!(participate_qualification_grade: existing_grade)

        expect {
          project.extract_participation_qualification_and_save
        }.to change { project.project_participate_qualification_grades.reload.count }.from(1).to(2)

        grade_ids = project.project_participate_qualification_grades.reload.pluck(:participate_qualification_grade_id)
        expect(grade_ids).to contain_exactly(grade_a.id, grade_b.id)
        expect(grade_ids).not_to include(existing_grade.id)
      end
    end

    context '等級が空欄の場合' do
      let!(:participate_qualification) { create(:participate_qualification, name: '東京都入札参加資格') }
      let!(:grade_without_specification) do
        create(:participate_qualification_grade, participate_qualification: participate_qualification, name: '等級指定なし')
      end

      before do
        allow(LlmParticipateQualificationGradeExtractor).to receive(:extract).and_return(
          {
            participate_qualifications: ['東京都入札参加資格'],
            grades: []
          }
        )
      end

      it '等級指定なしの参加資格等級が保存されること' do
        expect {
          project.extract_participation_qualification_and_save
        }.to change { project.project_participate_qualification_grades.reload.count }.from(0).to(1)

        grade_id = project.project_participate_qualification_grades.reload.first.participate_qualification_grade_id
        expect(grade_id).to eq(grade_without_specification.id)
      end
    end

    context 'update_withが失敗した場合' do

      before do
        participate_qualification = create(:participate_qualification, name: '東京都入札参加資格')
        create(:participate_qualification_grade, participate_qualification: participate_qualification, name: 'A')
        allow(LlmParticipateQualificationGradeExtractor).to receive(:extract).and_return(
          {
            participate_qualifications: ['東京都入札参加資格'],
            grades: ['A']
          }
        )
        allow(project).to receive(:update_with).and_return(false)
      end

      it ':update_failedを返すこと' do
        result = project.extract_participation_qualification_and_save

        expect(result).to eq(:update_failed)
      end

      it '参加資格等級が保存されないこと' do
        expect {
          project.extract_participation_qualification_and_save
        }.not_to change(project.project_participate_qualification_grades.reload, :count)
      end
    end

    context 'エラーが発生した場合' do
      before do
        allow(LlmParticipateQualificationGradeExtractor).to receive(:extract).and_raise(StandardError.new('エラー'))
        allow(Rails.logger).to receive(:error)
        allow(Sentry).to receive(:capture_exception)
      end

      it 'エラーをログに記録し、Sentryに送信してから再発生させること' do
        expect {
          project.extract_participation_qualification_and_save
        }.to raise_error(StandardError, 'エラー')

        expect(Rails.logger).to have_received(:error).with('エラー')
        expect(Sentry).to have_received(:capture_exception).with(an_instance_of(StandardError))
      end
    end
  end
end
