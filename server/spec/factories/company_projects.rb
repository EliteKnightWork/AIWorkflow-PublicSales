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
FactoryBot.define do
  factory :company_project do
    company

    trait :with_project do
      after(:build) do |company_project|
        company_project.project = build(:project, company_project: company_project)
      end
    end
  end
end
