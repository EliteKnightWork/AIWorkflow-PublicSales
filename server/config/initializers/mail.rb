Rails.application.config.action_mailer.delivery_method = Settings.mail.delivery_method.to_sym
Rails.application.config.action_mailer.raise_delivery_errors = Settings.mail.raise_delivery_errors
Rails.application.config.action_mailer.default_url_options = Settings.mail.default_url_options.to_h
