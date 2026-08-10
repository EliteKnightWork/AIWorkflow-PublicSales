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
class ChatworkNotification < ApplicationRecord
  encrypts :api_token

  include Notifiable

  def notify(message)
    # TODO: Implement Chatwork notification
    logger.debug("Chatwork notification: #{message}")
    raise NotImplementedError
  end
end
