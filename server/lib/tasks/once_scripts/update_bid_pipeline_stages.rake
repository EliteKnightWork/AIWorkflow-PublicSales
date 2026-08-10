namespace :once_scripts do
  desc 'bid_pipeline_statusesとbid_pipeline_task_statusesのstageカラムを更新する'
  task :update_bid_pipeline_stages => :environment do
    Rails.logger.info("=== Start update_bid_pipeline_stages #{Time.zone.now} ===")

    # ステータスとステージのマッピング
    bid_pipeline_status_mapping = {
      'お気に入り' => 'todo',
      '検討中' => 'todo',
      '入札参加' => 'doing',
      '落札' => 'done',
      '失注' => 'done',
      '不参加' => 'done'
    }

    bid_pipeline_task_status_mapping = {
      '予定' => 'todo',
      '対応中' => 'doing',
      '完了' => 'done'
    }

    errors = []

    Rails.logger.info("=== BidPipelineStatusの更新開始 ===")
    BidPipelineStatus.find_each do |status|
      begin
        stage = bid_pipeline_status_mapping[status.name]
        if stage.present?
          status.update_column(:stage, stage) # rubocop:disable Rails/SkipsModelValidations
          Rails.logger.info("Updated BidPipelineStatus #{status.id}: #{status.name} => #{stage}")
        else
          Rails.logger.warn("マッピングが見つかりません: BidPipelineStatus #{status.id}: #{status.name}")
        end
      rescue => e
        errors << {
          model: 'BidPipelineStatus',
          id: status.id,
          name: status.name,
          message: e.message
        }
        Rails.logger.error("BidPipelineStatus #{status.id}の処理中にエラーが発生: #{e.message}")
      end
    end

    Rails.logger.info("=== BidPipelineTaskStatusの更新開始 ===")
    BidPipelineTaskStatus.find_each do |status|
      begin
        stage = bid_pipeline_task_status_mapping[status.name]
        if stage.present?
          status.update_column(:stage, stage) # rubocop:disable Rails/SkipsModelValidations
          Rails.logger.info("Updated BidPipelineTaskStatus #{status.id}: #{status.name} => #{stage}")
        else
          Rails.logger.warn("マッピングが見つかりません: BidPipelineTaskStatus #{status.id}: #{status.name}")
        end
      rescue => e
        errors << {
          model: 'BidPipelineTaskStatus',
          id: status.id,
          name: status.name,
          message: e.message
        }
        Rails.logger.error("Error processing BidPipelineTaskStatus #{status.id}: #{e.message}")
      end
    end

    # エラーのサマリーを出力
    Rails.logger.info("=== #{errors.size}件のエラーが発生 ===")
    errors.each do |error|
      Rails.logger.info(error.inspect)
    end

    Rails.logger.info("=== End update_bid_pipeline_stages #{Time.zone.now} ===")
  end

  desc 'bid_pipeline_statusesのstageカラムを更新する（todo→doing, success_done→done, failed_done→done）'
  task :update_bid_pipeline_status_stages_v2 => :environment do
    Rails.logger.info("=== Start update_bid_pipeline_status_stages_v2 #{Time.zone.now} ===")

    # stage更新のSQL実行
    update_sql = <<~SQL.squish
      UPDATE bid_pipeline_statuses
      SET stage = CASE
        WHEN stage = 'todo' THEN 'doing'
        WHEN stage IN ('success_done', 'failed_done') THEN 'done'
        ELSE stage
      END
      WHERE stage IN ('todo', 'success_done', 'failed_done')
    SQL
    
    ActiveRecord::Base.connection.execute(update_sql)

    Rails.logger.info("=== End update_bid_pipeline_status_stages_v2 #{Time.zone.now} ===")
  end
end
