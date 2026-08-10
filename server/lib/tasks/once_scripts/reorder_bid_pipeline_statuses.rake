namespace :once_scripts do
  desc 'BidPipelineStatusのorderを隙間なく1から並べ直す'
  task reorder_bid_pipeline_statuses: :environment do
    processed_count = 0
    
    # 各企業・ステージごとに処理
    Company.find_each do |company|
      # stageごとにグループ化して処理
      BidPipelineStatus.stages.keys.each do |stage|
        # 対象のステータスを現在のorder順で取得
        statuses = company.bid_pipeline_statuses.where(stage: stage).order(:order, :id)
        
        # 一時的に大きな値に移動してUNIQUE制約を回避
        temp_offset = 9999
        
        # Step 1: 全てのorderを一時的に大きな値に変更
        statuses.each_with_index do |status, index|
          temp_order = temp_offset + index
          status.update!(order: temp_order)
        end
        
        # Step 2: 1から順に正しい値に再設定
        statuses.each_with_index do |status, index|
          new_order = index + 1
          status.update!(order: new_order)
          processed_count += 1
          
          puts "Updated: Company #{company.id} - Stage: #{stage} - Status: #{status.name} - Order: #{new_order}"
        end
      end
    end
    
    puts "\n処理完了: #{processed_count}件のステータスのorderを更新しました"
  end
end