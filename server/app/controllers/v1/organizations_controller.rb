module V1
  class OrganizationsController < ApplicationController
    def search
      per_page = params[:per_page]&.to_i || 25
      per_page = 100 if per_page > 100

      # Elastic Searchを使用して検索
      search_params = {
        keywords: params[:keywords],
        prefectures: params[:prefectures]
      }

      # Elastic Searchで検索実行
      results = Organization.search(search_params).page(params[:page]).per(per_page)

      # 検索結果のレコードを取得（プロジェクトは含めない）
      organization_ids = results.records.ids
      organizations = Organization.where(id: organization_ids)
                                 .in_order_of(:id, organization_ids)

      # Elasticsearchのヒット結果を取得
      hits = results.response["hits"]["hits"]

      # ヒット結果からIDとカウント情報のマッピングを作成
      es_counts = {}
      hits.each do |hit|
        org_id = hit["_id"].to_i
        source = hit["_source"]

        es_counts[org_id] = {
          open_projects_count: source["open_projects_count"].to_i,
          bidded_projects_count: source["bidded_projects_count"].to_i,
          total_projects_count: source["total_projects_count"].to_i
        }
      end

      # 各組織にカウント情報を設定
      organizations.each do |org|
        if es_counts[org.id].present?
          org.open_projects_count = es_counts[org.id][:open_projects_count]
          org.bidded_projects_count = es_counts[org.id][:bidded_projects_count]
          org.total_projects_count = es_counts[org.id][:total_projects_count]
        else
          # Elastic Searchの結果にない場合は0を設定
          org.open_projects_count = 0
          org.bidded_projects_count = 0
          org.total_projects_count = 0
        end
      end

      render json: ActiveModelSerializers::SerializableResource.new(
        organizations,
        each_serializer: V1::OrganizationSearchResultSerializer,
        prefectures: params[:prefectures],
        meta: { pagination: PaginationSerializer.new(results.records) },
        adapter: :json,
        root: 'organizationSearchResults',
      ).as_json
    end
  end
end
