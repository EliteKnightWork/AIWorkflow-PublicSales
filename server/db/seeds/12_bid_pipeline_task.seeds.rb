Seeder.seed do
  def create_bid_pipeline_task(bid_pipeline:, status:)
    bid_pipeline_task = BidPipelineTask.find_by(bid_pipeline: bid_pipeline) || FactoryBot.create(:bid_pipeline_task, bid_pipeline: bid_pipeline, status: status)
    bid_pipeline_task
  end

  company = Company.first
  status = company.bid_pipeline_task_statuses.first
  company.bid_pipelines.limit(5).each do |bid_pipeline|
    create_bid_pipeline_task(bid_pipeline: bid_pipeline, status: status)
  end
end
