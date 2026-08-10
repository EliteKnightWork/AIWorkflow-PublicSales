require "levenshtein"

namespace :hide_duplicated_awarded_projects do
  desc '重複した落札案件を非表示にする'
  task :run, [:size, :source, :min_project_id, :threshold, :dryrun] => :environment do |_task, args|
    args.with_defaults(size: 100, source: 'spreadsheets', min_project_id: 0, threshold: 0.3, dryrun: 'false')

    args[:threshold] = args[:threshold].to_f

    Rails.logger.info("=== Start hide_duplicated_awarded_projects #{Time.zone.now} ===")
    Rails.logger.info("Arguments: size=#{args[:size]}, source=#{args[:source]}, min_project_id=#{args[:min_project_id]}, threshold=#{args[:threshold]}, dryrun=#{args[:dryrun]}")

    total_hidden_count = 0
    hidden_at = Time.zone.now
    results = []

    if args[:dryrun] == 'true'
      Rails.logger.info("Dry run mode: No projects will be actually hidden.")
    end

    # スプレッドシートから登録した案件を対象とする
    target_awarded_projects = Project.
      joins(:awarded_project, :lg_codes, :organization).
      where(source: args[:source]).
      where(id: (args[:min_project_id].to_i + 1)..).
      where(hidden_at: nil).
      order(:id).
      limit(args[:size].to_i)

    max_project_id = target_awarded_projects.maximum(:id)

    target_awarded_projects.each do |p|
      p = Project.find(p.id) # hidden_atを更新されている可能性があるため再取得
      next if p.hidden_at.present?

      keywords = Project.analyze_text(p.title)['tokens'].pluck('token')

      search_params = {
        id: p.id,
        tender_opening_date: p.tender_opening_date,
        lg_codes: p.lg_codes.pluck(:code),
        keywords: keywords,
        title: p.title,
        organization_name: p.organization.name,
        source: p.source,
      }

      hits = Project.get_duplicated_awarded_projects(search_params)
      project_ids = hits.records.ids

      # ヒットする案件がない場合はスキップ
      next if project_ids.size == 0

      duplicated_project = Project.find(project_ids[0])

      # levenshtein距離が閾値より大きい場合は同一案件とみなさない
      dist = normalized_levenshtein_distance(p.title, duplicated_project.title)
      next if dist > args[:threshold]

      if args[:dryrun] == 'true'
        Rails.logger.info("Dry run: Skipping hiding duplicated project ID=#{p.id} (#{p.title})")
      else
        p.update!(hidden_at: hidden_at)
      end

      total_hidden_count += 1

      url_prefix = Rails.env.production? ? "https://labid.jp" : "https://dev.labid.jp"
      results << {
        original_project_id: p.id,
        original_title: p.title,
        original_url: "#{url_prefix}/projects/#{p.uuid}",
        duplicated_project_id: duplicated_project.id,
        duplicated_title: duplicated_project.title,
        duplicated_url: "#{url_prefix}/projects/#{duplicated_project.uuid}",
        levenshtein_distance: dist,
      }
    end

    if total_hidden_count > 0
      # 後からどの案件のhidden_atが設定されたか確認できるようにCSVで保存してS3にアップロード
      env_name = Rails.env.production? ? "prod" : "dev"
      dryrun_tag = args[:dryrun] == 'true' ? 'dryrun_' : ''

      file_name = "#{dryrun_tag}duplicated_awarded_projects_#{env_name}_#{Time.zone.now.strftime('%Y%m%d%H%M%S')}.csv"
      file_path = Rails.root.join('tmp', file_name)
      CSV.open(file_path, 'w', force_quotes: true) do |csv|
        csv << %w[original_project_id original_title original_url duplicated_project_id duplicated_title duplicated_url levenshtein_distance]
        results.each do |row|
          csv << [
            row[:original_project_id],
            row[:original_title],
            row[:original_url],
            row[:duplicated_project_id],
            row[:duplicated_title],
            row[:duplicated_url],
            row[:levenshtein_distance],
          ]
        end
      end

      upload_to_duplicated_awarded_project_deletion_s3(file_path, file_name)
    end

    Rails.logger.info("=== #{total_hidden_count} duplicated awarded projects are hidden ===")
    Rails.logger.info("Max processed project ID: #{max_project_id}") if max_project_id
    Rails.logger.info("=== End hide_duplicated_awarded_projects #{Time.zone.now} ===")
  end

  # 正規化されたLevenshtein距離(編集距離)を計算
  def normalized_levenshtein_distance(str1, str2)
    Levenshtein.normalized_distance(str1, str2)
  end

  def upload_to_duplicated_awarded_project_deletion_s3(file_path, file_name)
    s3 = Aws::S3::Resource.new
    bucket = s3.bucket(Settings.aws.s3.bucket.duplicated_awarded_project_deletion)
    obj = bucket.object(file_name)
    obj.upload_file(file_path)

    Rails.logger.info("Uploaded: #{obj.public_url}")
  end
end