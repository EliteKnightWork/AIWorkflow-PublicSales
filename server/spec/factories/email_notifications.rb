# == Schema Information
#
# Table name: email_notifications
# Database name: primary
#
#  id                    :bigint           not null, primary key
#  email(メールアドレス) :text(65535)
#  created_at            :datetime
#  updated_at            :datetime
#
FactoryBot.define do
  factory :email_notification do
    email { Faker::Internet.email }
  end
end
