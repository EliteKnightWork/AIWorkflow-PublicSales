require 'rails_helper'

RSpec.describe 'Companies::Invitation', type: :request do
  let(:company) { create(:company) }

  before { login_as(user) }

  describe 'GET /v1/companies/invitation' do
    context 'ユーザーが所属している会社がある場合' do
      let(:user) { create(:user, company: company) }

      it '招待トークンが取得できること' do
        get '/v1/companies/invitation'

        assert_response_schema_confirm(200)
        json = response.parsed_body
        company = Company.find_by_token_for(:invitation, json['token'])
        expect(company).to eq(user.company)
      end
    end

    context 'ユーザーが所属している会社がない場合' do
      let(:user) { create(:user, company: nil) }

      it '404エラーが返ること' do
        get '/v1/companies/invitation'

        assert_response_schema_confirm(404)
      end
    end
  end
end
