module V1
  class CompanyProjectsController < ApplicationController
    def create
      # company_id が取得できない場合は登録不可
      return render json: { errors: ['forbidden'] }, status: :forbidden if current_user&.company_id.blank?

      transaction = Transactions::CreateCompanyProject.new(current_user.company_id, params)
      if transaction.exec
        project = transaction.project

        # トランザクション完了後に添付ファイルのテキスト抽出とサマリ生成を非同期で実行
        DocumentProcessingJob.perform_later(project.id)

        render json: project, serializer: V1::ProjectSerializer, status: :created
      else
        render json: { errors: transaction.errors }, status: :unprocessable_entity
      end
    end

    def update
      return render json: { errors: ['forbidden'] }, status: :forbidden if current_user&.company_id.blank?

      company_id = current_user.company_id
      company_project = CompanyProject.find_by!(company_id: company_id, id: params[:id])
      project = company_project.project

      if project.update_with(params)
        render json: project, serializer: V1::ProjectSerializer, status: :ok
      else
        render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      return render json: { errors: ['forbidden'] }, status: :forbidden if current_user&.company_id.blank?

      company_id = current_user.company_id

      company_project = CompanyProject.find_by!(company_id: company_id, id: params[:id])

      if company_project.destroy
        render json: {}, status: :ok
      else
        render json: { errors: company_project.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end
end
