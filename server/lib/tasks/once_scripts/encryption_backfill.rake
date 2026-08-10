namespace :once_scripts do
  namespace :encryption do
    desc 'Encrypt existing plaintext values using Active Record Encryption (one-off)'
    task backfill: :environment do |task|
      Rails.logger.info("=== Start #{task.name} #{Time.zone.now} ===")
      backfill = lambda do |model_class|
        model_class.in_batches(of: 1000) do |relation|
          relation.find_each do |record|
            next unless record.respond_to?(:encrypt)
            begin
              record.encrypt
            rescue => e
              Rails.logger.error("[once_scripts][encryption] backfill failed for #{model_class.name}##{record.id}: #{e.message}")
            end
          end
        end
      end

      backfill.call(User)
      backfill.call(UserToken)
      backfill.call(SlackNotification)
      backfill.call(ChatworkNotification)
      backfill.call(CalendarSubscription)
      backfill.call(EmailNotification)

      Rails.logger.info("=== End #{task.name} #{Time.zone.now} ===")
    end
  end
end
