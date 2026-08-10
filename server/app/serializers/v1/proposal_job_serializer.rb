module V1
  class ProposalJobSerializer < ActiveModel::Serializer
    attributes :id, :status, :error_message

    belongs_to :company, serializer: V1::CompanySerializer
    belongs_to :user, serializer: V1::UserSerializer
    belongs_to :project, serializer: V1::ProjectSerializer
    belongs_to :proposal_document, serializer: V1::ProposalDocumentSerializer, if: -> { object.proposal_document.present? }
  end
end