namespace :db_import do
  desc "参加資格等級のマスタデータをインポートする"
  task participate_qualifications: :environment do
    require 'csv'

    file_path = Rails.root.join("db/csv/participate_qualifications.csv")

    unless File.exist?(file_path)
      puts "ファイルが存在しません: #{file_path}"
      next
    end

    csv_data = CSV.read(file_path, headers: true)

    total_count = csv_data.size
    success_count = 0
    error_count = 0
    error_messages = []

    begin
      ActiveRecord::Base.transaction do
        now = Time.current

        # 1) 参加資格（親）を一括でUpsert
        qualification_attrs_by_pref_name = {}
        csv_data.each do |row|
          hash = row.to_hash
          prefecture = hash['prefecture']
          name = hash['name']
          next if name.blank? || qualification_attrs_by_pref_name.key?([prefecture, name])

          qualification_attrs_by_pref_name[[prefecture, name]] = {
            name: name,
            prefecture: prefecture,
            county: hash['county'],
            municipality: hash['municipality'],
            participate_qualification_type: hash['participate_qualification_type'],
            lg_code: prefecture.present? ? LgCodeConverter.to_code(prefecture) : nil,
            created_at: now,
            updated_at: now
          }
        end

        # NOTE: ユニークキー制約(prefecture_or_none, name)を利用してUpsert
        ParticipateQualification.upsert_all(qualification_attrs_by_pref_name.values) # rubocop:disable Rails/SkipsModelValidations

        # 一括作成後に対象のみ再読込して [prefecture, name] -> id のマップを構築
        relevant_qualifications = ParticipateQualification.where(
          name: qualification_attrs_by_pref_name.keys.map { |_, name| name }
        ).to_a
        qualification_id_by_pref_name = relevant_qualifications.each_with_object({}) do |qualification, memo|
          memo[[qualification.prefecture, qualification.name]] = qualification.id
        end

        # 2) 等級（子）を一括でUpsert
        grade_attr_by_key = {}
        csv_data.each do |row|
          hash = row.to_hash
          name = hash['name']
          prefecture = row['prefecture']
          qualification_id = qualification_id_by_pref_name[[prefecture, name]]
          next unless qualification_id

          grade_name = hash['grade_name']
          next if grade_name.blank?

          order_value = hash['grade_order'].to_i

          key = "#{qualification_id}:#{order_value}"
          next if grade_attr_by_key.key?(key)

          grade_attr_by_key[key] = {
            participate_qualification_id: qualification_id,
            name: grade_name,
            order: order_value,
            created_at: now,
            updated_at: now
          }
        end

        # NOTE: ユニークキー制約(participate_qualification_id, order)を利用してUpsert
        ParticipateQualificationGrade.upsert_all(grade_attr_by_key.values) # rubocop:disable Rails/SkipsModelValidations
      end

      success_count = total_count
    rescue StandardError => e
      puts "エラーが発生しました: #{e.message}"
      error_count = total_count
      error_messages << "エラー: #{e.message}\n#{e.backtrace&.first(5)&.join("\n")}"
    end

    puts "マスタデータのインポートが完了しました。"
    puts "総件数: #{total_count}"
    puts "成功件数: #{success_count}"
    puts "エラー件数: #{error_count}"
    unless error_messages.empty?
      puts "エラー詳細:"
      error_messages.each do |error_message|
        puts error_message
      end
    end
  end

  desc "情報セキュリティ資格のマスタデータをインポートする"
  task security_qualifications: :environment do
    masters = [
      {
        code: 'ISMS',
        display_name: 'ISMS',
      },
      {
        code: 'ISO',
        display_name: 'ISO',
      },
      {
        code: 'Pマーク',
        display_name: 'Pマーク',
      }
    ]

    now = Time.current

    masters.each do |m|
      sq = SecurityQualification.find_or_initialize_by(code: m[:code])

      if sq.new_record? || sq.display_name != m[:display_name]
        sq.display_name = m[:display_name]
        sq.updated_at = now
        sq.created_at = now if sq.new_record?
        sq.save!
      end
    end
  end
end
