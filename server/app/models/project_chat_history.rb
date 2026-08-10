# == Schema Information
#
# Table name: project_chat_histories
# Database name: primary
#
#  id                            :bigint           not null, primary key
#  role(メッセージロール)        :string(255)      not null
#  value(メッセージ内容)         :text(65535)      not null
#  created_at                    :datetime         not null
#  updated_at                    :datetime         not null
#  project_id(プロジェクトID)    :bigint           not null
#  user_id(リクエストユーザーID) :bigint           not null
#
# Indexes
#
#  index_project_chat_histories_on_project_id  (project_id)
#  index_project_chat_histories_on_user_id     (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (user_id => users.id)
#
require 'pathname'

class ProjectChatHistory < ApplicationRecord
  belongs_to :user
  belongs_to :project
  
  validates :role, inclusion: { in: %w[system user], message: 'roleはsystemかuserのみ許可されています' }
  
end
