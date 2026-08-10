namespace :once_scripts do
  desc '既存Premiumプランの企業に対してPROPOSAL_DOCUMENT_CREATE機能を追加'
  task :migrate_init_company_features => :environment do
    Rails.logger.info("=== Start migrate_init_company_features #{Time.zone.now} ===")

    # デフォルトの機能を追加
    default_features = [
      { key: Feature::KEYS[:proposal_document_create], description: '提案書作成機能' },
      { key: Feature::KEYS[:ai_chat], description: 'AIチャット機能' },
    ]
    default_features.each do |feature|
      # すでに存在する場合はスキップ
      next if Feature.exists?(key: feature[:key])
      Feature.create!(feature)
    end
    
    # Premiumプランの企業に対してPROPOSAL_DOCUMENT_CREATE機能を追加
    Company.where(plan_name: 'Premium').find_each do |company|
      company.features << Feature.find_by(key: Feature::KEYS[:proposal_document_create])
    end
    
    Company.find_each do |company|
      next if company.bid_pipeline_task_statuses.any?
      company.send(:initialize_bid_pipeline_task_statuses)
      
      Rails.logger.info("Created initial bid pipeline task statuses for company #{company.id}")
    end
  end
end
