namespace :one_shot do
  desc '新着案件のデフォルトの配信時間を設定する'
  task create_default_notification_timer_settings: :environment do
    User.find_each do |user|
      next if user.notification_timer_settings.exists?(notification_type: 'new_project')

      user.notification_timer_settings.create!(
        notification_type: 'new_project',
        hour: 9
      )
      Rails.logger.info("Processed user: #{user.id}")
    end
  end
end
