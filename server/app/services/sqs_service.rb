require 'aws-sdk-sqs'

class SqsService
  def initialize
    Rails.logger.info "SqsService initialize"
    @client = Aws::SQS::Client.new(
      endpoint: ENV['SQS_ENDPOINT']  || 'http://localstack:4566',
      region: 'ap-northeast-1',
      credentials: Aws::Credentials.new(
        ENV['AWS_ACCESS_ID'],
        ENV['AWS_ACCESS_KEY']
      )
    )
    Rails.logger.info "SqsService initialized end"
  end

  def send_message(queue_url, message_body)
    Rails.logger.info "Sending message to SQS: #{queue_url}"
    response = @client.send_message(
      queue_url: queue_url,
      message_body: message_body.to_json
    )
    Rails.logger.info "Message sent to SQS: #{response.message_id}"
    response.message_id
  rescue => e
    Rails.logger.error("Failed to send message to SQS: #{e.message}")
    Rails.logger.error("Queue URL: #{queue_url}")
    Rails.logger.error("Message body: #{message_body.to_json}")
    Rails.logger.error(e.backtrace.join("\n"))
    raise e
  end
end 