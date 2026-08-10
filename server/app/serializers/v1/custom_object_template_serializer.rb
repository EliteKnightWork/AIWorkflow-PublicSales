module V1
  class CustomObjectTemplateSerializer < ActiveModel::Serializer
    attributes :id, :title, :company_id
  end
end

