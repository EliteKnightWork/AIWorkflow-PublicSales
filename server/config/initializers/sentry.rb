if Rails.env.production?
  Sentry.init do |config|
    config.dsn = 'https://90978e4c7390be5491ef75b583c28f56@o4506105465929728.ingest.sentry.io/4506105466912768'
    config.breadcrumbs_logger = [:active_support_logger, :http_logger]
    config.traces_sample_rate = 0.1
    config.sdk_logger = Sentry::Logger.new(STDOUT)
    config.sdk_logger.level = ::Logger::WARN
  end
end
