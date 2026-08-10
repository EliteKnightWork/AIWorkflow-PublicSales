# == Schema Information
#
# Table name: security_qualifications
# Database name: primary
#
#  id                                       :bigint           not null, primary key
#  code(情報セキュリティ資格コード)         :string(255)      not null
#  display_name(情報セキュリティ資格表示名) :string(255)      not null
#  created_at                               :datetime         not null
#  updated_at                               :datetime         not null
#
# Indexes
#
#  index_security_qualifications_on_code  (code) UNIQUE
#
FactoryBot.define do
  factory :security_qualification do
    code { Faker::Lorem.word }
    display_name { Faker::Lorem.sentence }
  end
end
