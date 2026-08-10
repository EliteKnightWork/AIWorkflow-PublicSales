# == Schema Information
#
# Table name: project_grades
# Database name: primary
#
#  id                     :bigint           not null, primary key
#  grade(等級)            :string(255)      not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  project_id(公告情報ID) :bigint           not null
#
# Indexes
#
#  index_project_grades_on_grade_and_project_id  (grade,project_id) UNIQUE
#  index_project_grades_on_project_id            (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#
class ProjectGrade < ApplicationRecord
  belongs_to :project

  validates :grade, presence: true
  validates :grade, uniqueness: { scope: :project_id }

  validates :grade, inclusion: { in: ["A", "B", "C", "D"] }
end
