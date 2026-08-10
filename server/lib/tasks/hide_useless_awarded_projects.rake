namespace :hide_useless_awarded_projects do
  desc '落札日, 落札企業, 落札金額が全て存在しない落札案件を非表示にする'
  task :run => :environment do
    Rails.logger.info("=== Start hide_useless_awarded_projects #{Time.zone.now} ===")

    awarded_projects = AwardedProject.joins(:project).
      where(successful_bid_price: nil).
      where(project: { tender_opening_date: nil }).
      where(project: { hidden_at: nil }).
      where.missing(:bidders)

    hidden_count = awarded_projects.count

    awarded_projects.find_each do |awarded_project|
      awarded_project.project.update!(hidden_at: Time.zone.now)
    end

    Rails.logger.info("=== #{hidden_count} awarded projects are hidden ===")
    Rails.logger.info("=== End hide_useless_awarded_projects #{Time.zone.now} ===")
  end
end
