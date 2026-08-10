module V1
  module Admin
    class ExternalDocumentsController < ApplicationController
      skip_before_action :require_login

      def show
        project = Project.for_company(nil).find_by(uuid: params[:id])

        if project
          texts = project.external_documents.pluck(:text).join("\n")
          render json: { combined_texts: texts }
        else
          render json: { errors: ["Project not found"] }, status: :not_found
        end
      end
    end
  end
end
