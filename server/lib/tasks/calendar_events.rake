namespace :calendar_events do
  desc 'カレンダーイベントで作成失敗したイベントを再作成する'
  task :recreate => :environment do
    CalendarEvent.where(sync_status: 'syncing_failed').find_each do |event|
      event.sync_status = 'syncing'
      unless event.save
        message = "Failed to update sync status for event with ID: #{event.id}. Errors: #{event.errors.full_messages.join(', ')}"

        Rails.logger.error(message)
        Sentry.capture_message(message, level: 'error')
        next
      end

      user = event.user
      user_token = user.user_tokens.find_by(token_provider: event.provider)

      service = case user_token.token_provider
                when 'google_oauth2'
                  GoogleCalendarService.new(user_token)
                when 'microsoft_graph'
                  MicrosoftCalendarService.new(user_token)
                else
                  Rails.logger.warn("Unsupported provider: #{user_token.token_provider}")
                  next
                end

      begin
        subscription = user.calendar_subscriptions.find_by(provider: event.provider)
        if subscription.nil? || subscription.expired?
          webhook_url = case user_token.token_provider
                        when 'google_oauth2'
                          ENV['GOOGLE_CALENDAR_WEBHOOK_URL']
                        when 'microsoft_graph'
                          ENV['MICROSOFT_CALENDAR_WEBHOOK_URL']
                        end

          service.start_subscription(webhook_url)
        end

        created_event = service.create_event(
          {
            summary: build_summary(event),
            start: event.start_time,
            end: event.start_time + event.duration_minutes.minutes,
            description: "Labidによって作成された案件管理のイベントです。\n" + ENV['FRONTEND_BASE_URL'] + "/management",
            all_day: event.duration_minutes == 1440 # durationが24時間の分単位になっているものを全日イベントとみなす
          }
        )

        event_id = created_event.respond_to?(:[]) ? created_event['id'] : created_event.try(:id)
        sync_status = 'synced'
      rescue => e
        message = "Failed to recreate calendar event for user ID #{user.id}: #{e.message}"

        Rails.logger.error(message)
        Sentry.capture_message(message, level: 'error')
        event_id = nil
        sync_status = 'syncing_failed'
      end

      if event.update(event_id: event_id, sync_status: sync_status)
        Rails.logger.info("Successfully recreated calendar event for user ID #{user.id} with event ID #{event_id}")
      else
        message = "Failed to update calendar event with ID #{event.id}: #{event.errors.full_messages.join(', ')}"

        Rails.logger.error(message)
        Sentry.capture_message(message, level: 'error')
      end
    end
  end

  private

  def build_summary(event)
    case event.registrable_type
    when 'BidPipeline'
      "【Labid】#{CalendarEvent.ja_due_date_types[event.due_date_type]} : #{event.registrable.project.title}"
    when 'Task'
      "【Labid】タスク期日：" + event.registrable.title
    else
      ""
    end
  end
end