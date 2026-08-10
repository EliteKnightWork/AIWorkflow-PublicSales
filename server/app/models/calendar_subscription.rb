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
class CalendarSubscription < ApplicationRecord
  encrypts :resource_id, :webhook_url, :client_state, :next_sync_token
  # NOTE: ユニークバリデーションに利用するため、deterministic: trueにする
  encrypts :subscription_id, deterministic: true

  belongs_to :user
  has_many :calendar_webhook_logs, dependent: :destroy

  validates :expires_at, presence: true
  validates :resource_id, presence: true
  validates :subscription_id, presence: true, uniqueness: true
  validates :provider, presence: true
  validates :webhook_url, presence: true
  validates :client_state, presence: true

  def expired?
    expires_at < Time.current
  end

  def check_client_state(client_state)
    self.client_state == client_state
  end
end
