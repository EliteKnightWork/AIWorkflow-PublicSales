# == Schema Information
#
# Table name: bid_pipelines
# Database name: primary
#
#  id                                   :bigint           not null, primary key
#  created_at                           :datetime         not null
#  updated_at                           :datetime         not null
#  bid_pipeline_status_id(ステータスID) :bigint           not null
#  company_id(企業ID)                   :bigint           not null
#  project_id(案件ID)                   :bigint           not null
#
# Indexes
#
#  index_bid_pipelines_on_bid_pipeline_status_id     (bid_pipeline_status_id)
#  index_bid_pipelines_on_company_id                 (company_id)
#  index_bid_pipelines_on_company_id_and_project_id  (company_id,project_id) UNIQUE
#  index_bid_pipelines_on_project_id                 (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (bid_pipeline_status_id => bid_pipeline_statuses.id)
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (project_id => projects.id)
#
FactoryBot.define do
  factory :bid_pipeline do
    company
    project
    status factory: %i[bid_pipeline_status]
  end
end
