module V1
  class SummaryBidCompanySerializer < ActiveModel::Serializer
    attributes :id, :name, :bid_count, :successful_bid_count

    def bid_count
      @instance_options[:bid_counts][object.id]&.bid_count.to_i
    end

    def successful_bid_count
      @instance_options[:bid_counts][object.id]&.successful_bid_count.to_i
    end
  end
end
