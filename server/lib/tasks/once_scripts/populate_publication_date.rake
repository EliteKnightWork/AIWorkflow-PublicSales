namespace :once_scripts do
  # publication_dateが空の場合、registration_dateを代入する
  desc 'Set publication date for all projects with empty publication_date'
  task :populate_publication_date => :environment do
    Rails.logger.info("=== Start populate_publication_date #{Time.zone.now} ===")

    sql = <<~SQL.squish
      UPDATE projects
      SET publication_date = registration_date
      WHERE publication_date IS NULL;
    SQL
    ActiveRecord::Base.connection.execute(sql)

    Rails.logger.info("=== End populate_publication_date #{Time.zone.now} ===")
  end
end
