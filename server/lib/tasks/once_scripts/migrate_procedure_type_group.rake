namespace :once_scripts do
  desc 'set procedure_type_group based on procedure_type'
  task migrate_procedure_type_group: :environment do
    Rails.logger.info("=== Start migrate_procedure_type_group #{Time.zone.now} ===")

    sql = <<~SQL.squish
      UPDATE projects
      SET procedure_type_group = CASE
        WHEN procedure_type LIKE '%一般競争入札%' THEN '一般競争入札'
        WHEN procedure_type LIKE '%指名競争入札%' OR procedure_type LIKE '%工事希望型指名競争入札%' OR procedure_type LIKE '%公募指名%' OR procedure_type LIKE '%希望指名%' THEN '指名競争入札'
        WHEN procedure_type LIKE '%公募プロポーザル%' OR procedure_type LIKE '%企画競争%' OR procedure_type LIKE '%プロポーザル%' OR procedure_type LIKE '%コンペ%' THEN '企画競争入札'
        WHEN procedure_type LIKE '%特命契約%' OR procedure_type LIKE '%少額契約%' OR procedure_type LIKE '%不落契約%' THEN '随意契約'
        WHEN procedure_type LIKE '%見積もり合わせ%' OR procedure_type LIKE '%オープンカウンター%' THEN '見積もり合わせ'
        WHEN procedure_type LIKE '%資料提供招請%' OR procedure_type LIKE '%情報提供招請%' OR procedure_type LIKE '%RFI%' THEN '資料招請'
        WHEN procedure_type LIKE '%RFC%' OR procedure_type LIKE '%意見招請%' THEN '意見招請'
        ELSE 'その他'
      END
    SQL
    ActiveRecord::Base.connection.execute(sql)

    Rails.logger.info("=== End migrate_procedure_type_group #{Time.zone.now} ===")
  end
end