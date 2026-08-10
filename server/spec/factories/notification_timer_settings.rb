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
FactoryBot.define do
  factory :notification_timer_setting do
    user
    notification_type { 'new_project' }
    hour { Faker::Number.between(from: 0, to: 23) }
    days_before_due_date { 0 }
  end
end
