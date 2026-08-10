module V1
  class SecurityQualificationSerializer < ActiveModel::Serializer
    attributes :id, :code, :display_name
  end
end