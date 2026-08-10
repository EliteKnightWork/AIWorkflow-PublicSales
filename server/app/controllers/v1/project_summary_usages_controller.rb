module V1
  class ProjectSummaryUsagesController < ApplicationController
    def summarize
      my_company = current_user.company
      summary_count = my_company.project_summary_usages.where(created_at: Time.current.all_month).count
      if summary_count > 300
        render json: { error: '要約の利用回数の上限に達しました' }, status: :too_many_requests
        return
      end
      project = Project.for_company(current_user.company_id).find_by(uuid: params[:uuid])
      summarize_usage = my_company.project_summary_usages.find_by(project: project)
      if summarize_usage.present?
        render json: { summary: project.summary }, status: :ok
        return
      end

      begin
        summary = project.summary || project.summarize_and_save_summary

        if summary.present?
          project_summary_usage = my_company.project_summary_usages.find_or_initialize_by(project: project)
          if project_summary_usage.save
            render json: { summary: summary }, status: :created
          else
            render json: { errors: ['要約の保存に失敗しました'] }, status: :unprocessable_entity
          end
        else
          render json: { errors: ['要約に必要なテキストがありません'] }, status: :bad_request
        end
      rescue => e
        render json: { errors: ["要約の生成中にエラーが発生しました: #{e.message}"]}, status: :internal_server_error
      end
    end

    def check
      my_company = current_user.company
      project = Project.for_company(current_user.company_id).find_by(uuid: params[:uuid])
      summary_usage = my_company.project_summary_usages.find_by(project: project)

      render json: { isSummarized: summary_usage.present? }
    end
  end
end
