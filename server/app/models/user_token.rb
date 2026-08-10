# == Schema Information
#
# Table name: user_tokens
# Database name: primary
#
#  id                                  :bigint           not null, primary key
#  access_token(アクセストークン)      :text(65535)      not null
#  expires_at(有効期限)                :datetime         not null
#  refresh_token(リフレッシュトークン) :text(65535)      not null
#  token_provider(プロバイダー名)      :string(255)      not null
#  created_at                          :datetime         not null
#  updated_at                          :datetime         not null
#  user_id(ユーザーID)                 :bigint           not null
#
# Indexes
#
#  index_user_tokens_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class UserToken < ApplicationRecord
  encrypts :access_token, :refresh_token

  belongs_to :user

  validates :access_token, presence: true
  validates :expires_at, presence: true
  validates :refresh_token, presence: true
  validates :token_provider, presence: true

  def expired?
    expires_at < Time.current
  end
end
