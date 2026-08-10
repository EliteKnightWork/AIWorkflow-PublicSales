namespace :once_scripts do
  desc 'Link awarded projects to organizations based on organization_name'
  task link_awarded_project_organizations: :environment do
    puts "開始: 既存の落札案件にorganizationを紐付けます"
    
    # organization_nameはあるがorganization_idがnilの落札案件を取得
    awarded_projects = AwardedProject
      .where(organization_id: nil)
      .where.not(organization_name: [nil, ''])
    
    total_count = awarded_projects.count
    puts "対象件数: #{total_count}件"
    
    if total_count == 0
      puts "紐付けが必要な落札案件はありません"
      return
    end
    
    processed_count = 0
    error_count = 0
    created_organizations = {}
    
    awarded_projects.find_each(batch_size: 100) do |awarded_project|
      begin
        organization_name = awarded_project.organization_name.strip
        
        # 既に作成済みの組織があるかチェック（メモリ効率化）
        if created_organizations[organization_name]
          organization = created_organizations[organization_name]
        else
          organization = Organization.find_or_create_by(name: organization_name)
          created_organizations[organization_name] = organization
        end
        
        # 落札案件に組織を紐付け
        awarded_project.update!(organization: organization)
        
        processed_count += 1
        
        # 進捗表示（100件ごと）
        if processed_count % 100 == 0
          puts "進捗: #{processed_count}/#{total_count} (#{(processed_count.to_f / total_count * 100).round(1)}%)"
        end
        
      rescue => e
        error_count += 1
        puts "エラー: 落札案件ID #{awarded_project.id} (#{awarded_project.organization_name}): #{e.message}"
      end
    end
    
    puts "完了: #{processed_count}件の落札案件を処理しました"
    puts "作成された組織数: #{created_organizations.count}件"
    puts "エラー件数: #{error_count}件" if error_count > 0
    
    # 結果確認
    remaining_count = AwardedProject
      .where(organization_id: nil)
      .where.not(organization_name: [nil, ''])
      .count
    
    puts "残り未紐付け件数: #{remaining_count}件"
  end
  
  desc 'Show statistics of awarded projects organization linking'
  task show_organization_stats: :environment do
    total_awarded_projects = AwardedProject.count
    with_organization_name = AwardedProject.where.not(organization_name: [nil, '']).count
    with_organization_id = AwardedProject.where.not(organization_id: nil).count
    needs_linking = AwardedProject
      .where(organization_id: nil)
      .where.not(organization_name: [nil, ''])
      .count
    
    puts "=== 落札案件の組織紐付け統計 ==="
    puts "総落札案件数: #{total_awarded_projects}件"
    puts "organization_name有り: #{with_organization_name}件"
    puts "organization_id有り: #{with_organization_id}件"
    puts "紐付け必要: #{needs_linking}件"
    puts "紐付け率: #{with_organization_id > 0 ? (with_organization_id.to_f / with_organization_name * 100).round(1) : 0}%"
  end
end