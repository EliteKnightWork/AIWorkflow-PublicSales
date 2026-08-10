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
class CompanyFunctionalLimitation < ApplicationRecord
  DEFAULT_MAX_SEARCH_FILTER_PRESET_NOTIFICATION_COUNT = 10
  DEFAULT_MAX_MEMBER_COUNT = 5
  DEFAULT_MAX_RECOMMENDATION_COUNT = 5
  DEFAULT_MAX_BUSINESS_DESCRIPTION_FORMAT_COUNT = 5

  belongs_to :company

  before_validation :set_default_values, on: :create

  validates :max_search_filter_preset_notification_count, :max_member_count, :max_recommendation_count, :max_business_description_format_count, numericality: { only_integer: true, greater_than: 0 }

  private

  def set_default_values
    self.max_search_filter_preset_notification_count ||= DEFAULT_MAX_SEARCH_FILTER_PRESET_NOTIFICATION_COUNT
    self.max_member_count ||= DEFAULT_MAX_MEMBER_COUNT
    self.max_recommendation_count ||= DEFAULT_MAX_RECOMMENDATION_COUNT
    self.max_business_description_format_count ||= DEFAULT_MAX_BUSINESS_DESCRIPTION_FORMAT_COUNT
  end
end
