require 'rails_helper'

RSpec.describe 'Companies::Me', type: :request do
  let(:company) { create(:company) }

  before { login_as(user) }

  describe 'GET /v1/companies/me' do
    context 'ユーザーが所属している会社がある場合' do
      let(:user) { create(:user, company: company) }

      it '所属している会社情報が取得できること' do
        get '/v1/companies/me'

        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['id']).to eq(user.company.id)
        expect(json['name']).to eq(user.company.name)
      end
    end

    context 'ユーザーが所属している会社がない場合' do
      let(:user) { create(:user, company: nil) }

      it '404エラーが返ること' do
        get '/v1/companies/me'

        assert_response_schema_confirm(404)
      end
    end
  end

  describe 'PATCH /v1/companies/me' do
    let(:user) { create(:user, company: company) }

    context '正しいパラメータが送信された場合' do
      let(:params) { { name: 'new_name' } }

      it '会社情報が更新されること' do
        patch '/v1/companies/me', params: params

        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['id']).to eq(user.company.id)
        expect(json['name']).to eq('new_name')
      end
    end

    context '不正なパラメータが送信された場合' do
      let(:params) { { name: '' } }

      it '500エラーが返ること' do
        patch '/v1/companies/me', params: params

        assert_response_schema_confirm(500)
      end
    end
  end
end
