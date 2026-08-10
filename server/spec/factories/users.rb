# == Schema Information
#
# Table name: users
# Database name: primary
#
#  id                               :bigint           not null, primary key
#  email(メールアドレス)            :string(255)
#  name(ユーザー名)                 :string(255)
#  created_at                       :datetime
#  updated_at                       :datetime
#  auth0_user_id(Auth0のユーザーID) :string(255)      not null
#  company_id(企業ID)               :bigint
#
# Indexes
#
#  index_users_on_auth0_user_id  (auth0_user_id) UNIQUE
#  index_users_on_company_id     (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
FactoryBot.define do
  factory :user do
    company
    name { Faker::Name.name }
    email { Faker::Internet.email }
    auth0_user_id { Faker::Alphanumeric.alphanumeric(number: 10) }
  end
end
