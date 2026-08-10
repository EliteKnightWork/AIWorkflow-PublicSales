require 'rails_helper'

RSpec.describe 'BidCompanies' do
  describe 'GET #search' do
    before do
      create(:bid_company, name: 'Alpha Company')
      create(:bid_company, name: 'Beta Company')
      create(:bid_company, name: 'Gamma Company')
      login_as(create(:user))
    end

    context 'キーワードあり' do
      it 'ヒットあり' do
        get '/v1/bid_companies/search', params: { keywords: ['Alpha'] }

        expect(response).to have_http_status(:success)
        json_response = response.parsed_body
        expect(json_response['bidCompanies'].first['name']).to eq 'Alpha Company'
      end

      it 'ヒットなし' do
        get '/v1/bid_companies/search', params: { keywords: ['Delta'] }

        expect(response).to have_http_status(:success)
        json_response = response.parsed_body
        expect(json_response['bidCompanies']).to eq []
      end

      it '複数キーワード' do
        get '/v1/bid_companies/search', params: { keywords: ['Company', 'Alpha'] }

        expect(response).to have_http_status(:success)
        json_response = response.parsed_body
        names = json_response['bidCompanies'].pluck('name')
        expect(names).to contain_exactly('Alpha Company', 'Beta Company', 'Gamma Company')
      end
    end

    context 'キーワードなし' do
      it 'returns all bid companies' do
        get '/v1/bid_companies/search'

        expect(response).to have_http_status(:success)
        json_response = response.parsed_body
        names = json_response['bidCompanies'].pluck('name')
        expect(names).to contain_exactly('Alpha Company', 'Beta Company', 'Gamma Company')
      end

      it '1ページあたりの件数を指定' do
        get '/v1/bid_companies/search', params: { per_page: 2 }

        expect(response).to have_http_status(:success)
        json_response = response.parsed_body
        expect(json_response['meta']['pagination']['limit']).to eq 2
      end

      it '1ページあたりの件数が100件を超える場合は100件で検索されること' do
        get '/v1/bid_companies/search', params: { per_page: 101 }

        expect(response).to have_http_status(:success)
        json_response = response.parsed_body
        expect(json_response['meta']['pagination']['limit']).to eq(100)
      end
    end
  end
end
