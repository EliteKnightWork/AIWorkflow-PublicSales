module V1
  class CompanyParticipateQualificationSerializer < ActiveModel::Serializer
    attributes :id, :organization_name, :valid_from, :valid_until, :remarks

    has_many :qualification_certificates, serializer: V1::QualificationCertificateSerializer

    attribute :participate_qualification_id do
      object.participate_qualification.id
    end

    attribute :name do
      object.participate_qualification.name
    end

    attribute :participate_qualification_type do
      object.participate_qualification.participate_qualification_type
    end

    attribute :prefecture do
      object.participate_qualification.prefecture
    end

    attribute :lg_code do
      object.participate_qualification.lg_code
    end

    attribute :county do
      object.participate_qualification.county
    end

    attribute :municipality do
      object.participate_qualification.municipality
    end

    attribute :owned_grades do
      object.company_participate_qualification_grades.map do |cpqg|
        {
          id: cpqg.id,
          participate_qualification_grade_id: cpqg.participate_qualification_grade.id,
          name: cpqg.participate_qualification_grade.name
        }
      end
    end

    attribute :company_participate_qualification_type do
      object.qualification_type
    end

    attribute :company_participate_qualification_status do
      object.qualification_status
    end
  end
end
