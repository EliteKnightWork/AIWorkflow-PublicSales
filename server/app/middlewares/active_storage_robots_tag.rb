class ActiveStorageRobotsTag
  def initialize(app)
    @app = app
  end

  def call(env)
    status, headers, response = @app.call(env)
    
    if env['PATH_INFO'].include?('/rails/active_storage/blobs/') || 
       env['PATH_INFO'].include?('/rails/active_storage/representations/')
      headers['X-Robots-Tag'] = 'noindex, nofollow'
    end
    
    [status, headers, response]
  end
end
