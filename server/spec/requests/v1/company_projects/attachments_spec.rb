require 'rails_helper'

RSpec.describe 'V1::CompanyProjects::Attachments', type: :request do
  let(:user) { create(:user) }
  let!(:company_project) { create(:company_project, :with_project, company: user.company) }
  let(:project) { company_project.project }
  let(:file) { fixture_file_upload('spec/fixtures/dummy.pdf', 'application/pdf') }

  before { login_as(user) }

  describe 'POST /v1/company_projects/:id/attachments' do
    let(:valid_params) { { attachment: { file: file } } }

    context '正常な場合' do
      it '添付ファイルがアップロードできること' do
        expect {
          post "/v1/company_projects/#{company_project.id}/attachments", params: valid_params
        }.to change(ExternalDocument, :count).by(1)
        assert_response_schema_confirm(201)
        expect(response.parsed_body['url']).to be_present
      end
    end

    context 'ファイルが指定されていない場合' do
      it '422エラーが返ること' do
        expect {
          post "/v1/company_projects/#{company_project.id}/attachments", params: { attachment: { file: nil } }
        }.not_to(change(ExternalDocument, :count))
        assert_response_schema_confirm(422)
      end
    end
  end

  describe 'DELETE /v1/company_projects/:id/attachments/:id' do
    let!(:attachment) { create(:external_document, attachable: project) }

    context '正常な場合' do
      it '添付ファイルが削除できること' do
        expect {
          delete "/v1/company_projects/#{company_project.id}/attachments/#{attachment.id}"
        }.to change(ExternalDocument, :count).by(-1)
        assert_response_schema_confirm(204)
      end
    end

    context '存在しない添付ファイルIDを指定した場合' do
      it '404エラーが返ること' do
        expect {
          delete "/v1/company_projects/#{company_project.id}/attachments/999999"
        }.not_to(change(ExternalDocument, :count))
        assert_response_schema_confirm(404)
      end
    end
  end
end
