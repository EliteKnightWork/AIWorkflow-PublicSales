namespace :update_link do
  desc 'イチオシ検索条件の事業情報とお気に入り案件の紐付きを更新'
  task :favorite_projects => :environment do
    SearchFilterPreset.where(recommended: true).find_each do |preset|
      preset.link_favorite_projects
    end
  end
end
