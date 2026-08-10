# == Schema Information
#
# Table name: search_filter_presets
# Database name: primary
#
#  id                                                     :bigint           not null, primary key
#  business_description(事業情報)                         :text(4294967295)
#  business_description_embedding(事業情報の埋め込み情報) :json
#  json_attributes(検索条件)                              :json             not null
#  notification_required(配信要否)                        :boolean          default(TRUE), not null
#  project_type(プロジェクト種別)                         :string(255)      default("Project"), not null
#  recommended(おすすめ条件フラグ)                        :boolean          default(FALSE), not null
#  title(検索条件名)                                      :string(255)
#  created_at                                             :datetime
#  updated_at                                             :datetime
#  user_id(ユーザーID)                                    :bigint           not null
#
# Indexes
#
#  index_search_filter_presets_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :search_filter_preset do
    user
    title { Faker::Lorem.word }
    keywords { Faker::Lorem.words }
    or_keywords { Faker::Lorem.words }
    not_keywords { Faker::Lorem.words }
    prefectures { [1] }
    organizations { [Faker::Company.name] }
    procedure_types { ['一般競争入札'] }
    period { '1week' }
    notification_required { true }
    publication_date_from { Time.zone.today }
    publication_date_to { Time.zone.today }
    planned_price_from { 100000 }
    planned_price_to { 1000000 }
    is_experience_required { true }
    is_office_required { false }
    project_security_qualifications { ["ISMS"] }
    participate_qualification_ids { [1, 2] }
    participate_qualification_grade_ids { [1, 2] }
    participate_qualification_types { ["都道府県"] }
    participate_qualification_prefectures { ["1", "13"] }
    no_qualification { false }
    tender_opening_date_from { Time.zone.today }
    tender_opening_date_to { Time.zone.today }
    use_synonym_search { true }
    business_description { Faker::Lorem.paragraph }
    business_description_embedding { { embedding: Faker::Lorem.sentence } }
    recommended { false }

    trait :without_conditions do
      keywords { [] }
      or_keywords { [] }
      not_keywords { [] }
      prefectures { [] }
      organizations { [] }
      procedure_types { [] }
      procedure_type_groups { [] }
      period { nil }
      publication_date_from { nil }
      publication_date_to { nil }
      planned_price_from { nil }
      planned_price_to { nil }
      is_experience_required { nil }
      is_office_required { nil }
      project_security_qualifications { [] }
      participate_qualification_ids { [] }
      participate_qualification_grade_ids { [] }
      participate_qualification_types { [] }
      participate_qualification_prefectures { [] }
      no_qualification { nil }
      tender_opening_date_from { nil }
      tender_opening_date_to { nil }
      use_synonym_search { nil }
    end
  end
end
