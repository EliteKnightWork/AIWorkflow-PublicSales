namespace :once_scripts do
  desc '公告日より過去日の日付系カラムのデータをnullにする'
  task :nullify_past_dates => :environment do
    Rails.logger.info("=== Start nullify_past_dates #{Time.zone.now} ===")

    # これらのカラムの値が公告日より過去日の場合はnullにする
    columns = %w[
      briefing_session_date
      application_document_deadline_date
      proposal_document_deadline_date
      bidding_deadline_date
      tender_opening_date
      delivery_deadline_date
    ]

    columns.each do |column|
      Project.where("#{column} < publication_date").in_batches(of: 1000) do |relation|
        relation.update(column => nil)
      end
    end

    Rails.logger.info("=== End nullify_past_dates #{Time.zone.now} ===")
  end
end
