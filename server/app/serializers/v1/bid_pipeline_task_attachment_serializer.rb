module V1
  class BidPipelineTaskAttachmentSerializer < ActiveModel::Serializer
    attributes :id

    attribute :url do
      next unless object.file.attached?

      Rails.application.routes.url_helpers.rails_blob_url(object.file)
    end

    attribute :name do
      object.file.filename.to_s
    end
  end
end
