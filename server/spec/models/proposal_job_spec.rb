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
require 'rails_helper'

RSpec.describe ProposalJob, type: :model do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:project) { create(:project) }
  let(:proposal_job) { described_class.create!(company: company, user: user, project: project, status: :processing) }

  describe 'ファクトリのバリデーション' do
    it '有効なファクトリを持つこと' do
      expect(proposal_job).to be_valid
    end
  end

  describe '#register_proposal_document' do
    let(:params) do
      {
        proposal_file_data: 'test/key',
        proposal_file_name: 'test.pdf',
        proposal_content_type: 'application/pdf',
      }
    end

    let(:blob) { instance_double(ActiveStorage::Blob) }
    let(:file_attachment) { instance_double(ActiveStorage::Attachment) }

    before do
      allow(ActiveStorage::Blob).to receive(:create_before_direct_upload!).and_return(blob)
      allow_any_instance_of(ProposalDocument).to receive(:file).and_return(instance_double(ActiveStorage::Attached::One, attach: file_attachment))
      allow_any_instance_of(ProposalDocument).to receive(:save!).and_return(true)
    end

    it '提案書ドキュメントを登録し、statusがcompletedになること' do
      expect {
        proposal_job.register_proposal_document(params)
      }.to change { proposal_job.reload.status }.from('processing').to('completed')
      expect(proposal_job.proposal_document).to be_present
    end

    context '例外が発生した場合' do
      before do
        allow(Base64).to receive(:decode64).and_raise(StandardError, 'blob error')
      end

      it 'statusがfailedになり、エラーメッセージがセットされること' do
        expect {
          begin
            proposal_job.register_proposal_document(params)
          rescue
            # エラーが発生した場合は何もしない
          end
        }.to change { proposal_job.reload.status }.from('processing').to('failed')
        expect(proposal_job.error_message).to include('提案書ファイルの処理中にエラーが発生しました')
      end
    end
  end
end 
