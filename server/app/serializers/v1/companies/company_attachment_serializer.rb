module V1
  module Companies
    class CompanyAttachmentSerializer < ActiveModel::Serializer
      attributes :id, :file_type, :name, :url

      def name
        object.file.attached? ? object.file.filename.to_s : nil
      end

      def url
        object.file.attached? ? Rails.application.routes.url_helpers.rails_blob_url(object.file) : nil
      end
    end
  end
end
