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
require 'rails_helper'

RSpec.describe CompanyFunctionalLimitation, type: :model do
  describe 'validations' do
    subject { build(:company_functional_limitation) }

    it { is_expected.to validate_numericality_of(:max_search_filter_preset_notification_count).only_integer.is_greater_than(0) }
    it { is_expected.to validate_numericality_of(:max_member_count).only_integer.is_greater_than(0) }
    it { is_expected.to validate_numericality_of(:max_recommendation_count).only_integer.is_greater_than(0) }
    it { is_expected.to validate_numericality_of(:max_business_description_format_count).only_integer.is_greater_than(0) }
  end
end
