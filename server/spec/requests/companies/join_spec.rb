require 'rails_helper'

RSpec.describe 'Companies::Join', type: :request do
  let(:company) { create(:company) }

  before { login_as(user) }

  describe 'POST /v1/companies/join' do
    let(:user) { create(:user, company: nil) }

    context '招待トークンが正しい場合' do
      let(:token) { company.generate_token_for(:invitation) }

      it 'ユーザーが会社に所属すること' do
        post '/v1/companies/join', params: { token: token }

        assert_response_schema_confirm(201)
        json = response.parsed_body
        expect(json['id']).to eq(company.id)
        expect(json['name']).to eq(company.name)
      end
    end

    context '招待トークンが不正な場合' do
      it '400エラーが返ること' do
        post '/v1/companies/join', params: { token: 'invalid_token' }

        assert_response_schema_confirm(400)
      end
    end
  end
end
