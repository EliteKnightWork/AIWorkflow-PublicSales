# == Schema Information
#
# Table name: calendar_subscriptions
# Database name: primary
#
#  id                                                         :bigint           not null, primary key
#  client_state(クライアント検証用のカスタムUUID)             :string(255)      not null
#  expires_at(有効期限)                                       :datetime         not null
#  next_sync_token(次回同期用のトークン(Google Calendarのみ)) :text(65535)
#  provider(カレンダープロバイダー名)                         :string(255)      not null
#  webhook_url(Webhook URL)                                   :text(65535)      not null
#  created_at                                                 :datetime         not null
#  updated_at                                                 :datetime         not null
#  resource_id(リソースID)                                    :string(255)      not null
#  subscription_id(サブスクリプションID)                      :string(255)      not null
#  user_id(ユーザーID)                                        :bigint           not null
#
# Indexes
#
#  index_calendar_subscriptions_on_subscription_id  (subscription_id) UNIQUE
#  index_calendar_subscriptions_on_user_id          (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :calendar_subscription do
    user
    provider { Faker::Internet.domain_name }
    resource_id { Faker::Alphanumeric.alphanumeric(number: 10) }
    subscription_id { Faker::Alphanumeric.alphanumeric(number: 10) }
    expires_at { 30.days.from_now } # Example expiration date, adjust as necessary
    webhook_url { Faker::Internet.url } # Example webhook URL, adjust as necessary
    client_state { SecureRandom.uuid } # Custom UUID for Microsoft Graph client state
    next_sync_token { Faker::Alphanumeric.alphanumeric(number: 10) }

    created_at { Time.current }
    updated_at { Time.current }
  end
end
