module V1
  module BidPipelines
    class CalendarEventsController < ApplicationController
      def create
        bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])

        if params[:start_date_time].blank?
          render json: { error: 'Start date time is required' }, status: :bad_request
          return
        end

        if params[:due_date_type].blank?
          render json: { error: 'Due date type is required' }, status: :bad_request
          return
        end

        if params[:all_day]
          params[:duration] = 24 * 60 # Default to 24 hours for all-day events
        end

        has_error = false
        bid_pipeline.assigned_users.each do |user|
          next if user.calendar_events.exists?(
            registrable: bid_pipeline,
            sync_status: %w[synced syncing],
            due_date_type: params[:due_date_type]
          )

          user_token = user.user_tokens.where(token_provider: %w[google_oauth2 microsoft_graph]).first
          next unless user_token

          service = case user_token.token_provider
          when 'google_oauth2'
            GoogleCalendarService.new(user_token)
          when 'microsoft_graph'
            MicrosoftCalendarService.new(user_token)
          else
            Rails.logger.warn("Unsupported provider: #{user_token.token_provider}")
            next
          end

          # 同期失敗(syncing_failed)のデータがあれば上書きする
          calendar_event = user.calendar_events.find_or_initialize_by(
            registrable: bid_pipeline,
            provider: user_token.token_provider,
            sync_status: %w[syncing_failed],
            due_date_type: params[:due_date_type]
          )

          calendar_event.assign_attributes(
            sync_status: 'syncing',
            start_time: params[:start_date_time].to_datetime,
            duration_minutes: params[:duration].to_i
          )
          unless calendar_event.save
            log_error("カレンダーイベントの作成に失敗しました。 UserID #{user.id}: #{calendar_event.errors.full_messages.join(', ')}")
            has_error = true
            next
          end

          begin
            subscription = user.calendar_subscriptions.find_by(provider: user_token.token_provider)
            if subscription.nil? || subscription.expired?
              webhook_url = case user_token.token_provider
              when 'google_oauth2'
                ENV['GOOGLE_CALENDAR_WEBHOOK_URL']
              when 'microsoft_graph'
                ENV['MICROSOFT_CALENDAR_WEBHOOK_URL']
              end

              service.start_subscription(webhook_url)
            end

            base_url = ENV['FRONTEND_BASE_URL'] || 'http://localhost:8080'

            event = service.create_event({
              summary: "【Labid】#{CalendarEvent.ja_due_date_types[params[:due_date_type]]} : #{bid_pipeline.project.title}",
              start: params[:start_date_time].to_datetime,
              end: params[:start_date_time].to_datetime + params[:duration].to_i.minutes,
              description: "Labidによって作成された案件管理のイベントです。\n" + base_url + "/management",
              all_day: params[:all_day] || false,
            })

            event_id = event.respond_to?(:[]) ? event['id'] : event.try(:id)
            sync_status = 'synced'
          rescue => e
            log_error(
              "カレンダーイベント作成中にエラーが発生しました。UserID #{user.id}: #{e.message}",
              { user_id: user.id, bid_pipeline_id: bid_pipeline.id },
            )
            event_id = nil
            sync_status = 'syncing_failed'
            has_error = true
          end

          unless calendar_event.update(event_id: event_id, sync_status: sync_status)
            log_error("カレンダーイベントの更新に失敗しました。UserID #{user.id}: #{calendar_event.errors.full_messages.join(', ')}")
            has_error = true
          end
        end

        if has_error
          render json: { error: 'Some calendar events could not be created' }, status: :internal_server_error
        else
          render json: { message: 'Calendar events created successfully' }, status: :created
        end
      end

      private

      def log_error(message, extra = {})
        Rails.logger.error(message)
        Sentry.capture_message(message, level: 'error', extra: extra)
      end
    end
  end
end
