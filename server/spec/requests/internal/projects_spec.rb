require 'rails_helper'

RSpec.describe 'Internal::Projects' do
  let(:api_key) { 'test-api-key' }
  let(:headers) { { 'X-Api-Key' => api_key } }

  around do |example|
    original_internal_api_key = ENV['INTERNAL_API_KEY']
    ENV['INTERNAL_API_KEY'] = api_key
    example.run
  ensure
    ENV['INTERNAL_API_KEY'] = original_internal_api_key
  end

  describe 'GET /v1/internal/projects/:uuid' do
    context '正常系' do
      it 'ログインなしでプロジェクト詳細を取得できること' do
        project = create(:project)
        
        get "/v1/internal/projects/#{project.uuid}", headers: headers
        
        expect(response.parsed_body['uuid']).to eq(project.uuid)
        expect(response.parsed_body['title']).to eq(project.title)
      end
      
      it '関連データを含むプロジェクトを取得できること' do
        project = create(:project)
        create(:awarded_project, project: project)
        
        get "/v1/internal/projects/#{project.uuid}", headers: headers
        
        expect(response.parsed_body['uuid']).to eq(project.uuid)
      end
    end
    
    context '異常系' do
      it '存在しないUUIDの場合404エラーになること' do
        get "/v1/internal/projects/non-existent-uuid", headers: headers
        expect(response.status).to eq(404)
      end

      it 'x-api-keyヘッダーがない場合401エラーになること' do
        project = create(:project)
        get "/v1/internal/projects/#{project.uuid}"
        expect(response.status).to eq(401)
      end

      it 'x-api-keyヘッダーが不正な場合401エラーになること' do
        project = create(:project)
        get "/v1/internal/projects/#{project.uuid}", headers: { 'X-Api-Key' => 'invalid-key' }
        expect(response.status).to eq(401)
      end
    end
  end
end
