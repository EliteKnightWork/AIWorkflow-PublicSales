# == Schema Information
#
# Table name: companies
# Database name: primary
#
#  id                               :bigint           not null, primary key
#  is_trial(トライアル契約かどうか) :boolean          default(FALSE), not null
#  name(企業名)                     :string(255)      not null
#  plan_name(プラン名)              :string(255)      default("Standard"), not null
#  created_at                       :datetime         not null
#  updated_at                       :datetime         not null
#
FactoryBot.define do
  factory :company do
    name { Faker::Company.name }
    is_trial { false }
  end
end
