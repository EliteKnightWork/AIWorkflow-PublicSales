require 'time'

module V1
  class AwardedProjectSerializer < ActiveModel::Serializer
    has_many :bidders, serializer: V1::BidderSerializer

    attribute :source do
      object.source
    end

    attribute :document_url do
      object.url
    end

    attribute :successful_bid_price do
      object.successful_bid_price
    end

    attribute :successful_bidders do
      successful_bidders = object.bidders.select(&:is_successful)
      ActiveModelSerializers::SerializableResource.new(successful_bidders, each_serializer: V1::BidderSerializer)
    end
  end
end
