# == Schema Information
#
# Table name: company_functional_limitations
# Database name: primary
#
#  id                                                                    :bigint           not null, primary key
#  max_business_description_format_count(事業情報フォーマット登録上限数) :integer          default(5), not null
#  max_member_count(メンバー登録上限数)                                  :integer          default(5), not null
#  max_recommendation_count(おすすめ案件登録上限数)                      :integer          default(5), not null
#  max_search_filter_preset_notification_count(検索条件配信登録上限数)   :integer          default(10), not null
#  created_at                                                            :datetime         not null
#  updated_at                                                            :datetime         not null
#  company_id(企業ID)                                                    :bigint           not null
#
# Indexes
#
#  index_company_functional_limitations_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
FactoryBot.define do
  factory :company_functional_limitation do
    company
    max_search_filter_preset_notification_count { 10 }
    max_recommendation_count { 5 }
    max_business_description_format_count { 3 }
  end
end
