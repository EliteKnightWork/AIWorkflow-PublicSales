namespace :once_scripts do
  desc '既存企業に対してbid_pipeline_statusのデフォルトデータを追加'
  task :migrate_bid_pipeline_status => :environment do
    Company.find_each do |company|
      next if company.bid_pipeline_statuses.exists?
      company.initialize_bid_pipeline_statuses
      puts "Created initial bid pipeline statuses for company #{company.id}"
    end
  end

  desc '既存企業に対してdoneステータスをsuccess_done/failed_doneに変更'
  task :migrate_done_status => :environment do
    Company.find_each do |company|
      company.bid_pipeline_statuses.where(stage: 'done').find_each do |done_status|

        case done_status.name
        when '落札'
          done_status.update_column(:stage, 'success_done')# rubocop:disable Rails/SkipsModelValidations
        when '失注', '不参加'
          done_status.update_column(:stage, 'failed_done')# rubocop:disable Rails/SkipsModelValidations
        end
      end

      puts "Updated done statuses for company #{company.id}"
    end
  end
end
