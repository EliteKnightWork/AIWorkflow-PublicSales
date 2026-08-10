namespace :notify do
  desc '絞り込み条件に合致する新着案件を通知'
  task :new_projects => :environment do
    current_hour = Time.current.hour
    current_time = Time.current

    User.find_each do |user|
      begin
        # companyに属さないuserは通知しない
        next if user.company.blank?

        notification_hours = user.notification_timer_settings
          .where(notification_type: 'new_project')
          .pluck(:hour)
        next unless notification_hours.include?(current_hour)

        last_notified_at = user.last_notified_at || Time.zone.yesterday

        Rails.logger.info("Processed notify for user: #{user.id} (#{user.email})")
        user.notify_new_projects(last_notified_at: last_notified_at)
        user.update_last_notified_at(last_notified_at: current_time)
      rescue => e
        error_message = "Failed to notify for user #{user.id}: #{e.message}"
        error_backtrace = e.backtrace.join("\n")

        Rails.logger.error(error_message)
        Rails.logger.error(error_backtrace)

        notify_service = NotifySlackService.new(ENV['SLACK_WEBHOOK_URL_FOR_ERROR'])
        notify_service.send_message("
          新着案件通知処理でエラーが発生しました\n
          ユーザーID: #{user.id}\n
          メールアドレス: #{user.email}\n
          エラーメッセージ: #{e.message}\n
          スタックトレース:\n
          ```\n
          #{error_backtrace}
          ```\n
        ")
        Sentry.capture_exception(e)
      end
    end
  end

  desc '案件管理のタスクを通知'
  task :tasks => :environment do
    current_hour = Time.current.hour

    User.find_each do |user|
      begin
        notification_setting = user.notification_timer_settings
          .find_by(notification_type: 'task', hour: current_hour)
        
        next if notification_setting.blank?

        Rails.logger.info("Processed task deadline notify for user: #{user.id} (#{user.email})")
        
        user.notify_task(days_before_due_date: notification_setting.days_before_due_date)
      rescue => e
        error_message = "Failed to notify task deadlines for user #{user.id}: #{e.message}"
        error_backtrace = e.backtrace.join("\n")

        Rails.logger.error(error_message)
        Rails.logger.error(error_backtrace)

        notify_service = NotifySlackService.new(ENV['SLACK_WEBHOOK_URL_FOR_ERROR'])
        notify_service.send_message("
          タスク期日通知処理でエラーが発生しました\n
          ユーザーID: #{user.id}\n
          メールアドレス: #{user.email}\n
          エラーメッセージ: #{e.message}\n
          スタックトレース:\n
          ```\n
          #{error_backtrace}
          ```\n
        ")
        Sentry.capture_exception(e)
      end
    end
  end
end
