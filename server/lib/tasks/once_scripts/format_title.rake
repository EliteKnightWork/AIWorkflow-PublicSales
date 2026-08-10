namespace :once_scripts do
  desc 'Set formatted title for all projects with error handling and batching'
  task :format_title => :environment do
    Rails.logger.info("=== Start format_title #{Time.zone.now} ===")

    errors = []
    batch_size = 500
    total_count = Project.count
    processed_count = 0

    Project.find_in_batches(batch_size: batch_size) do |batch|
      batch.each do |project|
        begin
          tmp_title = project.raw_title
          tmp_title = tmp_title.gsub(/\A(?:【[^】]*年度】|【(?![^】]*年度)[^】]+】)\s*/, '')
          tmp_title = project.remove_phrase(tmp_title)

          if project.title != tmp_title
            project.update!(title: tmp_title)
          end
        rescue => e
          errors << { id: project.id, messages: e.message, raw_title: project.raw_title, title: project.title }
          Rails.logger.error("Error processing project #{project.id}: #{e.message}")
        end
      end

      processed_count += batch.size
      Rails.logger.info("Processed #{processed_count} out of #{total_count} projects")
    end

    Rails.logger.info("=== #{errors.size} errors found ===")
    errors.each do |error|
      Rails.logger.info(error.inspect)
    end

    Rails.logger.info("=== End format_title #{Time.zone.now} ===")
  end
end
