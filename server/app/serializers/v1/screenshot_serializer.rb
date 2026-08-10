module V1
  class ScreenshotSerializer < ActiveModel::Serializer
    attributes :id, :source_url

    attribute :url do
      next unless object.file.attached?

      Rails.application.routes.url_helpers.rails_blob_url(object.file)
    end
  end
end
