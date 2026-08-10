# == Schema Information
#
# Table name: calendar_webhook_logs
# Database name: primary
#
#  id                                                       :bigint           not null, primary key
#  provider(プロバイダー名)                                 :string(255)      not null
#  raw_payload(受信したペイロード)                          :json             not null
#  received_at(受信日時)                                    :datetime         not null
#  created_at                                               :datetime         not null
#  updated_at                                               :datetime         not null
#  calendar_subscription_id(カレンダーサブスクリプションID) :bigint           not null
#
# Indexes
#
#  index_calendar_webhook_logs_on_calendar_subscription_id  (calendar_subscription_id)
#
# Foreign Keys
#
#  fk_rails_...  (calendar_subscription_id => calendar_subscriptions.id)
#
class CalendarWebhookLog < ApplicationRecord
  belongs_to :calendar_subscription

  validates :provider, presence: true
  validates :raw_payload, presence: true
  validates :received_at, presence: true
end
