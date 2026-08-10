require 'rails_helper'

RSpec.describe 'Organizations' do
  describe 'GET /v1/organizations/search' do

    context 'ログインしている場合' do
      before { login_as(create(:user)) }

      it '都道府県を2つ以上指定して検索できること' do
        get "/v1/organizations/search?#{{ prefectures: [10, 11] }.to_query}"
        assert_response_schema_confirm(200)
      end

      it '2ページ目以降を指定して検索できること' do
        get "/v1/organizations/search?#{{ page: 2 }.to_query}"
        assert_response_schema_confirm(200)
      end

      it '1ページあたりの件数を指定して検索できること' do
        get "/v1/organizations/search?#{{ per_page: 10 }.to_query}"
        assert_response_schema_confirm(200)
      end

      it '1ページあたりの件数が100件を超える場合は100件で検索されること' do
        get "/v1/organizations/search?#{{ per_page: 101 }.to_query}"
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['meta']['pagination']['limit']).to eq(100)
      end

      it '複数のor_keywordsを指定しても検索できること' do
        get "/v1/organizations/search?#{{ or_keywords: ['hoge', 'aaa'] }.to_query}"
        assert_response_schema_confirm(200)
      end
    end

    context 'ログインしていない場合' do
      it '401エラーが返されること' do
        create_list(:organization, 3)

        get '/v1/organizations/search'
        assert_response_schema_confirm(401)
      end
    end
  end
end
