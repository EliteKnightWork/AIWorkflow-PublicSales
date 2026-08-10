module V1
  module Companies
    class CompanyInformationController < ApplicationController
      def show
        @company = Company.includes(
          :company_information,
          :offices,
          company_attachments: { file_attachment: :blob }
        ).find(current_user.company_id)

        render json: @company,
               serializer: V1::Companies::CompanyInformationSerializer
      end

      def update
        @company = current_user.company

        return render json: { errors: ['not found'] }, status: :not_found unless @company

        transaction = Transactions::UpdateCompanyInformation.new(params, @company)

        if transaction.exec
          render json: {}, status: :ok
        else
          render json: { errors: transaction.errors }, status: :unprocessable_entity
        end
      end
    end
  end
end
