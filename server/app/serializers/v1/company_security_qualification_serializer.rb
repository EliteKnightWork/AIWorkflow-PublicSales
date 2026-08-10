module V1
  class CompanySecurityQualificationSerializer < ActiveModel::Serializer
    attributes :id, :code, :display_name, :valid_from, :valid_until

    def id
      object.security_qualification.id
    end

    def code
      object.security_qualification.code
    end

    def display_name
      object.security_qualification.display_name
    end
  end
end