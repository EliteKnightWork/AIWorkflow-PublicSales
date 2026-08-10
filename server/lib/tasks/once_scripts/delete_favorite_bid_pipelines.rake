namespace :once_scripts do
  desc '「お気に入り」のステータスに紐づくbid_pipelinesレコードを削除'
  task :delete_favorite_bid_pipelines => :environment do
    favorite_statuses = BidPipelineStatus.where(name: 'お気に入り')

    if favorite_statuses.empty?
      puts "「お気に入り」のステータスが存在しません"
      next
    end

    total_deleted = 0

    favorite_statuses.find_each do |status|
      pipelines_count = status.bid_pipelines.count

      if pipelines_count > 0
        puts "企業ID: #{status.company_id} の「お気に入り」ステータスに紐づく #{pipelines_count} 件のパイプラインを削除します"

        status.bid_pipelines.find_each do |pipeline|
          pipeline.destroy!
          total_deleted += 1
        end
      end

      status.destroy!
    end

    puts "合計 #{total_deleted} 件のbid_pipelinesレコードを削除しました"
  end
end
