module V1
  class RecommendationsController < ApplicationController
    serialization_scope :current_user

    def index
      if params[:search_filter_preset_id].nil?
        render json: { errors: ['検索条件IDを設定してください'] }, status: :bad_request
        return
      end

      owner = current_user.company || current_user
      preset = owner.search_filter_presets.find(params[:search_filter_preset_id])
      if (preset[:keywords].blank? && preset[:or_keywords].blank? ) || preset[:business_description].blank?
        render json: { errors: ['検索条件が不正です'] }, status: :bad_request
        return
      end

      fav_titles = []
      if is_favorite_used_recommend_search_enabled?
        fav_titles = preset.business_description_favorite_projects.map { |f| f.project.title }
      end

      results = Project.for_company(current_user.company_id).recommendation_search(
        [ preset[:business_description_embedding]['embedding'] ],
        preset,
        fav_titles,
        size: params[:size] || 10,
        status: params[:status] || 'open',
      )
      project_ids = results.records.ids

      projects = Project.for_company(current_user.company_id).
        includes(
          :lg_codes,
          :project_security_qualifications,
          external_documents: { file_attachment: :blob },
          screenshots: { file_attachment: :blob }
        ).
        where(id: project_ids).
        in_order_of(:id, project_ids)

      render(
        json: projects,
        each_serializer: V1::ProjectSerializer,
        adapter: :json,
        root: 'projects',
        current_user: current_user,
        meta: {
          scores: results.results.pluck(:_score),
        },
      )
    end

    private

    def is_favorite_used_recommend_search_enabled?
      is_favorite_used_recommend_search_enabled = ENV["IS_FAVORITE_USED_RECOMMEND_SEARCH_ENABLED"] || "false"

      is_favorite_used_recommend_search_enabled.downcase == "true"
    end
  end
end
