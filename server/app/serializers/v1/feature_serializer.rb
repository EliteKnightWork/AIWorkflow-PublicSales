module V1
  class FeatureSerializer < ActiveModel::Serializer
    attributes :id, :key, :description
  end
end

