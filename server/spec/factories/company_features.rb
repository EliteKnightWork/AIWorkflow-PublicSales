# == Schema Information
#
# Table name: company_features
# Database name: primary
#
#  id                 :bigint           not null, primary key
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  company_id(企業ID) :bigint           not null
#  feature_id(機能ID) :bigint           not null
#
# Indexes
#
#  index_company_features_on_company_id                 (company_id)
#  index_company_features_on_company_id_and_feature_id  (company_id,feature_id) UNIQUE
#  index_company_features_on_feature_id                 (feature_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (feature_id => features.id)
#
FactoryBot.define do
  factory :company_feature do
    company
    feature
  end
end
