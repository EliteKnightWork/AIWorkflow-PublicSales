namespace :once_scripts do
  namespace :duplicate_awarded_projects do
    desc 'AwardedProjectの重複データを検出'
    task detect: :environment do
      puts "重複AwardedProjectの検出を開始します..."

      # 同一キーになるデータを検出
      duplicates_info = detect_duplicate_awarded_projects

      puts "重複キーの数: #{duplicates_info[:duplicate_keys].size}"
      puts "重複レコードの総数: #{duplicates_info[:total_duplicates]}"
    end

    desc 'AwardedProjectの重複データを統合・削除（ドライラン）'
    task dry_run: :environment do
      puts "重複AwardedProjectの統合（ドライラン）を開始します..."

      duplicates_info = detect_duplicate_awarded_projects

      if duplicates_info[:duplicate_keys].empty?
        puts "重複データは見つかりませんでした。"
        next
      end

      puts "#{duplicates_info[:duplicate_keys].size}個の重複キーが見つかりました。"

      duplicates_info[:duplicate_keys].each do |key, projects|
        puts "\n=== 処理対象: #{key[0..50]}... ==="

        # 残すレコードを決定（最新の更新日時のもの）
        project_to_keep = projects.max_by(&:updated_at)
        projects_to_remove = projects - [project_to_keep]

        puts "残すレコード: ID #{project_to_keep.id} (更新日: #{project_to_keep.updated_at})"
        puts "削除対象レコード: #{projects_to_remove.map(&:id).join(', ')}"
      end

      puts "\n=== Dry Run完了 ==="
      puts "実際に実行するには 'rails once_scripts:duplicate_awarded_projects:delete' を実行してください。"
    end

    desc 'AwardedProjectの重複データを削除'
    task delete: :environment do
      puts "重複AwardedProjectの削除を開始します..."
      puts "注意: この操作は元に戻せません。続行しますか？ (y/N)"

      input = STDIN.gets.chomp
      unless input.downcase == 'y'
        puts "処理を中止しました。"
        return
      end

      duplicates_info = detect_duplicate_awarded_projects

      if duplicates_info[:duplicate_keys].empty?
        puts "重複データは見つかりませんでした。"
        return
      end

      deleted_count = 0
      error_count = 0

      duplicates_info[:duplicate_keys].each do |key, projects|
        begin
          ActiveRecord::Base.transaction do
            # 残すレコードを決定（最新の更新日時のもの）
            project_to_keep = projects.max_by(&:updated_at)
            projects_to_remove = projects - [project_to_keep]

            puts "\n処理中: キー #{key[0..50]}..."
            puts "残すレコード: ID #{project_to_keep.id}"
            puts "削除対象: #{projects_to_remove.map(&:id).join(', ')}"

            projects_to_remove.each do |project_to_remove|
              # 関連データはAwardedProjectのdependent: :destroyにより自動で削除される
              project_to_remove.destroy!
              deleted_count += 1
            end
          end
        rescue => e
          puts "エラー: #{e.message}"
          error_count += 1
        end
      end

      puts "\n=== 処理完了 ==="
      puts "削除されたレコード数: #{deleted_count}"
      puts "エラー数: #{error_count}"
    end

    private

    def detect_duplicate_awarded_projects
      puts "AwardedProjectデータを読み込み中..."

      duplicate_keys = {}

      # バッチ処理で全てのキーを収集
      AwardedProject.eager_load(:lg_codes).find_in_batches(batch_size: 1000) do |batch|
        batch.each do |ap|
          key = Project.build_key(
            title: ap.title,
            procedure_type: ap.procedure_type,
            city: ap.city_name,
            url: ap.url,
            lg_codes: ap.lg_codes.map(&:code),
          )

          # キーごとにプロジェクトを蓄積
          if duplicate_keys[key]
            duplicate_keys[key] << ap
          else
            duplicate_keys[key] = [ap]
          end
        end
      end

      # 重複がないキー（1個のみ）を削除
      duplicate_keys.select! { |_, projects| projects.size > 1 }

      total_duplicates = duplicate_keys.values.sum(&:size)

      {
        duplicate_keys: duplicate_keys,
        total_duplicates: total_duplicates
      }
    end
  end
end
