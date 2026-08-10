module V1
  class ProposalDocumentSerializer < ActiveModel::Serializer
    attributes :id, :created_at, :updated_at

    attribute :name do
      object.file.filename.to_s
    end

    attribute :url do
      next unless object.file.attached?

      Rails.application.routes.url_helpers.rails_blob_url(object.file)
    end
  end
end