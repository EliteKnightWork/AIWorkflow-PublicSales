# == Schema Information
#
# Table name: project_awarded_links
# Database name: primary
#
#  id                              :bigint           not null, primary key
#  linkage_evidences(連携根拠情報) :json             not null
#  created_at                      :datetime         not null
#  updated_at                      :datetime         not null
#  project_awarded_id(落札案件ID)  :bigint           not null
#  project_id(案件ID)              :bigint           not null
#
# Indexes
#
#  idx_on_project_id_project_awarded_id_f143356934    (project_id,project_awarded_id) UNIQUE
#  index_project_awarded_links_on_project_awarded_id  (project_awarded_id)
#  index_project_awarded_links_on_project_id          (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_awarded_id => projects.id)
#  fk_rails_...  (project_id => projects.id)
#
class ProjectAwardedLink < ApplicationRecord
  belongs_to :project
  belongs_to :project_awarded, class_name: 'Project', inverse_of: :awarded_links

  validates :project_id, uniqueness: { scope: :project_awarded_id }
  validates :linkage_evidences, presence: true
end
