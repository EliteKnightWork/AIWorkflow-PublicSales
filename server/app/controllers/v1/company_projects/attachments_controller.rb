module V1
  module CompanyProjects
    class AttachmentsController < ApplicationController
      def create
        return render json: { errors: ['forbidden'] }, status: :forbidden if current_user&.company_id.blank?

        project = find_project_for_current_company!(params[:company_project_id])

        file = attachment_params[:file]
        if file.blank?
          return render json: { errors: ['file blank'] }, status: :unprocessable_entity
        end

        external_document = project.external_documents.build
        external_document.file.attach(file)

        if external_document.save
          external_document.extract_and_update_text

          render json: external_document, serializer: V1::ExternalDocumentSerializer, status: :created
        else
          render json: { errors: external_document.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        return render json: { errors: ['forbidden'] }, status: :forbidden if current_user&.company_id.blank?

        project = find_project_for_current_company!(params[:company_project_id])
        external_document = project.external_documents.find(params[:id])

        if external_document.destroy
          head :no_content
        else
          render json: { errors: external_document.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def attachment_params
        params.expect(attachment: [:file])
      end

      def find_project_for_current_company!(company_project_id)
        CompanyProject
          .find_by!(company_id: current_user.company_id, id: company_project_id)
          .project
      end
    end
  end
end
