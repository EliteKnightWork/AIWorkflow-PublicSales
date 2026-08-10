class CheckInMemoryJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info("=== CheckInMemoryJob performed successfully ===")
  end
end
