namespace :once_scripts do
  desc "favoritesをproject_reactionsに移行する"
  task :migrate_favorites_to_project_reactions => :environment do
    Favorite.find_each do |favorite|
      ProjectReaction.find_or_create_by!(
        project_id: favorite.project_id,
        user_id: favorite.user_id,
        reaction: :like
      )
    end
  end
end
