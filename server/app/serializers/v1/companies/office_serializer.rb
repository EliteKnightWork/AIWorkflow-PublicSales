module V1
  module Companies
    class OfficeSerializer < ActiveModel::Serializer
      attributes :id, :name, :address
    end
  end
end
