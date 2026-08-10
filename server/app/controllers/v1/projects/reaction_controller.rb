module V1
  module Projects
    class ReactionController < ApplicationController
      serialization_scope :current_user

      def update
        project = Project.for_company(current_user.company_id).visible.find_by!(uuid: params[:id])

        reaction_value = params[:reaction]
        unless %w[dislike neutral like].include?(reaction_value)
          render json: { error: '無効なリアクションです' }, status: :bad_request
          return
        end

        reaction_record = current_user.project_reactions.find_or_initialize_by(project: project)
        reaction_record.reaction = reaction_value

        if reaction_record.save
          render(
            json: project,
            serializer: ProjectSerializer,
            current_user: current_user,
            status: :ok,
          )
        else
          render json: { error: 'リアクションの更新に失敗しました' }, status: :internal_server_error
        end
      end
    end
  end
end
