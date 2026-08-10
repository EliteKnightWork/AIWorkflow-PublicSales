module V1
  class ReactedProjectsController < ApplicationController
    serialization_scope :current_user

    def index
      # NOTE: 組織に所属していない場合は403を返す
      if current_user.company.nil?
        return render json: { errors: ['forbidden'] }, status: :forbidden
      end

      # reactionパラメータの検証
      reaction_value = params[:reaction]
      unless %w[dislike neutral like].include?(reaction_value)
        return render json: { error: '無効なリアクションです。like、neutral、dislikeのいずれかを指定してください' }, status: :bad_request
      end

      user_ids = current_user.company.user_ids
      
      project_reactions = ProjectReaction.where(user_id: user_ids, reaction: reaction_value)
        .includes(
          :user,
          project: [
            :lg_codes,
            :project_security_qualifications,
            { external_documents: { file_attachment: :blob } },
            { screenshots: { file_attachment: :blob } },
            { project_reactions: :user }
          ]
        )
        .joins(:project)
        .merge(Project.for_company(current_user.company_id).visible.order(build_order_param(params[:sort_by])))
      
      project_reactions = project_reactions.where(user_id: params[:user_ids]) if params[:user_ids].present?

      # プロジェクトIDで重複を排除（同じプロジェクトに複数のユーザーがリアクションしている場合）
      uniq_projects = project_reactions.group_by { |r| r.project_id }.map { |_, group| group.first.project }

      render(
        json: uniq_projects,
        each_serializer: V1::ProjectSerializer,
        include: {
          external_documents: { file_attachment: :blob },
          screenshots: { file_attachment: :blob },
        },
        adapter: :json,
        current_user: current_user,
        users: current_user.company.users,
        reaction_type: reaction_value,
        include_reacted_by_list: true,
        root: 'reacted_projects'
      )
    end

    private

    def build_order_param(sort_by)
      case sort_by
      when 'publication_date_asc'
        { publication_date: :asc }
      else
        { publication_date: :desc }
      end
    end
  end
end
