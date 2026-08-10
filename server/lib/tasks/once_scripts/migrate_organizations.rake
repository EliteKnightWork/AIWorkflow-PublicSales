namespace :once_scripts do
  desc 'organizationカラムの値をorganizationsテーブルに移行'
  task :migrate_organizations => :environment do
    # projects.organizationをorganizations.nameに移行
    sql = <<~SQL.squish
      INSERT INTO organizations (name, created_at, updated_at)
      SELECT organization_name, now(), now()
      FROM projects
      WHERE organization_name IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM organizations
        WHERE name = projects.organization_name
      )
      GROUP BY organization_name
    SQL
    ActiveRecord::Base.connection.execute(sql)

    # awarded_projects.organizationをorganizations.nameに移行
    sql = <<~SQL.squish
      INSERT INTO organizations (name, created_at, updated_at)
      SELECT organization_name, now(), now()
      FROM awarded_projects
      WHERE organization_name IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM organizations
        WHERE name = awarded_projects.organization_name
      )
      GROUP BY organization_name
    SQL
    ActiveRecord::Base.connection.execute(sql)

    # projects.organization_idをorganizations.idに移行
    # ただし、projects.organization_nameがNULLの場合はNULLをセット
    sql = <<~SQL.squish
      UPDATE projects
      SET organization_id = (
        SELECT id
        FROM organizations
        WHERE name = projects.organization_name
      )
      WHERE organization_name IS NOT NULL
    SQL
    ActiveRecord::Base.connection.execute(sql)

    # awarded_projects.organization_idをorganizations.idに移行
    # ただし、awarded_projects.organization_nameがNULLの場合はNULLをセット
    sql = <<~SQL.squish
      UPDATE awarded_projects
      SET organization_id = (
        SELECT id
        FROM organizations
        WHERE name = awarded_projects.organization_name
      )
      WHERE organization_name IS NOT NULL
    SQL
    ActiveRecord::Base.connection.execute(sql)
  end
end
