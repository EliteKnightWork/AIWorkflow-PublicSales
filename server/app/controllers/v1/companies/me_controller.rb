module V1
  module Companies
    class MeController < ApplicationController
      def index
        return render_404 if current_user.company.nil?

        render json: current_user.company, serializer: V1::CompanySerializer
      end

      def update
        return render_404 if current_user.company.nil?

        if current_user.company.update(company_params)
          render json: current_user.company, serializer: V1::CompanySerializer
        else
          render json: current_user.company.errors, status: :internal_server_error
        end
      end

      private

      def company_params
        params.permit(:name)
      end
    end
  end
end
