# == Schema Information
#
# Table name: proposal_job
# Database name: primary
#
#  id                                                :bigint           not null, primary key
#  error_message(エラーメッセージ)                   :text(65535)
#  status(ステータス(processing, completed, failed)) :string(255)      not null
#  created_at                                        :datetime         not null
#  updated_at                                        :datetime         not null
#  company_id(企業ID)                                :bigint           not null
#  job_message_id(ジョブメッセージID)                :text(65535)
#  project_id(入札案件ID)                            :bigint           not null
#  proposal_document_id(提案書ID)                    :bigint
#  user_id(リクエストユーザーID)                     :bigint           not null
#
# Indexes
#
#  index_proposal_job_on_company_id            (company_id)
#  index_proposal_job_on_project_id            (project_id)
#  index_proposal_job_on_proposal_document_id  (proposal_document_id)
#  index_proposal_job_on_user_id               (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (proposal_document_id => proposal_documents.id)
#  fk_rails_...  (user_id => users.id)
#
class ProposalJob < ApplicationRecord
  self.table_name = 'proposal_job'
  belongs_to :company
  belongs_to :user
  belongs_to :project
  belongs_to :proposal_document, optional: true

  enum :status, { processing: 'processing', completed: 'completed', failed: 'failed' }

  def register_proposal_document(params)
    begin
      
      proposal_file_data = params[:proposal_file_data]
      proposal_file_name = params[:proposal_file_name]
      content_type = params[:proposal_content_type]

      # proposal_file_dataがBase64エンコードされた文字列の場合、デコードする
      if proposal_file_data.is_a?(String)
        Rails.logger.info("proposal_file_data is a String, decoding from Base64")
        decoded_data = Base64.decode64(proposal_file_data)
        io = StringIO.new(decoded_data)
        # ファイル名やcontent_typeは適宜パラメータで受け取る必要あり
        attach_params = {
          io: io,
          filename: proposal_file_name,
          content_type: content_type
        }
      else
        # それ以外はそのままattach
        attach_params = proposal_file_data
      end

      # ProposalDocumentを作成
      proposal_document = ProposalDocument.new(company: self.company, user: self.user)
      
      # Blobデータをアタッチ
      proposal_document.file.attach(attach_params)
      
      # 保存
      if proposal_document.save!
        # ProposalJobとProposalDocumentを関連付け
        self.proposal_document = proposal_document
        self.status = :completed
        self.save
      end
    rescue => e
      self.update(
        status: :failed,
        error_message: "提案書ファイルの処理中にエラーが発生しました: #{e.message}"
      )
      Rails.logger.error("ProposalJob#register_proposal_document: #{e.message}")
      raise e
    end
  end

  def send_proposal_created_notification(proposal_job)
    # ユーザーのメール通知設定を取得
    email = user.email

    Rails.logger.info("send mail for proposal created: #{proposal_job}")

    # メールを送信
    ProposalMailer.with(
      email: email,
      proposal_job: proposal_job
    ).proposal_created.deliver_now
  end

  def send_proposal_create_failed_notification(proposal_job, error_message)
    # ユーザーのメール通知設定を取得
    email_notification = user.notification_methods.find_by(notifiable_type: 'EmailNotification')&.notifiable
    if email_notification.email?
      email = email_notification.email
    else
      email = user.email
    end

    # メールを送信
    ProposalMailer.with(
      email: email,
      proposal_job: proposal_job,
      error_message: error_message
    ).proposal_create_failed.deliver_now
  end
end 
