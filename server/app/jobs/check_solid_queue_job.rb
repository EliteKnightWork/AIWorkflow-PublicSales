class CheckSolidQueueJob < ApplicationJob
  self.queue_adapter = :solid_queue
  queue_as :default

  def perform
    Rails.logger.info("=== CheckSolidQueueJob performed successfully ===")
  end
end
