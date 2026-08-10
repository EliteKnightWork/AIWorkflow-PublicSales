# == Schema Information
#
# Table name: organizations
# Database name: primary
#
#  id           :bigint           not null, primary key
#  name(組織名) :string(255)      not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
# Indexes
#
#  index_organizations_on_name  (name) UNIQUE
#
FactoryBot.define do
  factory :organization do
    name { Faker::Company.unique.name }
  end
end
