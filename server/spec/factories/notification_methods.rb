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
FactoryBot.define do
  factory :notification_method do
    user
    notifiable factory: %i[email_notification]
    enabled { true }
    notification_type { 'new_project' }

    trait :email do
      notifiable factory: %i[email_notification]
    end

    trait :slack do
      notifiable factory: %i[slack_notification]
    end

    trait :chatwork do
      notifiable factory: %i[chatwork_notification]
    end
  end
end
