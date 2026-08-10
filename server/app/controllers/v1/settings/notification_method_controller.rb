module V1
  module Settings
    class NotificationMethodController < ApplicationController
      def show
        notification_type = params[:notification_type]
        # Only validate if notification_type is provided
        if params.key?(:notification_type)
          render json: { errors: ['notification_type is required'] }, status: :bad_request and return if notification_type.blank?
          render json: { errors: ['invalid notification_type'] }, status: :bad_request and return unless valid_notification_type?(notification_type)
        end

        enabled_methods = current_user.notification_methods.where(enabled: true, notification_type: notification_type)
        values = enabled_methods.map(&:value)
        render json: { values: values }
      end

      def update
        types = params[:types]
        notification_type = params[:notification_type]
        # Only validate if notification_type is provided
        if params.key?(:notification_type)
          render json: { errors: ['notification_type is required'] }, status: :bad_request and return if notification_type.blank?
          render json: { errors: ['invalid notification_type'] }, status: :bad_request and return unless valid_notification_type?(notification_type)
        end
        render json: { errors: ['無効な値です'] }, status: :bad_request and return unless valid_type?

        if types.exclude?('email')
          notification_methods = current_user.notification_methods.where(notifiable_type: "EmailNotification", notification_type: notification_type)
          notification_methods.each do |notification_method|
            notification_method.update!(enabled: false)
            notification_method.notifiable&.update!(email: '')
          end
        end

        if types.exclude?('slack')
          notification_methods = current_user.notification_methods.where(notifiable_type: "SlackNotification", notification_type: notification_type)
          notification_methods.each do |notification_method|
            notification_method.update!(enabled: false)
            notification_method.notifiable&.update!(webhook_url: '')
          end
        end

        types.each do |type|
          case type
          when 'none'
            current_user.notification_methods
                       .where(notification_type: notification_type)
                       .find_each { |method| method.update(enabled: false) }
            current_user.notification_timer_settings
                       .where(notification_type: notification_type)
                       .find_each { |setting| setting.destroy! }
          when 'email', 'slack'
            notification_method = current_user.notification_methods.find_or_initialize_by(
              notifiable_type: "#{type.camelize}Notification",
              notification_type: notification_type
            )
            Rails.logger.debug notifiable_attributes(type)
            next if type == 'email' && notifiable_attributes(type)[:email].blank?
            next if type == 'slack' && notifiable_attributes(type)[:webhook_url].blank?

            if notification_method.notifiable.nil?
              notification_method.build_notifiable(notifiable_attributes(type))
            else
              notification_method.notifiable.update!(notifiable_attributes(type))
            end

            notification_method.update!(enabled: true)
          end
        end

        render json: {}, status: :ok
      end

      private

      def valid_type?
        params[:types].all? { |type| NotificationMethod::VALID_NOTIFICATION_METHODS.include?(type) }
      end

      def valid_notification_type?(notification_type)
        NotificationMethod::VALID_NOTIFICATION_TYPES.include?(notification_type)
      end

      def notifiable_attributes(type)
        case type
        when 'email'
          { email: params[:email] }
        when 'slack'
          { webhook_url: params[:slack_webhook_url] }
        end
      end
    end
  end
end
