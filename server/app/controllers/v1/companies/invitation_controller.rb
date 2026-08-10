module V1
  module Companies
    class InvitationController < ApplicationController
      skip_before_action :require_login, only: [:verify, :check_limitation]

      def index
        return render_404 if current_user.company.nil?

        token = current_user.company.generate_token_for(:invitation)

        render json: { token: token }
      end

      def verify
        company = Company.find_by_token_for(:invitation, params[:token])

        if company.nil?
          render json: { valid: false }, status: :ok
        else
          render json: { valid: true }, status: :ok
        end
      end

      def check_limitation
        company = Company.find_by_token_for(:invitation, params[:token])
        return render json: { error: 'invalid token' }, status: :bad_request if company.nil?

        max_member_count = company.company_functional_limitation.max_member_count
        current_member_count = company.users.count

        can_join = current_member_count < max_member_count

        render json: {
          can_join: can_join,
          current_member_count: current_member_count,
          max_member_count: max_member_count
        }, status: :ok
      end
    end
  end
end
