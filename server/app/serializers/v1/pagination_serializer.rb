module V1
  class PaginationSerializer < ActiveModel::Serializer
    attributes :current, :next, :prev, :pages, :limit, :count

    def current
      object.current_page
    end

    def next
      object.next_page
    end

    def prev
      object.prev_page
    end

    def pages
      object.total_pages
    end

    def limit
      object.limit_value
    end

    def count
      object.total_count
    end
  end
end

