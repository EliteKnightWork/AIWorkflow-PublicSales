# == Schema Information
#
# Table name: business_description_formats
# Database name: primary
#
#  id                                :bigint           not null, primary key
#  description(事業情報テキスト)     :text(4294967295) not null
#  embedding(事業情報の埋め込み情報) :json
#  created_at                        :datetime         not null
#  updated_at                        :datetime         not null
#  company_id(企業ID)                :bigint           not null
#
# Indexes
#
#  index_business_description_formats_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
FactoryBot.define do
  factory :business_description_format do
    description { Faker::Lorem.sentence }
    embedding { { embedding: Faker::Lorem.sentence } }
    company
  end
end
