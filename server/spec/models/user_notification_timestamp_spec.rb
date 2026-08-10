# == Schema Information
#
# Table name: user_notification_timestamps
# Database name: primary
#
#  id                                   :bigint           not null, primary key
#  last_notified_at(最後に通知した日時) :datetime         not null
#  created_at                           :datetime         not null
#  updated_at                           :datetime         not null
#  user_id(ユーザーID)                  :bigint           not null
#
# Indexes
#
#  index_user_notification_timestamps_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#

require 'rails_helper'

RSpec.describe UserNotificationTimestamp do
  describe 'associations' do
    it { is_expected.to belong_to(:user) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:last_notified_at) }
  end
end
