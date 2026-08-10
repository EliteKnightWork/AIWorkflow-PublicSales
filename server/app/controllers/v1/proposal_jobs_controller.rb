module V1
  class ProposalJobsController < ApplicationController
    
    skip_before_action :require_login, only: :update
    
    def create
      # ユーザーが会社に所属しているか確認
      return render json: { error: 'この機能を使用する権限がありません' }, status: :forbidden if current_user.company.blank?
      
      # 会社にPROPOSAL_DOCUMENT_CREATE機能があるか確認
      return render json: { error: 'この機能を使用する権限がありません' }, status: :forbidden unless current_user.company.has_feature?(Feature::KEYS[:proposal_document_create])
      
      project = Project.for_company(current_user.company_id).find_by(uuid: params[:project_uuid])
      return render json: { error: 'Project not found' }, status: :not_found unless project

      template_id = nil
      template_file_url = nil
      if params[:template_id].present?
        template = ProposalTemplate.find_by(id: params[:template_id])
        template_id = template.id
        return render json: { error: 'Template not found' }, status: :not_found unless template
        template_file_url = template.file.url(expires_in: 3600)
      end

      external_document_urls = project.external_documents.select { |doc| doc.file.content_type == 'application/pdf' || doc.file.content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }.map { |doc| Rails.application.routes.url_helpers.rails_blob_url(doc.file) }
      
      if external_document_urls.empty?
        return render json: { error: '提案書作成のために読み取りができるファイルがありませんでした' }, status: :bad_request
      end

      # SQSにメッセージを送信
      message = {
        project_info:{
          uuid: project.uuid,
          title: project.title,
          organization_name: project.organization_name,
          external_document_urls: external_document_urls,
        },
        company_name: current_user.company.name,
        template_id: template_id,
        template_presigned_url: template_file_url,
      }
      sqs_service=SqsService.new
      message_id = sqs_service.send_message(ENV['PROPOSAL_QUEUE_URL'], message)

      # Proposal作成ジョブ情報のデータ登録
      ProposalJob.create!(
        company_id: current_user.company_id,
        user_id: current_user.id,
        project_id: project.id,
        status: 'processing',
        job_message_id: message_id,
        proposal_document_id: nil
      )
      
      render json: { message_id: message_id }, status: :ok
    rescue => e
      Rails.logger.error("Error in create proposal: #{e.message}")
      render json: { error: 'Internal server error' }, status: :internal_server_error
    end

    def update
      proposal_job = ProposalJob.find_by(job_message_id: params[:id])
      return render json: { error: 'Proposal job not found' }, status: :not_found unless proposal_job

      # proposal_jobのstatusがすでにcompletedあるいはfailedの場合は更新しない
      if proposal_job.status == 'completed' || proposal_job.status == 'failed'
        return render json: { error: 'Proposal job status is already completed or failed' }, status: :bad_request
      end

      proposal_job_notify_service = NotifySlackService.new(ENV["SLACK_WEBHOOK_URL_PROPOSAL_NOTIFY"])

      is_success = params[:is_success]
      if is_success

        proposal_job.register_proposal_document(params)

        proposal_job.update!(status: 'completed', proposal_document_id: proposal_job.proposal_document_id)

        # ユーザーにメール送信
        proposal_job.send_proposal_created_notification(proposal_job)

        proposal_job_notify_service.send_message("
          【提案書の作成に成功しました】\n
          会社名: #{proposal_job.company.name}\n
          案件名: #{proposal_job.project.title}
          ")

      else
        error_message = params[:error_message]

        # 失敗理由を取得して登録
        proposal_job.update!(status: 'failed', error_message: error_message)

        # ユーザーに作成失敗を通知
        proposal_job.send_proposal_create_failed_notification(proposal_job, error_message)

        proposal_job_notify_service.send_message("
          【提案書の作成に失敗しました】\n
          会社名: #{proposal_job.company.name}\n
          案件名: #{proposal_job.project.title}\n
          メッセージ: #{error_message}\n
          ")
      end
      
      render json: { response: 'ok' }, status: :ok
    rescue => e
      Rails.logger.error("Error in update proposal: #{e.message}")
      proposal_job_notify_service.send_message("
        【提案書の作成に失敗しました】\n
        会社名: #{proposal_job.company.name}\n
        案件名: #{proposal_job.project.title}\n
        メッセージ: #{error_message}\n
        ")
      render json: { error: 'Internal server error' }, status: :internal_server_error
    end
  end
end 