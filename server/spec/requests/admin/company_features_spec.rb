require 'rails_helper'

RSpec.describe 'Admin::CompanyFeatures' do
  before do
    login_as(build(:user))
  end

  describe 'GET /v1/admin/company_features' do
    it '200ステータスが返ること' do
      create(:feature, key: Feature::KEYS[:ai_chat])
      create(:feature, key: Feature::KEYS[:proposal_document_create])
      
      get '/v1/admin/company_features'
      
      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['features']).to be_present
        expect(json['features'].length).to eq(2)
      end
    end

    it 'featuresの一覧が正しく返ること' do
      feature_a = create(:feature, key: Feature::KEYS[:ai_chat], description: 'AI chat feature')
      feature_b = create(:feature, key: Feature::KEYS[:proposal_document_create], description: 'Proposal document create feature')
      
      get '/v1/admin/company_features'
      
      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['features']).to be_an(Array)
        expect(json['features'].length).to eq(2)
        
        feature_keys = json['features'].pluck('key')
        expect(feature_keys).to contain_exactly(feature_a.key, feature_b.key)
        
        feature_a_response = json['features'].find { |f| f['key'] == feature_a.key }
        expect(feature_a_response['key']).to eq(feature_a.key)
        expect(feature_a_response['description']).to eq(feature_a.description)
        
        feature_b_response = json['features'].find { |f| f['key'] == feature_b.key }
        expect(feature_b_response['key']).to eq(feature_b.key)
        expect(feature_b_response['description']).to eq(feature_b.description)
      end
    end

    it 'featuresが空の場合でも200ステータスが返ること' do
      get '/v1/admin/company_features'
      
      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['features']).to eq([])
      end
    end

    it 'featuresがkey順でソートされて返ること' do
      feature_b = create(:feature, key: Feature::KEYS[:proposal_document_create])
      feature_a = create(:feature, key: Feature::KEYS[:ai_chat])
      
      get '/v1/admin/company_features'
      
      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['features'].length).to eq(2)
        expect(json['features'][0]['key']).to eq(feature_a.key)
        expect(json['features'][1]['key']).to eq(feature_b.key)
      end
    end
  end
end

