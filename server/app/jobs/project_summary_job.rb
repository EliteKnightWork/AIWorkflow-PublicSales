class ProjectSummaryJob < ApplicationJob
  queue_as :default

  def perform(project_id)
    project = Project.find(project_id)
    
    Rails.logger.info("ProjectSummaryJob: Starting summary generation for project ID: #{project_id}")
    
    begin
      project.update!(processing_status: 'processing_summary')
      
      project.summarize_and_save_summary
      
      Rails.logger.info("ProjectSummaryJob: Completed summary generation for project ID: #{project_id}")
      
      project.update!(processing_status: 'completed')
      
    rescue => e
      Rails.logger.error("ProjectSummaryJob: Error generating summary for project ID: #{project_id}: #{e.message}")
      project.update!(processing_status: 'failed')
      Sentry.capture_exception(e)
      raise e
    end
  end
end
