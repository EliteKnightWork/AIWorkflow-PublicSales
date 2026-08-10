class ProjectParticipateQualificationGradeResponse
  include ActiveModel::Model
  include ActiveModel::Serialization
  attr_accessor :participate_qualification, :grades, :participate_qualification_type, :prefecture, :lg_code, :municipality
end
