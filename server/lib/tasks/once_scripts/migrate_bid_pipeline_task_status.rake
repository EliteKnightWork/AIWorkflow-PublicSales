namespace :once_scripts do
  desc '既存企業に対してbid_pipeline_task_statusのデフォルトデータを追加'
  task :migrate_bid_pipeline_task_status => :environment do
    Company.find_each do |company|
      next if company.bid_pipeline_task_statuses.any?
      company.send(:initialize_bid_pipeline_task_statuses)
      puts "Created initial bid pipeline task statuses for company #{company.id}"
    end
  end
end
