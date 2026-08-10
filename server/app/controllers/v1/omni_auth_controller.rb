module V1
  class OmniAuthController < ApplicationController
    skip_before_action :require_login, only: [:callback, :failure]

    def callback
      auth = request.env['omniauth.auth']

      user = User.find_by(email: auth.info.email)

      if user.nil?
        redirect_to ENV['FRONTEND_BASE_URL'] + "/management?authentication_error=email_mismatch", allow_other_host: true
        return
      end

      user_token = UserToken.find_or_initialize_by(user: user, token_provider: auth.provider)
      user_token.access_token = auth.credentials.token
      user_token.refresh_token = auth.credentials.refresh_token
      user_token.expires_at = Time.zone.at(auth.credentials.expires_at)

      if user_token.save
        user.name ||= auth.info.name
        user.save
      else
        redirect_to ENV['FRONTEND_BASE_URL'] + "/management?authentication_error=save_failed", allow_other_host: true
        return
      end

      redirect_to ENV['FRONTEND_BASE_URL'] + "/management", allow_other_host: true
    end

    def failure
      error_type = case request.env['omniauth.error']&.to_s
                   when /access_denied/
                     'user_denied'
                   else
                     'authentication_failed'
                   end
      
      redirect_to ENV['FRONTEND_BASE_URL'] + "/management?authentication_error=#{error_type}", allow_other_host: true
    end

    def destroy
      provider = params[:provider]
      user_token = current_user.user_tokens.find_by(token_provider: provider)

      if user_token
        user_token.destroy
        head :no_content
      else
        render json: { error: "#{provider} account not found" }, status: :not_found
      end
    end
  end
end
