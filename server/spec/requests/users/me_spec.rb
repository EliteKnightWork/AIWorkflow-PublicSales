require 'rails_helper'

RSpec.describe 'Users::Me', type: :request do
  let(:user) { create(:user) }

  describe 'GET /v1/users/me' do
    context 'ログインしているユーザ' do
      before { login_as(user) }

      it 'ユーザー情報を取得できること' do
        get '/v1/users/me'
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['id']).to eq user.id
        expect(json['email']).to eq user.email
        expect(json['name']).to eq user.name
      end

      it 'ユーザーの認証プロバイダー情報を取得できること' do
        user.user_tokens.create(token_provider: 'google_oauth2')
        get '/v1/users/me'
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['authorizedProviders']).to include('google_oauth2')
      end
    end

    context 'ログインしていないユーザ' do
      it 'ユーザー情報を取得できないこと' do
        get '/v1/users/me'
        assert_response_schema_confirm(401)
      end
    end
  end

  describe 'PATCH /v1/users/me' do
    context 'ログインしているユーザ' do
      before { login_as(user) }

      context '正しいパラメータが送信された場合' do
        let(:params) { { name: 'new_name' } }

        it 'ユーザー情報が更新されること' do
          patch '/v1/users/me', params: params
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['id']).to eq user.id
          expect(json['name']).to eq 'new_name'
        end
      end
    end

    context 'ログインしていないユーザ' do
      it 'ユーザー情報を更新できないこと' do
        patch '/v1/users/me'
        assert_response_schema_confirm(401)
      end
    end
  end
end
