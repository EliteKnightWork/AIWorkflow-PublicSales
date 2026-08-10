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
require 'rails_helper'

RSpec.describe CalendarSubscription, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to have_many(:calendar_webhook_logs).dependent(:destroy) }
  end

  describe 'validations' do
    let(:subscription) { build(:calendar_subscription) }

    it { is_expected.to validate_presence_of(:expires_at) }
    it { is_expected.to validate_presence_of(:resource_id) }
    it { is_expected.to validate_presence_of(:subscription_id) }

    it { expect(subscription).to validate_uniqueness_of(:subscription_id)
      .ignoring_case_sensitivity
      .with_message('はすでに存在します') }

    it { is_expected.to validate_presence_of(:provider) }
    it { is_expected.to validate_presence_of(:webhook_url) }
    it { is_expected.to validate_presence_of(:client_state) }
  end
end
