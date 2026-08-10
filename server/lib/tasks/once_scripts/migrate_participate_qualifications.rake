namespace :once_scripts do
  desc '参加資格に郡を追加し、既存のデータを更新する'
  task migrate_participate_qualifications: :environment do
    require 'csv'

    Rails.logger.info("=== Start migrate_participate_qualifications #{Time.zone.now} ===")

    file_path = Rails.root.join("db/csv/participate_qualifications.csv")
    unless File.exist?(file_path)
      Rails.logger.error("File not found: #{file_path}")
      return
    end

    csv_data = CSV.read(file_path, headers: true)

    target_qualifications = {}
    csv_data.each do |row|
      hash = row.to_hash

      next if hash['county'].blank?

      prefecture = hash['prefecture']
      county = hash['county']
      name = hash['name']

      target_qualifications[[prefecture, county + name]] = { county: county, name: name }
    end

    total_target_count = target_qualifications.size
    success_count = 0
    error_count = 0
    error_qualifications = []

    ActiveRecord::Base.transaction do
      target_qualifications.each do |(prefecture, prev_name), attrs|
        pq = ParticipateQualification.find_by(prefecture: prefecture, name: prev_name)
        if pq.nil?
          Rails.logger.warn("ParticipateQualification not found for prefecture: #{prefecture}, name: #{prev_name}")
          error_count += 1
          error_qualifications << { prefecture: prefecture, name: prev_name }
          next
        end

        if pq.update(county: attrs[:county], name: attrs[:name])
          success_count += 1
          Rails.logger.info("Updated ParticipateQualification ID #{pq.id} with county: #{attrs[:county]}, name: #{attrs[:name]}")
        else
          error_count += 1
          error_qualifications << { prefecture: prefecture, name: prev_name }
          Rails.logger.error("Failed to update ParticipateQualification ID #{pq.id}: #{pq.errors.full_messages.join(', ')}")
        end
      end
    end

    Rails.logger.info("Total target qualifications: #{total_target_count}")
    Rails.logger.info("Successfully updated: #{success_count}")
    Rails.logger.info("Failed to update: #{error_count}")
    if error_qualifications.any?
      Rails.logger.info("Failed qualifications details: #{error_qualifications.map { |q| "prefecture: #{q[:prefecture]}, name: #{q[:name]}" }.join('; ')}")
    end
    Rails.logger.info("=== End migrate_participate_qualifications #{Time.zone.now} ===")
  end
end