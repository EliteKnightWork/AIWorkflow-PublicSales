Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
            ENV['GOOGLE_CLIENT_ID'],
            ENV['GOOGLE_CLIENT_SECRET'],
            {
              scope: 'userinfo.email,calendar',
              access_type: 'offline',
              prompt: 'consent',
              include_granted_scopes: true
            }
  provider :microsoft_graph,
            ENV['MICROSOFT_CLIENT_ID'],
            ENV['MICROSOFT_CLIENT_SECRET'],
            {
              scope: 'openid profile email offline_access Calendars.ReadWrite User.Read',
            }
end
OmniAuth.config.allowed_request_methods = %i[get post]
OmniAuth.config.on_failure = proc do |env|
  OmniAuth::FailureEndpoint.new(env).redirect_to_failure
end
