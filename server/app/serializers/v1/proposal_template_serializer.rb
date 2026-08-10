module V1
  class ProposalTemplateSerializer < ActiveModel::Serializer
    attributes :id

    attribute :url do
      next unless object.file.attached?

      Rails.application.routes.url_helpers.rails_blob_url(object.file)
    end

    attribute :name do
      object.file.filename.to_s if object.file.attached?
    end
  end
end
