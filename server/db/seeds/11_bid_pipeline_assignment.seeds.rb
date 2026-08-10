Seeder.seed do
  def create_bid_pipeline_assignment(bid_pipeline:, user:)
    bid_pipeline_assignment = BidPipelineAssignment.find_by(bid_pipeline: bid_pipeline, user: user) || FactoryBot.create(:bid_pipeline_assignment, bid_pipeline: bid_pipeline, user: user)
    bid_pipeline_assignment
  end

  company = Company.first
  user = company.users.first
  company.bid_pipelines.each_with_index do |bid_pipeline, index|
    next unless index.even?

    create_bid_pipeline_assignment(bid_pipeline: bid_pipeline, user: user)
  end
end
