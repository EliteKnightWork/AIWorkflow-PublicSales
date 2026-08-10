# == Schema Information
#
# Table name: notification_methods
# Database name: primary
#
#  id                                  :bigint           not null, primary key
#  enabled(配信可否)                   :boolean          default(FALSE), not null
#  notifiable_type(配信手段のモデル名) :string(255)      not null
#  notification_type(通知の対象タイプ) :string(255)
#  created_at                          :datetime
#  updated_at                          :datetime
#  notifiable_id(配信手段のモデルID)   :bigint           not null
#  user_id(ユーザーID)                 :bigint           not null
#
# Indexes
#
#  idx_on_notification_type_notifiable_type_notifiable_60a23274dd  (notification_type,notifiable_type,notifiable_id)
#  index_notification_methods_on_user_id                           (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class NotificationMethod < ApplicationRecord
  delegated_type :notifiable, types: %w[EmailNotification SlackNotification ChatworkNotification]
  accepts_nested_attributes_for :notifiable

  belongs_to :user

  # NOTE: ある配信手段を有効にするとき、同じタイプの他の配信手段は無効にする
  before_validation :disable_same_type_notification_methods, if: -> { enabled? }

  # NOTE: 有効な配信手段名
  VALID_NOTIFICATION_METHODS = %w[email slack none].freeze
  VALID_NOTIFICATION_TYPES = %w[new_project task].freeze

  validates :notification_type, inclusion: { in: VALID_NOTIFICATION_TYPES }, allow_nil: true

  def notify(message)
    return unless enabled?

    notifiable.notify(message)
  end

  def value
    notifiable.class::VALUE
  end

  private

  def disable_same_type_notification_methods
    user.notification_methods
        .where(notifiable_type: notifiable_type, notification_type: notification_type)
        .where.not(id: id)
        .update(enabled: false)
  end
end
