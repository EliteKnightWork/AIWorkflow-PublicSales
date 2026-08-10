module V1
  class BusinessDescriptionFormatSerializer < ActiveModel::Serializer
    attributes :id, :description, :company_id
  end
end
