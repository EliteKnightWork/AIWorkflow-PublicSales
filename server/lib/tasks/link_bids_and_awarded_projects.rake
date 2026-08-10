# link_bids_and_awarded_projects.rake
# 入札案件と落札案件を紐付けるタスク
#
# 1. 検索候補の抽出 (ElasticSearch)
#   - 落札案件をベースに入札案件を検索
#   - 上位1件を取得
#   - must
#     - lg_codeが一致
#     - organization_nameが一致
#     - sourceが一致
#     - タイトルのキーワード分割したものが8件以上一致
#   - should
#     - 入札日が落札日の前後3日間
#     - タイトル間の類似度（more_like_this Query）
# 2. 候補のトップを対象にルールを適用して紐付け
#   2.1. 編集距離が閾値以上の場合は紐付けしない
#   2.2. 落札案件の落札日と入札案件の各種日付の差分が半年以上の場合は紐付けしない
#   TODO. 結果を見て徐々にルールを追加していく

namespace :link_bids_and_awarded_projects do
  desc '入札案件と落札案件を紐付ける'
  task :run, [:target_date, :threshold, :batch_size] => :environment do |_task, args|
    Rails.logger.info("=== Start link_bids_and_awarded_projects #{Time.zone.now} ===")
    args.with_defaults(
      target_date: Time.zone.yesterday.to_s,
      threshold: 0.3,
      batch_size: 100,
    )

    # 閾値を数値に変換
    threshold = args[:threshold].to_f

    Rails.logger.info("Arguments: target_date=#{args[:target_date]}, threshold=#{threshold}, batch_size=#{args[:batch_size]}")

    # 対象日付の落札案件を取得
    awarded_projects = Project.
      joins(:awarded_project, :lg_codes, :organization).
      where(registration_date: args[:target_date])

    awarded_projects.find_each(batch_size: args[:batch_size].to_i) do |awarded_project|
      target_project_id = get_target_project_id(awarded_project)
      if target_project_id.nil?
        next
      end

      target_project = Project.find(target_project_id)

      # 2.1. 編集距離を計算
      dist = normalized_levenshtein_distance(awarded_project.title, target_project.title)
      if dist > threshold
        Rails.logger.info("Skipping linking for awarded project ID #{awarded_project.id} due to high distance (#{dist})")
        next
      end

      # 2.2. 日付差分を計算
      if awarded_project.tender_opening_date.nil?
        Rails.logger.info("Skipping linking for awarded project ID #{awarded_project.id} due to missing tender opening date")
        next
      end

      date_diff = 0
      if target_project.bidding_deadline_date.present?
        date_diff = (awarded_project.tender_opening_date.to_date - target_project.bidding_deadline_date.to_date).abs.to_i
      elsif target_project.application_document_deadline_date.present?
        date_diff = (awarded_project.tender_opening_date.to_date - target_project.application_document_deadline_date.to_date).abs.to_i
      elsif target_project.proposal_document_deadline_date.present?
        date_diff = (awarded_project.tender_opening_date.to_date - target_project.proposal_document_deadline_date.to_date).abs.to_i
      elsif target_project.publication_date.present?
        date_diff = (awarded_project.tender_opening_date.to_date - target_project.publication_date.to_date).abs.to_i
      else
        Rails.logger.info("Skipping linking for awarded project ID #{awarded_project.id} due to missing relevant dates in bid project")
        next
      end

      if date_diff > 180  # 半年(約180日)以上の差分がある場合
        Rails.logger.info("Skipping linking for awarded project ID #{awarded_project.id} due to large date difference (#{date_diff} days)")
        next
      end

      ProjectAwardedLink.find_or_create_by!(
        project: target_project,
        project_awarded: awarded_project,
        linkage_evidences: {
          title_distance_threshold: threshold,
          title_distance: dist,
          date_difference_days: date_diff,
        }
      )

      Rails.logger.info("Linked awarded project ID #{awarded_project.id} with bid project ID #{target_project.id} (distance: #{dist})")
    end

    Rails.logger.info("=== End link_bids_and_awarded_projects #{Time.zone.now} ===")
  end

  def get_target_project_id(awarded_project)
    search_params = {
      tender_opening_date: awarded_project.tender_opening_date,
      lg_codes: awarded_project.lg_codes.pluck(:code),
      keywords: Project.analyze_text(awarded_project.title)['tokens'].pluck('token'),
      title: awarded_project.title,
      organization_name: awarded_project.organization.name,
      source: awarded_project.source,
    }

    hits = Project.get_same_project_by_awarded_project(search_params)
    project_ids = hits.records.ids

    project_ids.size > 0 ? project_ids[0] : nil
  end

  # 正規化されたLevenshtein距離(編集距離)を計算
  def normalized_levenshtein_distance(str1, str2)
    Levenshtein.normalized_distance(str1, str2)
  end
end
