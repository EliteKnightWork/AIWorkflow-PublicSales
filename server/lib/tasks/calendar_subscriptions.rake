namespace :calendar_subscriptions do
  desc "Update Calendar Subscriptions"
  task update: :environment do
    CalendarSubscription.find_each do |subscription|
      # 2日以内に期限が切れるサブスクリプションを更新
      if subscription.expires_at < 2.days.from_now
        user_token = subscription.user.user_tokens.find_by(token_provider: subscription.provider)
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

        begin
          webhook_url = case user_token.token_provider
                        when 'google_oauth2'
                          ENV['GOOGLE_CALENDAR_WEBHOOK_URL']
                        when 'microsoft_graph'
                          ENV['MICROSOFT_CALENDAR_WEBHOOK_URL']
                        end

          service.update_subscription(webhook_url)
          Rails.logger.info("Updated subscription for user #{subscription.user.id} with provider #{subscription.provider}")
        rescue => e
          Rails.logger.error("Failed to update subscription for user #{subscription.user.id}: #{e.message}")
        end
      end
    end
  end
end