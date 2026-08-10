module V1
  class BidderSerializer < ActiveModel::Serializer
    attributes :id, :bid_company_id, :is_successful

    belongs_to :bid_company, serializer: V1::BidCompanySerializer
  end
end
