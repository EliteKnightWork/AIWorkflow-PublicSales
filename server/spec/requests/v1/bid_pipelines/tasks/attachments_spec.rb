require 'rails_helper'

RSpec.describe 'V1::BidPipelines::Tasks::Attachments', type: :request do
  let(:user) { create(:user) }
  let!(:bid_pipeline) { create(:bid_pipeline, company: user.company) }
  let!(:task) { create(:bid_pipeline_task, bid_pipeline: bid_pipeline) }
  let!(:attachment) { create(:bid_pipeline_task_attachment, bid_pipeline_task: task) }
  let(:file) { fixture_file_upload('spec/fixtures/dummy.pdf', 'application/pdf') }

  before { login_as(user) }

  describe 'GET /v1/bid_pipelines/:bid_pipeline_id/attachments' do
    context '正常な場合' do
      it '添付ファイル一覧が取得できること' do
        get "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/#{task.id}/attachments"
        assert_response_schema_confirm(200)
        expect(response.parsed_body.size).to eq(1)
      end
    end

    context '存在しない案件IDを指定した場合' do
      it '404エラーが返ること' do
        get "/v1/bid_pipelines/9999/tasks/9999/attachments"
        assert_response_schema_confirm(404)
      end
    end
  end

  describe 'POST /v1/bid_pipelines/:bid_pipeline_id/attachments' do
    let(:valid_params) { { attachment: { file: file } } }

    context '正常な場合' do
      it '添付ファイルがアップロードできること' do
        expect {
          post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/#{task.id}/attachments", params: valid_params
        }.to change(BidPipelineTaskAttachment, :count).by(1)
        assert_response_schema_confirm(201)
        expect(response.parsed_body['url']).to be_present
      end
    end

    context 'ファイルが指定されていない場合' do
      it '422エラーが返ること' do
        expect {
          post "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/#{task.id}/attachments", params: { attachment: { file: nil } }
        }.not_to(change(BidPipelineTaskAttachment, :count))
        assert_response_schema_confirm(422)
      end
    end
  end

  describe 'GET /v1/bid_pipelines/:bid_pipeline_id/attachments/:id' do
    context '正常な場合' do
      it '添付ファイルが取得できること' do
        get "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/#{task.id}/attachments/#{attachment.id}"
        assert_response_schema_confirm(200)
        expect(response.parsed_body['url']).to eq Rails.application.routes.url_helpers.rails_blob_url(attachment.file)
      end
    end

    context '存在しない添付ファイルIDを指定した場合' do
      it '404エラーが返ること' do
        get "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/#{task.id}/attachments/9999"
        assert_response_schema_confirm(404)
      end
    end
  end

  describe 'DELETE /v1/bid_pipelines/:bid_pipeline_id/attachments/:id' do
    context '正常な場合' do
      it '添付ファイルが削除できること' do
        expect {
          delete "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/#{task.id}/attachments/#{attachment.id}"
        }.to change(BidPipelineTaskAttachment, :count).by(-1)
        assert_response_schema_confirm(204)
      end
    end

    context '存在しない添付ファイルIDを指定した場合' do
      it '404エラーが返ること' do
        expect {
          delete "/v1/bid_pipelines/#{bid_pipeline.id}/tasks/#{task.id}/attachments/9999"
        }.not_to(change(BidPipelineTaskAttachment, :count))
        assert_response_schema_confirm(404)
      end
    end
  end
end
