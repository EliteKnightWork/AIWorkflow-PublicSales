class DocumentProcessingJob < ApplicationJob
  queue_as :default

  def perform(project_id)
    project = Project.find(project_id)
    
    Rails.logger.info("DocumentProcessingJob: Starting text extraction for project ID: #{project_id}")
    
    begin
      project.update!(processing_status: 'processing_documents')
      
      project.external_documents.each do |external_document|
        external_document.extract_and_update_text
      end
      
      Rails.logger.info("DocumentProcessingJob: Completed text extraction for project ID: #{project_id}")
      
      # 文字抽出完了後、サマライズジョブをキューに追加
      ProjectSummaryJob.perform_later(project_id)
      
    rescue => e
      Rails.logger.error("DocumentProcessingJob: Error processing documents for project ID: #{project_id}: #{e.message}")
      project.update!(processing_status: 'failed')
      Sentry.capture_exception(e)
      raise e
    end
  end
end
