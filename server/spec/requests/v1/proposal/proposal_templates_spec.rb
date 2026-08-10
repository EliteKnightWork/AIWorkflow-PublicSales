require 'rails_helper'

RSpec.describe 'V1::ProposalTemplates', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let!(:proposal_template) { create(:proposal_template, company: company) }

  before do
    login_as(user)
  end

  def json_response
    response.parsed_body
  end

  describe 'GET /v1/proposal_templates' do
    context 'ユーザーが会社に属している場合' do
      it '正常にテンプレート一覧を取得できる' do
        get '/v1/proposal_templates'
        expect(response).to be_successful
        expect(json_response['templates'].size).to eq(1)
        expect(json_response['templates'].first['id']).to eq(proposal_template.id)
      end
    end

    context 'ユーザーが会社に属していない場合' do
      before do
        user.update(company: nil)
      end

      it 'エラーが返る' do
        get '/v1/proposal_templates'
        expect(response).to have_http_status(:forbidden)
        expect(json_response['errors']).to include('会社に所属していないため、提案書テンプレートにアクセスできません')
      end
    end
  end

  describe 'GET /v1/proposal_templates/:id' do
    it '正常にテンプレート詳細を取得できる' do
      get "/v1/proposal_templates/#{proposal_template.id}"
      expect(response).to be_successful
      expect(json_response['id']).to eq(proposal_template.id)
    end
  end

  describe 'DELETE /v1/proposal_templates/:id' do
    it 'テンプレートを削除できる' do
      expect {
        delete "/v1/proposal_templates/#{proposal_template.id}"
      }.to change(ProposalTemplate, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end

    context 'ユーザーのcompanyに属していないテンプレートの場合' do
      let!(:other_company) { create(:company) }
      let!(:other_template) { create(:proposal_template, company: other_company) }

      it '削除できず、403が返る' do
        expect {
          delete "/v1/proposal_templates/#{other_template.id}"
        }.not_to change(ProposalTemplate, :count)
        expect(response).to have_http_status(:forbidden)
        expect(json_response['errors']).to include('このテンプレートを削除する権限がありません')
      end
    end
  end
end 