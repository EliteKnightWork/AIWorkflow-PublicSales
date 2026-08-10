require 'digest'

class UserUnauthorized < StandardError; end

class ApplicationController < ActionController::API
  include ActionController::Helpers

  before_action :require_login

  skip_before_action :require_login, only: [:render_401, :render_404]

  rescue_from UserUnauthorized, with: :render_401
  rescue_from ActiveRecord::RecordNotFound, with: :render_404

  def render_401
    render json: { errors: ['unauthorized'] }, status: :unauthorized
  end

  def render_404
    render json: { errors: ['not found'] }, status: :not_found
  end

  private

  def current_user
    return @current_user if @current_user

    auth_payload, _auth_header = AuthorizationService.new(request.headers).authenticate_request
    return if auth_payload.nil?

    @current_user = User.from_token_payload(auth_payload)
  rescue JWT::VerificationError, JWT::DecodeError
    raise UserUnauthorized
  end

  def require_login
    raise UserUnauthorized unless current_user
  end

  def require_subscription
    raise UserUnauthorized unless current_user&.company&.subscription_active?
  end

  def require_internal_api_key
    expected_key = ENV['INTERNAL_API_KEY'].presence
    provided_key = request.headers['X-Api-Key'].presence
    raise UserUnauthorized if expected_key.blank? || provided_key.blank?
    raise UserUnauthorized unless secure_compare(expected_key, provided_key)
  end
  def secure_compare(expected_key, provided_key)
    ActiveSupport::SecurityUtils.secure_compare(
      ::Digest::SHA256.hexdigest(expected_key),
      ::Digest::SHA256.hexdigest(provided_key)
    )
  rescue ArgumentError
    false
  end
end
