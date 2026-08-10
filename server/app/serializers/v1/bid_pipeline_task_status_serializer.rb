module V1
  class BidPipelineTaskStatusSerializer < ActiveModel::Serializer
    attributes :id, :company_id, :name, :stage, :order, :is_default
  end
end
