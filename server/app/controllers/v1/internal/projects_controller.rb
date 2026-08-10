module V1
  module Internal
    class ProjectsController < ApplicationController
      skip_before_action :require_login
      before_action :require_internal_api_key
      
      def show
        project = Project.
          for_company(nil).
          includes(
            :lg_codes,
            :organization,
            :project_summary_usages,
            :participate_qualification_grades,
            external_documents: { file_attachment: :blob },
            screenshots: { file_attachment: :blob },
            awarded_project: { bidders: :bid_company }
          ).
          find_by!(uuid: params[:uuid])
          
        render json: project, serializer: V1::ProjectWithIdSerializer,
          include: {
            attachments: { file_attachment: :blob },
            screenshots: { file_attachment: :blob },
            awarded_project: {
              bidders: :bid_company
            }
          }
      end
    end
  end
end