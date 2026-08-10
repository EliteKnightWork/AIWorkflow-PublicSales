# == Schema Information
#
# Table name: user_tokens
# Database name: primary
#
#  id                                  :bigint           not null, primary key
#  access_token(アクセストークン)      :text(65535)      not null
#  expires_at(有効期限)                :datetime         not null
#  refresh_token(リフレッシュトークン) :text(65535)      not null
#  token_provider(プロバイダー名)      :string(255)      not null
#  created_at                          :datetime         not null
#  updated_at                          :datetime         not null
#  user_id(ユーザーID)                 :bigint           not null
#
# Indexes
#
#  index_user_tokens_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :user_token do
    user

    access_token { Faker::Alphanumeric.alphanumeric(number: 20) }
    expires_at { 1.hour.from_now }
    refresh_token { Faker::Alphanumeric.alphanumeric(number: 20) }
    token_provider { Faker::Internet.domain_name }
    created_at { Time.current }
    updated_at { Time.current }
  end
end
