module V1
  module Settings
    class NotificationTimerSettingController < ApplicationController
      def show
        settings = current_user.notification_timer_settings.where(notification_type: params[:notification_type])
        
        if params[:notification_type] == 'task'
          result = settings.map { |s| { hour: s.hour, days_before_due_date: s.days_before_due_date } }
          render json: { settings: result }, status: :ok
        else
          hours = settings.pluck(:hour)
          render json: { hours: hours }, status: :ok
        end
      end

      def update
        current_user.notification_timer_settings.where(notification_type: params[:notification_type]).destroy_all
        
        if params[:notification_type] == 'task' && params[:settings].present?
          params[:settings].each do |setting|
            current_user.notification_timer_settings.create!(
              notification_type: params[:notification_type],
              hour: setting[:hour],
              days_before_due_date: setting[:days_before_due_date] || 0
            )
          end
        else
          params[:hours].each do |hour|
            current_user.notification_timer_settings.create!(
              notification_type: params[:notification_type],
              hour: hour,
              days_before_due_date: 0
            )
          end
        end

        render json: {}, status: :ok
      rescue => e
        Rails.logger.error(e.message)
        Sentry.capture_exception(e)
        render json: { error: "Failed to update notification timer settings" }, status: :bad_request
      end
    end
  end
end
