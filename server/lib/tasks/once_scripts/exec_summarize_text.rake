namespace :once_scripts do
  desc '過去1ヶ月の入札案件について、要約テキストの再生成と参加資格データの再取得をする'
  task :recreate_summary_and_get_participation_data => :environment do
    project_ids = Project.where(created_at: 1.month.ago..Time.zone.now).pluck(:id)
    Project.where(id: project_ids).find_each do |project|
      # 添付資料がない場合は対応しない
      next if project.external_documents.empty?
      Rails.logger.info("=== Start summarize_and_save_summary #{project.title} ===")
      begin
        project.summarize_and_save_summary
      rescue => e
        Rails.logger.error("=== Error in summarize_and_save_summary for project #{project.id}: #{e.message} ===")
        Sentry.capture_exception(e)
      end
    end
  end
end
