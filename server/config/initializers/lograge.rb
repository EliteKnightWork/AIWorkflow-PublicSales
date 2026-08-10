Rails.application.configure do
  config.lograge.enabled = Rails.env.production?
  config.lograge.base_controller_class = 'ActionController::API'
  config.lograge.ignore_actions = ['V1::HealthsController#show']
end
