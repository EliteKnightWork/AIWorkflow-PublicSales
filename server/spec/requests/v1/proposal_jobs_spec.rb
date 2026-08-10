require 'rails_helper'

RSpec.describe 'V1::ProposalJobs' do
  around do |example|
    original_queue_url = ENV['PROPOSAL_QUEUE_URL']
    ENV['PROPOSAL_QUEUE_URL'] = 'test-queue'
    example.run
  ensure
    ENV['PROPOSAL_QUEUE_URL'] = original_queue_url
  end

  describe 'POST /v1/proposal_jobs' do
    subject(:perform_request) do
      post '/v1/proposal_jobs', params: { project_uuid: project.uuid }
    end

    let(:project) { create(:project, :with_external_documents) }
    let(:sqs_service) { instance_double(SqsService, send_message: 'message-id') }

    before do
      login_as(user)
      allow(SqsService).to receive(:new).and_return(sqs_service)
    end

    context 'ユーザーが企業に所属していない場合' do
      let(:user) { create(:user, company: nil) }

      it 'returns 403 forbidden' do
        perform_request
        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body['error']).to eq('この機能を使用する権限がありません')
        expect(SqsService).not_to have_received(:new)
      end
    end

    context '企業に提案書作成機能が付与されていない場合' do
      let(:user) { create(:user) }

      it 'returns 403 forbidden' do
        perform_request
        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body['error']).to eq('この機能を使用する権限がありません')
        expect(sqs_service).not_to have_received(:send_message)
      end
    end

    context '企業に提案書作成機能が付与されている場合' do
      let(:user) { create(:user) }

      before do
        feature = create(:feature, key: Feature::KEYS[:proposal_document_create])
        create(:company_feature, company: user.company, feature:)
        allow(Rails.application.routes.url_helpers).to receive(:rails_blob_url).and_return('http://example.com/document.pdf')
      end

      it 'creates a proposal job and returns 200 ok' do
        expect { perform_request }.to change(ProposalJob, :count).by(1)
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['message_id']).to eq('message-id')
        expect(sqs_service).to have_received(:send_message).with('test-queue', kind_of(Hash))
      end
    end
  end
end
