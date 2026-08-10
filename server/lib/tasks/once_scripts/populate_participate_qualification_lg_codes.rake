namespace :once_scripts do
  desc 'ParticipateQualificationテーブルのprefectureカラムの値からlg_codeを設定'
  task :populate_participate_qualification_lg_codes => :environment do
    Rails.logger.info("=== Start populate_participate_qualification_lg_codes #{Time.zone.now} ===")

    updated_count = 0

    ParticipateQualification.where(lg_code: nil).or(ParticipateQualification.where(lg_code: '')).find_each do |qualification|
      next if qualification.prefecture.blank?

      lg_code = LgCodeConverter.to_code(qualification.prefecture)
      if lg_code.present?
        qualification.update!(lg_code: lg_code)
        updated_count += 1
        Rails.logger.info("Updated qualification ID: #{qualification.id}, prefecture: '#{qualification.prefecture}' -> lg_code: '#{lg_code}'")
      end
    end

    Rails.logger.info("Updated: #{updated_count} records")
    Rails.logger.info("=== End populate_participate_qualification_lg_codes #{Time.zone.now} ===")
  end
end