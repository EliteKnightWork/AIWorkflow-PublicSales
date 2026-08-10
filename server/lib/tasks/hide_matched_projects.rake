namespace :hide_matched_projects do
  desc '特定の条件に該当するプロジェクトを非表示にする（落札案件と紐づかないもののみ）'
  task :run => :environment do
    Rails.logger.info("=== Start hide_projects #{Time.zone.now} ===")

    is_all = ActiveRecord::Type::Boolean.new.cast(ENV['ALL'])
    keywords = %w[終了 募集結果 実施結果 選定結果 結果の公表 決定しました の結果 結果を公表 質問と回答 質問回答 通知関係様式 ダウンロードしてください 各種様式ダウンロード 決まりました 決定いたしました 決定しました 質問書への回答 質問への回答 質問及び回答 質問書に対する回答 質問に対する回答 質問・回答表 審査結果 審査の結果 の結果について 検討状況について 運用支援事業者が決定 受託候補者が決定 優先交渉権者が決定 仕様書の訂正 入札参加資格 参加資格申請書 申請受付期間 参考資料 入札手続きについて 入札実施要綱 入札実施要領 様式・要綱 現場説明書 補助金交付要綱 通知関係様式 知事メッセージ 知事の動き 新着一覧 新着情報一覧 お探しのページは見つかりません お探しのページを見つけることができませんでした ご指定のページは見つかりませんでした ご指定のページまたはファイルが見つかりませんでした その他各種募集 職員等採用 サイトマップ 公開質問状 成果に関する報告書 影響はありません 事項の公表]
    keywords << "404 Not Found"
    query = keywords.map { |keyword| "raw_title LIKE '%#{ActiveRecord::Base.sanitize_sql_like(keyword)}%'" }.join(' OR ')
    projects = Project.
      where(query).
      where(hidden_at: nil).
      where.missing(:awarded_project)
    projects = projects.where(updated_at: 2.days.ago..) unless is_all

    projects.find_each do |project|
      project.update!(hidden_at: Time.zone.now)
    end

    Rails.logger.info("=== #{projects.count} projects are hidden ===")
    Rails.logger.info("=== End hide_projects #{Time.zone.now} ===")
  end
end

