module V1
  class BidPipelineStatusSerializer < ActiveModel::Serializer
    attributes :id, :company_id, :name, :stage, :order, :is_uneditable
  end
end
