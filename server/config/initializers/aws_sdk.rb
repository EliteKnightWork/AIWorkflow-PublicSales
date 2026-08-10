require 'aws-sdk-s3'

Aws.config.update(
  credentials: Aws::Credentials.new(ENV['AWS_ACCESS_ID'], ENV['AWS_ACCESS_KEY']),
  region: Settings.aws.region
)
