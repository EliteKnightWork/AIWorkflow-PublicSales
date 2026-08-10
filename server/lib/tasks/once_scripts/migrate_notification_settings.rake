namespace :once_scripts do
  task :migrate_notification_settings => :environment do
    SearchFilterPreset.where(notification_required: true).find_each do |search_filter_preset|
      user = search_filter_preset.user
      search_filter_preset_notification = SearchFilterPresetNotification.find_or_initialize_by(search_filter_preset_id: search_filter_preset.id, user_id: user.id)
      search_filter_preset_notification.save!
    end
  end
end
