namespace :once_scripts do
  desc '新着案件のデフォルトの配信時間を設定する'
  task create_default_task_notification: :environment do
    User.find_each do |user|
      Rails.logger.info("=== Start create_default_task_notification #{user.id} ===")

      next if user.email.blank?

      task_notification_method = user.notification_methods.find_or_initialize_by(notifiable_type: 'EmailNotification', notification_type: 'task')

      if task_notification_method.notifiable.nil?
        task_notification_method.build_notifiable(email: user.email)
      else
        task_notification_method.notifiable.update!(email: user.email)
      end

      task_notification_method.update!(enabled: true)

      task_notification_timer_setting = user.notification_timer_settings.find_or_initialize_by(notification_type: 'task')

      if task_notification_timer_setting.hour.blank?
        task_notification_timer_setting.update!(hour: NotificationTimerSetting::DEFAULT_HOUR)
      end

      if task_notification_timer_setting.days_before_due_date.blank?
        task_notification_timer_setting.update!(days_before_due_date: NotificationTimerSetting::DEFAULT_DAYS_BEFORE_DUE_DATE)
      end

      task_notification_timer_setting.save!

      Rails.logger.info("=== End create_default_task_notification #{user.id} ===")
    end
  end
end
