module V1
  class AggregationSerializer < ActiveModel::Serializer
    attributes :all, :new, :open, :closed, :awarded

    def all
      object.dig('all', 'doc_count')
    end

    def new
      object.dig('new', 'doc_count')
    end

    def open
      object.dig('open', 'doc_count')
    end

    def closed
      object.dig('closed', 'doc_count')
    end

    def awarded
      object.dig('awarded', 'doc_count')
    end
  end
end
