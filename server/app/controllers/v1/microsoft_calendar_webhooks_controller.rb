module V1
  class MicrosoftCalendarWebhooksController < ApplicationController
    skip_before_action :require_login

    def create
      # サブスクリプション登録時の検証トークンを受け取った場合は、そのまま返す
      if params["validation_token"]
        render plain: params["validation_token"]
        return
      end

      errors = []
      deleted_events = params[:value]

      deleted_events.each do |event|
        subscription = CalendarSubscription.find_by(subscription_id: event["subscription_id"])
        unless subscription
          errors << { error: 'Subscription not found', subscription_id: event["subscription_id"] }
          next
        end

        subscription.calendar_webhook_logs.create!(
          provider: 'microsoft_graph',
          raw_payload: event.to_json,
          received_at: Time.zone.now,
        )

        unless subscription.check_client_state(event["client_state"])
          errors << { error: 'Invalid client state', subscription_id: event["subscription_id"] }
          next
        end

        if event["change_type"] == "deleted"
          calendar_event = CalendarEvent.find_by(
            event_id: event["resource_data"]["id"],
            provider: 'microsoft_graph',
          )

          next unless calendar_event

          CalendarEvent.where(
            registrable: calendar_event.registrable,
            due_date_type: calendar_event.due_date_type
          ).find_each do |e|
            e.destroy_with_external_calendar_event!
          end

          if calendar_event.registrable_type == 'BidPipelineTask'
            calendar_event.registrable.destroy!
          end
        end
      end

      if errors.any?
        render json: { errors: errors }, status: :unprocessable_entity
        return
      end

      render json: { message: 'Webhook received successfully' }, status: :ok
    end
  end
end
