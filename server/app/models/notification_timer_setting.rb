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
class NotificationTimerSetting < ApplicationRecord
  NOTIFICATION_TYPES = %w[new_project task].freeze
  DEFAULT_NOTIFICATION_TYPE = 'new_project'.freeze
  DEFAULT_TASK_NOTIFICATION_TYPE = 'task'.freeze
  DEFAULT_HOUR = 9
  DEFAULT_DAYS_BEFORE_DUE_DATE = 3

  belongs_to :user

  validates :notification_type, presence: true, inclusion: { in: NOTIFICATION_TYPES }
  validates :hour, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 23 }
  validates :days_before_due_date, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 30 }
  validate :validate_settings_limit, on: :create

  private

  def validate_settings_limit
    return unless user

    existing_count = user.notification_timer_settings
                         .where(notification_type: notification_type)
                         .count

    case notification_type
    when 'new_project'
      setting_limit = User::MAX_SETTINGS_NEW_PROJECT
    when 'task'
      setting_limit = User::MAX_SETTINGS_TASK
    end

    if existing_count >= setting_limit
      errors.add(:base, "#{notification_type} に対する通知時間設定は最大#{setting_limit}件までです")
    end
  end
end
