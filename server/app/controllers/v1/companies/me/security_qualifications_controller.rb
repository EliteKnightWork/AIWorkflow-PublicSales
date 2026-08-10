module V1
  module Companies
    module Me
      class SecurityQualificationsController < ApplicationController
        def index
          security_qualifications = current_user
                                      .company
                                      .company_security_qualifications
                                      .includes(:security_qualification)

          render(
            json: security_qualifications,
            each_serializer: V1::CompanySecurityQualificationSerializer,
            adapter: :json,
            root: 'security_qualifications'
          )
        end

        def update
          ActiveRecord::Base.transaction do
            current_user.company.company_security_qualifications.each(&:destroy!)

            params[:security_qualifications].each do |sq_param|
              security_qualification = SecurityQualification.find_by!(code: sq_param[:code])

              current_user.company.company_security_qualifications.create!(
                security_qualification: security_qualification,
                valid_from: sq_param[:valid_from],
                valid_until: sq_param[:valid_until]
              )
            end
          end

          qualifications = current_user
                             .company
                             .company_security_qualifications
                             .includes(:security_qualification)

          render(
            json: qualifications,
            each_serializer: V1::CompanySecurityQualificationSerializer,
            adapter: :json,
            root: 'security_qualifications'
          )
        rescue ActiveRecord::RecordNotFound => e
          render json: { error: e.message }, status: :not_found
        end
      end
    end
  end
end