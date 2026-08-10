require 'rails_helper'

RSpec.describe 'V1::Proposal::Template', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  before do
    login_as(user)
  end
  
  def json_response
    response.parsed_body
  end

  describe 'POST /v1/proposal/template' do
    context 'with valid file format' do
      it 'creates a new proposal template with PowerPoint file' do
        file = fixture_file_upload(Rails.root.join('spec/fixtures/files/test.pptx'), 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
        
        expect {
          post '/v1/proposal/template', params: { file: file }
        }.to change(ProposalTemplate, :count).by(1)
        
        expect(response).to have_http_status(:created)
        expect(json_response['id']).to be_present
        expect(json_response['url']).to be_present
        expect(json_response['name']).to eq('test.pptx')
      end
    end

    context 'with invalid file format' do
      it 'returns an error for PDF file' do
        file = fixture_file_upload(Rails.root.join('spec/fixtures/files/test.pdf'), 'application/pdf')
        
        expect {
          post '/v1/proposal/template', params: { file: file }
        }.not_to change(ProposalTemplate, :count)
        
        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to include(/ファイル形式が無効です/)
      end

      it 'returns an error for image file' do
        file = fixture_file_upload(Rails.root.join('spec/fixtures/files/test.jpg'), 'image/jpeg')
        
        expect {
          post '/v1/proposal/template', params: { file: file }
        }.not_to change(ProposalTemplate, :count)
        
        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response['errors']).to include(/ファイル形式が無効です/)
      end
    end
  end
end
