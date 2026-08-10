module V1
  class ProjectChatSerializer < ActiveModel::Serializer
    # チャットエージェント用のプロジェクトシリアライザー
    # チャットエージェントサーバーのPydanticモデルに合わせた構造

    attributes :id, :uuid, :title, :description, :rawTitle, :organization_name, 
               :procedure_type_group, :publication_date, :application_document_deadline_date,
               :proposal_document_deadline_date, :bidding_deadline_date, :registration_date,
               :external_document_url, :external_documents

    attribute :rawTitle do
      object.raw_title
    end

    attribute :publication_date do
      object.publication_date&.strftime('%Y-%m-%d')
    end

    attribute :application_document_deadline_date do
      object.application_document_deadline_date&.strftime('%Y-%m-%d')
    end

    attribute :proposal_document_deadline_date do
      object.proposal_document_deadline_date&.strftime('%Y-%m-%d')
    end

    attribute :bidding_deadline_date do
      object.bidding_deadline_date&.strftime('%Y-%m-%d')
    end

    attribute :registration_date do
      object.registration_date&.strftime('%Y-%m-%d')
    end

    attribute :external_documents do
      object.external_documents.map do |doc|
        {
          id: doc.id,
          name: doc.file.attached? ? doc.file.filename.to_s : 'Unknown',
          text: doc.text,
          url: doc.file.attached? ? Rails.application.routes.url_helpers.rails_blob_url(doc.file) : nil
        }
      end
    end
  end
end
