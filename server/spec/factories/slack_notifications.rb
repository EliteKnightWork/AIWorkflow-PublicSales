# == Schema Information
#
# Table name: slack_notifications
# Database name: primary
#
#  id                       :bigint           not null, primary key
#  webhook_url(Webhook URL) :text(65535)      not null
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#
FactoryBot.define do
  factory :slack_notification do
    webhook_url { Faker::Internet.url }
  end
end
