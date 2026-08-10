module V1
  class BidPipelineTaskSerializer < ActiveModel::Serializer
    belongs_to :status, serializer: V1::BidPipelineTaskStatusSerializer
    has_many :assigned_users, serializer: V1::UserSerializer
    has_many :attachments, serializer: V1::BidPipelineTaskAttachmentSerializer

    attributes :id, :title, :description, :due_date

    attribute :pipeline do
      {
        pipeline_id: object.bid_pipeline.id,
        project_id: object.bid_pipeline.project_id,
        project_title: object.bid_pipeline.project.title
      }
    end

    attribute :event_created do
      current_user.calendar_events.exists?(registrable: object)
    end
  end
end
