namespace :ridgepole do
  desc 'Apply database schema for both primary and queue databases'
  task apply: :environment do
    Rake::Task['ridgepole:apply:primary'].invoke
    Rake::Task['ridgepole:apply:queue'].invoke
  end

  namespace :apply do
    desc 'Apply database schema for primary database'
    task primary: :environment do
      result = ridgepole('--apply', "-E #{Rails.env}", "-f #{schema_file(:primary)}", '--drop-table', '-s', 'primary')
      exit! unless result
      system('bundle exec annotaterb models') if Rails.env.development?
    end

    desc 'Apply database schema for queue database'
    task queue: :environment do
      result = ridgepole('--apply', "-E #{Rails.env}", "-f #{schema_file(:queue)}", '--drop-table', '-s', 'queue')
      exit! unless result
    end

    desc 'Apply database schema for both primary and queue databases in test environment'
    task test: :environment do
      raise 'このコマンドは development または test 環境のみ実行できます' unless Rails.env.development? || Rails.env.test?

      system('RAILS_ENV=test bundle exec rake ridgepole:apply')
    end
  end

  private

  def schema_file(database)
    case database
    when :primary
      Rails.root.join('db/schemas/primary/Schemafile')
    when :queue
      Rails.root.join('db/schemas/queue/Schemafile')
    else
      raise "Unknown database: #{database}"
    end
  end

  def config_file
    Rails.root.join('config/database.yml')
  end

  def ridgepole(*options)
    command = ['bundle exec ridgepole', "--config #{config_file}"]
    system [command + options].join(' ')
  end
end
