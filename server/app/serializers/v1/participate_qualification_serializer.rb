module V1
  class ParticipateQualificationSerializer < ActiveModel::Serializer
    attributes :id, :name, :participate_qualification_type, :prefecture, :lg_code, :county, :municipality

    attribute :grades do
      object.participate_qualification_grades
        .sort_by(&:order)
        .filter_map { |grade|
          { grade_id: grade.id, name: grade.name }
        }
    end
  end
end
