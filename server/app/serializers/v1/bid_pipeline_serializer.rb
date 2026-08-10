module V1
  class BidPipelineSerializer < ActiveModel::Serializer
    attribute :id

    belongs_to :status, serializer: V1::BidPipelineStatusSerializer
    belongs_to :project, serializer: V1::ProjectSerializer
    has_many :assigned_users, serializer: V1::UserSerializer
    has_one :upcomming_task, serializer: V1::BidPipelineTaskSerializer
    has_many :custom_objects, serializer: V1::CustomObjectSerializer

    attribute :event_created_due_date_types do
      current_user.calendar_events.where(registrable: object, sync_status: 'synced').map do |event|
        event.due_date_type
      end
    end
  end
end
