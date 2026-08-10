# == Schema Information
#
# Table name: project_participate_qualification_grades
# Database name: primary
#
#  id                                                 :bigint           not null, primary key
#  created_at                                         :datetime         not null
#  updated_at                                         :datetime         not null
#  participate_qualification_grade_id(参加資格等級ID) :bigint           not null
#  project_id(案件ID)                                 :bigint           not null
#
# Indexes
#
#  idx_on_participate_qualification_grade_id_2e963cee98            (participate_qualification_grade_id)
#  idx_on_project_id_participate_qualification_grade_i_20db2abb5f  (project_id,participate_qualification_grade_id) UNIQUE
#  index_project_participate_qualification_grades_on_project_id    (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (participate_qualification_grade_id => participate_qualification_grades.id)
#  fk_rails_...  (project_id => projects.id)
#
class ProjectParticipateQualificationGrade < ApplicationRecord
  belongs_to :participate_qualification_grade
  belongs_to :project

  validates :participate_qualification_grade_id, uniqueness: { scope: :project_id }
end
