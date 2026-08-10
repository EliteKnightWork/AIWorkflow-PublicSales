Seeder.seed do
  def create_bid_pipeline(company:, project:, status:)
    bid_pipeline = BidPipeline.find_by(company: company, project: project) || FactoryBot.create(:bid_pipeline, company: company, project: project, status: status)
    bid_pipeline
  end

  company = Company.first
  status = company.bid_pipeline_statuses.first
  Project.limit(5).each do |project|
    create_bid_pipeline(company: company, project: project, status: status)
  end
end
