module V1
  class ExternalDocumentSerializer < ActiveModel::Serializer
    attributes :id, :text

    attribute :name do
      object.file.filename.to_s
    end

    attribute :url do
      next unless object.file.attached?

      Rails.application.routes.url_helpers.rails_blob_url(object.file)
    end
  end
end
