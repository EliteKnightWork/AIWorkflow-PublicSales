module V1
  module Settings
    module NotificationMethods
      class SlackController < ApplicationController
        def show
          notification_type = params[:notification_type]
          # Only validate if notification_type is provided
          if params.key?(:notification_type)
            render json: { errors: ['notification_type is required'] }, status: :bad_request and return if notification_type.blank?
            render json: { errors: ['invalid notification_type'] }, status: :bad_request and return unless valid_notification_type?(notification_type)
          end

          notification_method = current_user.notification_methods.find_by(
            notifiable_type: 'SlackNotification',
            notification_type: notification_type,
            enabled: true
          )

          if notification_method&.notifiable.present?
            render json: { webhookUrl: notification_method.notifiable.webhook_url }, status: :ok
          else
            render json: { webhookUrl: '' }, status: :ok
          end
        end

        def update
          notification_type = params[:notification_type]
          # Only validate if notification_type is provided
          if params.key?(:notification_type)
            render json: { errors: ['notification_type is required'] }, status: :bad_request and return if notification_type.blank?
            render json: { errors: ['invalid notification_type'] }, status: :bad_request and return unless valid_notification_type?(notification_type)
          end

          notification_method = current_user.notification_methods.find_or_initialize_by(
            notifiable_type: 'SlackNotification',
            notification_type: notification_type,
            enabled: true
          )

          if notification_method.new_record?
            notification_method.notifiable = SlackNotification.new(webhook_url: params[:webhook_url])
          else
            notification_method.notifiable.update(webhook_url: params[:webhook_url])
          end

          if notification_method.save
            render json: {}, status: :ok
          else
            render json: { errors: notification_method.errors.full_messages }, status: :internal_server_error
          end
        end

        private

        def valid_notification_type?(notification_type)
          NotificationMethod::VALID_NOTIFICATION_TYPES.include?(notification_type)
        end
      end
    end
  end
end
