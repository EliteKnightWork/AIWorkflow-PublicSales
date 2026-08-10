namespace :once_scripts do
  desc '参加資格等級データの等級名NULLを「等級指定なし」に変更し、orderを1始まりに変更する'
  task migrate_participate_qualification_grades: :environment do
    Rails.logger.info("=== Start migrate_participate_qualification_grades #{Time.zone.now} ===")

    ParticipateQualification.find_each do |pq|
      pq.participate_qualification_grades.each do |pqg|
        if pqg.name.nil?
          Rails.logger.info("Updating ParticipateQualificationGrade ID #{pqg.id} for ParticipateQualification ID #{pq.id}")
          pqg.update(name: '等級指定なし')
        end
      end

      # orderを1始まりに変更
      pq.participate_qualification_grades.order(order: 'DESC').each do |pqg|
        pqg.order = pqg.order + 1
        if pqg.save
          Rails.logger.info("Updated order for ParticipateQualificationGrade ID #{pqg.id} to #{pqg.order}")
        else
          Rails.logger.error("Failed to update order for ParticipateQualificationGrade ID #{pqg.id}: #{pqg.errors.full_messages.join(', ')}")
        end
      end
    end

    Rails.logger.info("=== End migrate_participate_qualification_grades #{Time.zone.now} ===")
  end
end