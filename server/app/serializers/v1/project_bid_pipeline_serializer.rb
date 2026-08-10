module V1
  class ProjectBidPipelineSerializer < ActiveModel::Serializer
    attribute :id
    
    belongs_to :status, serializer: V1::BidPipelineStatusSerializer
    has_many :assigned_users, serializer: V1::UserSerializer
  end
end
