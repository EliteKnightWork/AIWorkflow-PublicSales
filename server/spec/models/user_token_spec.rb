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
require 'rails_helper'

RSpec.describe UserToken, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:user) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:access_token) }
    it { is_expected.to validate_presence_of(:expires_at) }
    it { is_expected.to validate_presence_of(:refresh_token) }
    it { is_expected.to validate_presence_of(:token_provider) }
  end
end
