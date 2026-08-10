require 'slack-notifier'

class NotifySlackService
  def initialize(slack_webhook_url)
    @notifier = Slack::Notifier.new(slack_webhook_url.nil? ? "https://slack.com" : slack_webhook_url)
  end

  def send_message(text)
    @notifier.ping(text)
  rescue StandardError => e
    Rails.logger.debug { "Slack通知に失敗しました: #{e.message}" }
  end
end
