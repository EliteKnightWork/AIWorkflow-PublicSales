unless Rails.env.development?
  Rails.logger.debug "開発環境以外ではSeedの実行はできません。"
  return
end

class Seeder
  class << self
    def seed(&block)
      instance = self.new
      ActiveRecord::Base.transaction do
        instance.instance_eval(&block)
      end
    end
  end
end

SEED_FILE_PATH = "*.seeds.rb"
Rails.application.eager_load!
Rails.root.glob("db/seeds/#{SEED_FILE_PATH}").each do |file|
  Rails.logger.debug { "=== Processing #{file.to_s.split("/").last} ===" }
  require file
end
