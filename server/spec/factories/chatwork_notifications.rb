# == Schema Information
#
# Table name: chatwork_notifications
# Database name: primary
#
#  id                                   :bigint           not null, primary key
#  api_token(ChatworkのAPIトークン)     :text(65535)      not null
#  channel_name(Chatworkのチャンネル名) :string(255)      not null
#  created_at                           :datetime         not null
#  updated_at                           :datetime         not null
#  room_id(ChatworkのルームID)          :string(255)      not null
#
FactoryBot.define do
  factory :chatwork_notification do
    api_token { Faker::Internet.password }
    channel_name { Faker::Lorem.word }
    room_id { Faker::Number.number(digits: 8) }
  end
end
