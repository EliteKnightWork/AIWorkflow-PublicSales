module V1
  class BidCompaniesController < ApplicationController
    def search
      keywords = params[:keywords]
      per_page = params[:per_page]&.to_i || 25
      per_page = 100 if per_page > 100

      # キーワードが複数ある場合に対応
      bid_companies_query = if keywords.present?
        query = keywords.map { |keyword| "%#{ActiveRecord::Base.sanitize_sql_like(keyword)}%" }
        conditions = query.map { 'name LIKE ?' }.join(' OR ')
        BidCompany.where(conditions, *query)
      else
        BidCompany.all
      end

      # ページネーションの適用
      paginated_bid_companies = bid_companies_query.page(params[:page]).per(per_page)

      # パフォーマンス改善のため include して serializer で計算するのではなく、必要な値だけ事前に計算してserializerに渡す
      bid_company_ids = paginated_bid_companies.map(&:id)
      bid_counts = BidCompany
        .left_joins(:bidders)
        .where(id: bid_company_ids)
        .select(
          'bid_companies.id',
          'COUNT(bidders.id) AS bid_count',
          'SUM(CASE WHEN bidders.is_successful THEN 1 ELSE 0 END) AS successful_bid_count'
        )
        .group('bid_companies.id')
        .index_by(&:id)

      render(
        json: paginated_bid_companies,
        each_serializer: V1::SummaryBidCompanySerializer,
        bid_counts: bid_counts,
        meta: { pagination: PaginationSerializer.new(paginated_bid_companies) },
        adapter: :json,
        root: 'bid_companies'
      )
    end
  end
end
