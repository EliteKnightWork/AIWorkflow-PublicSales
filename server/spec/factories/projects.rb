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
FactoryBot.define do
  factory :project do
    sequence(:key) { |n| "key#{n}" }
    raw_title { Faker::Lorem.sentence }
    title { Faker::Lorem.sentence }
    description { Faker::Lorem.paragraph }
    summary { Faker::Lorem.paragraph }
    organization_name { Faker::Company.name }
    organization
    prefecture_name { '東京都' }
    city_code { Faker::Number.number(digits: 5).to_s }
    city_name { '新宿区' }
    procedure_type { '一般競争入札' }
    procedure_type_group { '一般競争入札' }
    source { Faker::Lorem.word }
    external_document_url { Faker::Internet.url }
    publication_date { 7.days.ago }
    registration_date { Time.zone.today }
    briefing_session_date { Time.zone.today }
    application_document_deadline_date { Time.zone.today }
    proposal_document_deadline_date { Time.zone.today }
    bidding_deadline_date { Time.zone.today }
    delivery_deadline_date { Time.zone.today }
    tender_opening_date { Time.zone.today }
    is_backfilled { false }
    is_experience_required { false }
    is_office_required { false }
    planned_price { Faker::Number.number(digits: 7) }
    participation_qualification { Faker::Lorem.word }
    keywords { Faker::Lorem.words(number: 5).join(', ') }
    lg_code { Faker::Number.number(digits: 2).to_s }
    ulid { SecureRandom.urlsafe_base64(16) }

    after(:build) do |project|
      build_list(:project_lg_code, 2, project:)
    end

    trait :with_awarded_project do
      after(:create) do |project|
        create(:awarded_project, project:)
      end
    end

    trait :with_external_documents do
      after(:create) do |project|
        create_list(:external_document, 1, attachable: project)
      end
    end
  end
end
