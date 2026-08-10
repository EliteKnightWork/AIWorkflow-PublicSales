# == Schema Information
#
# Table name: project_reactions
# Database name: primary
#
#  id                                         :bigint           not null, primary key
#  reaction(リアクションタイプ(like/dislike)) :integer          not null
#  created_at                                 :datetime         not null
#  updated_at                                 :datetime         not null
#  project_id(案件ID)                         :bigint           not null
#  user_id(ユーザーID)                        :bigint           not null
#
# Indexes
#
#  index_project_reactions_on_project_id              (project_id)
#  index_project_reactions_on_project_id_and_user_id  (project_id,user_id) UNIQUE
#  index_project_reactions_on_user_id                 (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :project_reaction do
    project
    user
    reaction { 1 } # Default to 'like'
  end
end
