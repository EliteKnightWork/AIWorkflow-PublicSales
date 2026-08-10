module V1
  class SecurityQualificationsController < ApplicationController
    serialization_scope :current_user

    def index
      security_qualifications = SecurityQualification.order(:id)

      render(
        json: security_qualifications,
        each_serializer: V1::SecurityQualificationSerializer,
        adapter: :json,
        root: 'security_qualifications'
      )
    end
  end
end