class AuthorizationService
  def initialize(headers = {})
    @headers = headers
  end

  def authenticate_request
    return if http_token.nil?

    JsonWebToken.verify(http_token)
  end

  private

  def http_token
    @headers['Authorization'].split(' ').last if @headers['Authorization'].present?
  end
end
