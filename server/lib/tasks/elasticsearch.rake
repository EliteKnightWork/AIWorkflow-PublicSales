namespace :elasticsearch do
  namespace :reset_index do
    desc '全てのインデックスをリセットする'
    task all: :environment do
      Rake::Task['elasticsearch:reset_index:project'].invoke
      Rake::Task['elasticsearch:reset_index:organization'].invoke
    end

    desc 'Projectのインデックスをリセットする'
    task project: :environment do
      raise 'このコマンドは開発環境でのみ実行できます' unless Rails.env.development?

      Project.__elasticsearch__.create_index!(force: true)
    end

    desc 'Organizationのインデックスをリセットする'
    task organization: :environment do
      raise 'このコマンドは開発環境でのみ実行できます' unless Rails.env.development?

      Organization.__elasticsearch__.create_index!(force: true)
    end
  end

  namespace :update_index do
    desc 'Projectのインデックスを更新する'
    task project: :environment do
      if Rails.env.local?
        Rake::Task['elasticsearch:update_index:project_without_alias'].invoke
      else
        Rake::Task['elasticsearch:update_index:project_with_alias'].invoke
      end
    end

    desc 'Projectのインデックスを更新する(エイリアスなし)'
    task project_without_alias: :environment do
      Project.__elasticsearch__.create_index!(force: true)
      Project.__elasticsearch__.import(query: -> { includes_for_search } , batch_size: 50)
    end

    desc 'Projectのインデックス更新(エイリアスあり)'
    task project_with_alias: :environment do
      new_index_name = "#{Project.elastic_cloud_index(use_alias: false)}_#{Time.current.strftime('%Y%m%d%H%M%S')}"
      alias_name = Project.elastic_cloud_index
      task_start_time = Time.current

      Project.__elasticsearch__.create_index!(index: new_index_name, force: true)
      Rails.logger.info "===== created: #{new_index_name} ====="

      Project.__elasticsearch__.client.indices.put_settings(index: new_index_name, body: { refresh_interval: '30s' })
      Project.__elasticsearch__.import(query: -> { includes_for_search }, index: new_index_name, batch_size: 50)
      Project.__elasticsearch__.client.indices.put_settings(index: new_index_name, body: { refresh_interval: '1s' })
      Rails.logger.info "===== imported: #{new_index_name} ====="

      Project.switch_alias!(index_name: new_index_name, alias_name: alias_name)
      Rails.logger.info "===== alias switched: #{alias_name} -> #{new_index_name} ====="

      Project.__elasticsearch__.import(query: -> { includes_for_search.where(updated_at: (task_start_time..)) })
      Rails.logger.info "===== diff imported: #{alias_name} ====="

      Project.cleanup_old_indices!
      Rails.logger.info "===== old indices cleaned up ====="

    end

    desc 'Organizationのインデックスを更新する'
    task organization: :environment do
      if Rails.env.local?
        Organization.__elasticsearch__.create_index!(force: true)
        Organization.__elasticsearch__.import(query: -> { includes_for_search }, batch_size: 50)
      else
        Rake::Task['elasticsearch:update_index:organization_with_alias'].invoke
      end
    end

    desc 'Organizationのインデックス更新(エイリアスあり)'
    task organization_with_alias: :environment do
      new_index_name = "#{Organization.elastic_cloud_index(use_alias: false)}_#{Time.current.strftime('%Y%m%d%H%M%S')}"
      alias_name = Organization.elastic_cloud_index
      task_start_time = Time.current

      Organization.__elasticsearch__.create_index!(index: new_index_name, force: true)
      Rails.logger.info "===== created: #{new_index_name} ====="

      Organization.__elasticsearch__.client.indices.put_settings(index: new_index_name, body: { refresh_interval: '30s' })
      Organization.__elasticsearch__.import(query: -> { includes_for_search }, index: new_index_name, batch_size: 50)
      Organization.__elasticsearch__.client.indices.put_settings(index: new_index_name, body: { refresh_interval: '1s' })
      Rails.logger.info "===== imported: #{new_index_name} ====="

      Organization.switch_alias!(index_name: new_index_name, alias_name: alias_name)
      Rails.logger.info "===== alias switched: #{alias_name} -> #{new_index_name} ====="

      # 差分インポート
      Organization.__elasticsearch__.import(query: -> { includes_for_search.where(updated_at: (task_start_time..)) })
      Rails.logger.info "===== diff imported: #{alias_name} ====="

      Organization.cleanup_old_indices!
      Rails.logger.info "===== old indices cleaned up ====="
    end
  end
end
