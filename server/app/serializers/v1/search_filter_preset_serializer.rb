module V1
  class SearchFilterPresetSerializer < ActiveModel::Serializer
    attributes :id, :title, :notification_required, :business_description, :recommended
  
    attribute :project_type do
      object.project_type.underscore
    end

    attribute :registered_by do
      object.user.name
    end

    attribute :filter do
      {
        keywords: object.keywords,
        or_keywords: object.or_keywords,
        not_keywords: object.not_keywords,
        prefectures: object.prefectures,
        organizations: object.organizations,
        procedure_types: object.procedure_types,
        procedure_type_groups: object.procedure_type_groups,
        period: object.period,
        publication_date_from: object.publication_date_from,
        publication_date_to: object.publication_date_to,
        planned_price_from: object.planned_price_from,
        planned_price_to: object.planned_price_to,
        is_experience_required: object.is_experience_required,
        is_office_required: object.is_office_required,
        project_security_qualifications: object.project_security_qualifications,
        deadline_days_remaining: object.deadline_days_remaining,
        participate_qualification_ids: object.participate_qualification_ids,
        participate_qualification_grade_ids: object.participate_qualification_grade_ids,
        participate_qualification_types: object.participate_qualification_types,
        participate_qualification_prefectures: object.participate_qualification_prefectures,
        no_qualification: object.no_qualification,
        tender_opening_date_from: object.tender_opening_date_from,
        tender_opening_date_to: object.tender_opening_date_to,
        use_synonym_search: object.use_synonym_search
      }
    end
  end
end
