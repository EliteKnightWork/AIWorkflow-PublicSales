require 'rails_helper'

RSpec.describe 'SecurityQualifications' do
  describe 'GET /v1/security_qualifications' do
    before do
      login_as(create(:user))
    end

    it '情報セキュリティ資格の一覧をレスポンスできること' do
      create(:security_qualification, code: 'QualificationA', display_name: 'QualificationA')
      create(:security_qualification, code: 'QualificationB', display_name: 'QualificationB')

      get '/v1/security_qualifications'

      aggregate_failures do
        assert_response_schema_confirm(200)
        json_response = response.parsed_body['securityQualifications']
        expect(json_response.length).to eq(2)

        expect(json_response[0]['code']).to eq('QualificationA')
        expect(json_response[0]['displayName']).to eq('QualificationA')
        expect(json_response[1]['code']).to eq('QualificationB')
        expect(json_response[1]['displayName']).to eq('QualificationB')
      end
    end
  end
end