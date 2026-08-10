# == Schema Information
#
# Table name: notification_timer_settings
# Database name: primary
#
#  id                                             :bigint           not null, primary key
#  days_before_due_date(期日の何日前に通知するか) :integer          default(3), not null
#  hour(通知時間)                                 :integer          default(9), not null
#  notification_type(通知タイプ)                  :string(255)      not null
#  created_at                                     :datetime         not null
#  updated_at                                     :datetime         not null
#  user_id(ユーザーID)                            :bigint           not null
#
# Indexes
#
#  idx_on_user_id_notification_type_d4d1fe44ed   (user_id,notification_type)
#  index_notification_timer_settings_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#

require 'rails_helper'

RSpec.describe NotificationTimerSetting do
  describe 'associations' do
    it { is_expected.to belong_to(:user) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:notification_type) }
    it { is_expected.to validate_presence_of(:hour) }
    it { is_expected.to validate_numericality_of(:hour).only_integer.is_greater_than_or_equal_to(0).is_less_than_or_equal_to(23) }
    it { is_expected.to validate_presence_of(:days_before_due_date) }
    it { is_expected.to validate_numericality_of(:days_before_due_date).only_integer.is_greater_than_or_equal_to(0).is_less_than_or_equal_to(30) }
  end

  describe 'validate: validate_settings_limit' do
    let(:user) { create(:user) }

    context 'new_projectの通知時間設定が上限以上ある場合' do
      before do
        user.notification_timer_settings.destroy_all
      end

      it 'エラーが発生すること' do
        # MAX_SETTINGS_NEW_PROJECTの数だけ通知時間設定を作成
        User::MAX_SETTINGS_NEW_PROJECT.times do |_i|
          create(:notification_timer_setting, user: user, notification_type: 'new_project', hour: Faker::Number.between(from: 0, to: 23))
        end

        expect {
          create(:notification_timer_setting, user: user, notification_type: 'new_project', hour: Faker::Number.between(from: 0, to: 23))
        }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end

    context 'taskの通知時間設定が上限以上ある場合' do
      before do
        user.notification_timer_settings.destroy_all
      end

      it 'エラーが発生すること' do
        User::MAX_SETTINGS_TASK.times do |_i|
          create(:notification_timer_setting, user: user, notification_type: 'task', hour: Faker::Number.between(from: 0, to: 23))
        end

        expect {
          create(:notification_timer_setting, user: user, notification_type: 'task', hour: Faker::Number.between(from: 0, to: 23))
        }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end
  end
end
