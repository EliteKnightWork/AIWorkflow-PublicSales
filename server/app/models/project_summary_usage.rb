# == Schema Information
#
# Table name: project_summary_usages
# Database name: primary
#
#  id                     :bigint           not null, primary key
#  created_at             :datetime         not null
#  company_id(企業ID)     :bigint           not null
#  project_id(公告情報ID) :bigint           not null
#
# Indexes
#
#  index_project_summary_usages_on_company_id                 (company_id)
#  index_project_summary_usages_on_company_id_and_project_id  (company_id,project_id) UNIQUE
#  index_project_summary_usages_on_project_id                 (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (project_id => projects.id)
#
class ProjectSummaryUsage < ApplicationRecord
  belongs_to :company
  belongs_to :project

  validates :project_id, uniqueness: { scope: :company_id }
end
