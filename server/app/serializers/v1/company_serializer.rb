module V1
  class CompanySerializer < ActiveModel::Serializer
    attributes :id, :name, :features, :is_trial
  end
end
