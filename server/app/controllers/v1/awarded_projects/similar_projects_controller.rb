module V1
  module AwardedProjects
    class SimilarProjectsController < ApplicationController
      def index
        project = Project.for_company(current_user.company_id).
          visible.
          joins(:awarded_project).
          includes(:awarded_project, :lg_codes).
          find_by!(uuid: params[:id])

        # デフォルト5件、最大100件まで
        size = params[:size]&.to_i || 5
        size = 100 if size > 100
        size = 1 if size < 1

        similar_projects = AwardedProjectSimilarProjectsFetcher.new(
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
    end
  end
end
