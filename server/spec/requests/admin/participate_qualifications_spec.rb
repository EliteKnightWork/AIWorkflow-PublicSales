require 'rails_helper'

RSpec.describe 'Admin::ParticipateQualification' do
  describe 'GET /v1/admin/participate_qualifications' do
    before do
      create_list(:participate_qualification, 3)
    end

    it '200ステータスが返ること' do
      get '/v1/admin/participate_qualifications'
      assert_response_schema_confirm(200)
    end

    it 'ページネーションが正しく機能すること' do
      get '/v1/admin/participate_qualifications', params: { page: 1 }

      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['participateQualifications']).to be_present
      end
    end

    it '名前による絞り込みができること' do
      create(:participate_qualification, name: '建設業許可')
      create(:participate_qualification, name: 'その他の資格')

      get '/v1/admin/participate_qualifications', params: { name: '建設' }

      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['participateQualifications']).to be_present
        expect(json['participateQualifications'].size).to eq(1)
        expect(json['participateQualifications'].first['name']).to include('建設')
      end
    end
  end
end
