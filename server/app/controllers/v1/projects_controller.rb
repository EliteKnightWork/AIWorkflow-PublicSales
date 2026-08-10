module V1
  class ProjectsController < ApplicationController
    include GuestFeatureUsageLimitable

    limit_guest_usage redirects: {
      search: '/projects/limited',
      show: '/projects/show/limited'
    }

    skip_before_action :require_login, only: [:search, :show]

    serialization_scope :current_user

    def search
      per_page = params[:per_page]&.to_i || 100
      per_page = 100 if per_page > 100

      # NOTE: project_searchable で only_awarded と tab=awarded の処理を重複させないための一時的な対応
      #       将来的に only_awarded は廃止予定
      params[:only_awarded] = true if params[:tab] == 'awarded'
      params[:tab] = nil if params[:tab] == 'awarded'

      # use_synonym_search パラメータを検索パラメータに含める
      params[:use_synonym_search] = ActiveModel::Type::Boolean.new.cast(params[:use_synonym_search]) if params.has_key?(:use_synonym_search)

      result = Project.for_company(nil).search(params).page(params[:page]).per(per_page)
      total_projects = result.records
      project_ids = total_projects.ids

      projects = Project.for_company(nil).
        includes(
          :lg_codes,
          :organization,
          :project_summary_usages,
          :favorites,
          :participate_qualification_grades,
          :project_security_qualifications,
          :bid_pipelines,
          :project_reactions,
          external_documents: { file_attachment: :blob },
          screenshots: { file_attachment: :blob },
          awarded_project: { bidders: :bid_company }
        ).
        where(id: project_ids).
        in_order_of(:id, project_ids)

      # ステータスごとの件数
      buckets = result.aggregations.dig('tabs', 'buckets')

      render(
        json: projects,
        each_serializer: V1::ProjectSerializer,
        current_user: current_user,
        include: {
          attachments: { file_attachment: :blob },
          screenshots: { file_attachment: :blob },
          awarded_project: {
            bidders: :bid_company
          }
        },
        meta: {
          pagination: PaginationSerializer.new(total_projects),
          aggregation: AggregationSerializer.new(buckets),
        },
        adapter: :json,
        root: 'projects'
      )
    end

    def show
      project = Project.for_company(current_user&.company_id).
        includes(
          :project_security_qualifications,
          external_documents: { file_attachment: :blob },
          screenshots: { file_attachment: :blob },
          awarded_project: { bidders: :bid_company }
        ).
        visible.
        find_by!(uuid: params[:id])
      render json: project, serializer: V1::ProjectSerializer, current_user: current_user,
        include: {
          attachments: { file_attachment: :blob },
          screenshots: { file_attachment: :blob },
          awarded_project: {
            bidders: :bid_company
          }
        }
    end

    def similar_projects
      project = Project.for_company(current_user.company_id).visible.find_by!(uuid: params[:id])

      # デフォルト10件、最大100件まで
      size = params[:size]&.to_i || 10
      size = 100 if size > 100
      size = 1 if size < 1

      similar_projects = ProjectSimilarProjectsFetcher.new(
        project: project,
        company_id: current_user.company_id,
        size: size
      ).call

      render(
        json: similar_projects,
        each_serializer: V1::ProjectSerializer,
        adapter: :json,
        root: 'projects'
      )
    end

    def business_description_search
      business_description_format = current_user.company.business_description_formats.find(params[:business_description_format_id])
      preset = search_filter_preset_params

      result = Project.for_company(current_user.company_id).recommendation_search(
        [ business_description_format[:embedding]['embedding'] ],
        preset,
        [],
        size: params[:size] || 10,
        status: params[:status] || 'open',
      )

      project_ids = result.records.ids
      projects = Project.for_company(current_user.company_id).
        includes(:lg_codes, :project_security_qualifications, external_documents: { file_attachment: :blob }, screenshots: { file_attachment: :blob }).
        where(id: project_ids).
        in_order_of(:id, project_ids)

      render(
        json: projects,
        each_serializer: V1::ProjectSerializer,
        adapter: :json,
        root: 'projects'
      )
    end

    private

    def search_filter_preset_params
      SearchFilterPreset.new(
        keywords: params[:keywords],
        or_keywords: params[:or_keywords],
        not_keywords: params[:not_keywords],
        prefectures: params[:prefectures],
        publication_date_from: params[:publication_date_from],
        publication_date_to: params[:publication_date_to],
        planned_price_from: params[:planned_price_from],
        planned_price_to: params[:planned_price_to],
      )
    end

  end
end
