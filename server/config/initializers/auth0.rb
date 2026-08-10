require 'auth0'

AUTH0_CLIENT =
  if Rails.env.test?
    nil
  else
    Auth0Client.new(
      client_id: ENV['AUTH0_BACKEND_CLIENT_ID'],
      client_secret: ENV['AUTH0_BACKEND_CLIENT_SECRET'],
      domain: ENV['AUTH0_DOMAIN']
    )
  end
