begin
  require 'committee/rails'
  RSpec.configure do |config|
    config.include Committee::Rails::Test::Methods
    config.add_setting :committee_options
    config.committee_options = {
      schema_path: Rails.root.join('../openapi.yml').to_s,
      strict_reference_validation: true
    }
  end
rescue LoadError
  Rails.logger.debug "Committee gem not available, skipping configuration"
end
