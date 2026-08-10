namespace :once_scripts do
  desc '「検討中」のステータスをデフォルトに設定'
  task :change_default_pipeline_status => :environment do
    consideration_statuses = BidPipelineStatus.where(name: '検討中')

    if consideration_statuses.empty?
      puts "「検討中」のステータスが存在しません"
      next
    end

    total_updated = 0

    consideration_statuses.find_each do |status|
      puts "企業ID: #{status.company_id} の「検討中」ステータスをデフォルトに設定します"

      # is_default = trueに更新すると、after_saveコールバックにより
      # 他のステータスのis_defaultは自動的にfalseになる
      status.update!(is_default: true)
      total_updated += 1
    end

    puts "合計 #{total_updated} 件のステータスをデフォルトに設定しました"
  end
end
