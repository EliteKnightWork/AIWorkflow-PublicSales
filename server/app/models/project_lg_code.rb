# == Schema Information
#
# Table name: project_lg_codes
# Database name: primary
#
#  id                     :bigint           not null, primary key
#  code(都道府県コード)   :string(255)      not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  project_id(公告情報ID) :bigint           not null
#
# Indexes
#
#  index_project_lg_codes_on_code_and_project_id  (code,project_id) UNIQUE
#  index_project_lg_codes_on_project_id           (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#
class ProjectLgCode < ApplicationRecord
  belongs_to :project

  validates :code, presence: true
  validates :code, uniqueness: { scope: :project_id }

  def name
    LgCodeConverter.to_name(code)
  end
end
