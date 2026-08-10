module V1
  module Projects
    class SimilarAwardedProjectsController < ApplicationController
      def index
        project = Project.for_company(current_user.company_id).find_by!(uuid: params[:id])

        # デフォルト20件、最大100件まで
        size = params[:size]&.to_i || 20
        size = 100 if size > 100
        size = 1 if size < 1

        result = Project.for_company(current_user.company_id).similar_awarded_projects_search(project.title, project.lg_codes.map(&:code), size: size)
        project_ids = result.records.ids

        projects = Project.for_company(current_user.company_id).
          includes(
            :project_security_qualifications,
            external_documents: { file_attachment: :blob },
            screenshots: { file_attachment: :blob },
            awarded_project: {
              bidders: :bid_company
            }
          ).
          where(id: project_ids).
          in_order_of(:id, project_ids)

        render(
          json: projects,
          each_serializer: V1::ProjectSerializer,
          adapter: :json,
          root: 'projects'
        )
      end
    end
  end
end
