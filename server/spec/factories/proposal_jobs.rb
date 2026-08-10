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
FactoryBot.define do
  factory :proposal_job do
    company
    user
    project
    proposal_document
    status { 'completed' }
    error_message { nil }
    job_message_id { SecureRandom.uuid }

    trait :completed do
      status { 'completed' }
      proposal_document
    end

    trait :failed do
      status { 'failed' }
      error_message { 'Failed to generate proposal document' }
      proposal_document { nil }
    end

    trait :processing do
      status { 'processing' }
      proposal_document { nil }
    end
  end
end
