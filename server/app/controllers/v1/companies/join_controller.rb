module V1
  module Companies
    class JoinController < ApplicationController
      def create
        company = Company.find_by_token_for(:invitation, params[:token])
        return render json: { error: 'invalid token' }, status: :bad_request if company.nil?

        if current_user.update(company: company)
          render json: company, serializer: V1::CompanySerializer, status: :created
        else
          return current_user.errors, status: :internal_server_error
        end
      end
    end
  end
end
