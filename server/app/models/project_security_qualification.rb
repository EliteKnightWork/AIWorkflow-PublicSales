# == Schema Information
#
# Table name: project_security_qualifications
# Database name: primary
#
#  id                                       :bigint           not null, primary key
#  security_qualification(セキュリティ資格) :string(255)      not null
#  created_at                               :datetime         not null
#  updated_at                               :datetime         not null
#  project_id(公告情報ID)                   :bigint           not null
#
# Indexes
#
#  idx_on_security_qualification_project_id_3ef983314f  (security_qualification,project_id) UNIQUE
#  index_project_security_qualifications_on_project_id  (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#
class ProjectSecurityQualification < ApplicationRecord
  belongs_to :project
  
  validates :security_qualification, presence: true
  validates :security_qualification, uniqueness: { scope: :project_id }

  validates :security_qualification, inclusion: { in: ["ISMS", "Pマーク", "ISO"] }
end
