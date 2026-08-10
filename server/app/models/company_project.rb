# == Schema Information
#
# Table name: company_projects
# Database name: primary
#
#  id                 :bigint           not null, primary key
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  company_id(企業ID) :bigint           not null
#
# Indexes
#
#  index_company_projects_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
class CompanyProject < ApplicationRecord
  belongs_to :company

  has_one :project, dependent: :destroy, inverse_of: :company_project

end
