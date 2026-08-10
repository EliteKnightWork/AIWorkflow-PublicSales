require 'rails_helper'

RSpec.describe 'Suggestions' do
  describe 'GET /v1/suggestions' do
    before { login_as(create(:user)) }

    context 'キーワードが指定されている場合' do
      it '地域、組織、入札企業の候補が返ること' do
        create(:organization, name: '東京都庁')
        create(:bid_company, name: '東京建設株式会社')

        get '/v1/suggestions', params: { keyword: '東京' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body

          expect(json['suggestions']['prefectures']).to include({ 'value' => '東京都' })
          expect(json['suggestions']['organizations']).to include({ 'value' => '東京都庁' })
          expect(json['suggestions']['bidCompanies']).to include({ 'value' => '東京建設株式会社' })
        end
      end

      it '指定した種類のサジェストのみが返ること' do
        create(:organization, name: '東京都庁')
        create(:bid_company, name: '東京建設株式会社')

        get '/v1/suggestions', params: { keyword: '東京', types: 'prefectures,organizations' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body

          expect(json['suggestions']['prefectures']).to include({ 'value' => '東京都' })
          expect(json['suggestions']['organizations']).to include({ 'value' => '東京都庁' })
          expect(json['suggestions']['bidCompanies']).to eq([])
          expect(json['suggestions']['procedureTypeGroups']).to eq([])
        end
      end

      it '無効な種類は無視されること' do
        get '/v1/suggestions', params: { keyword: '東京', types: 'prefectures,invalid_type' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body

          expect(json['suggestions']['prefectures']).to include({ 'value' => '東京都' })
          expect(json['suggestions']['organizations']).to eq([])
          expect(json['suggestions']['bidCompanies']).to eq([])
          expect(json['suggestions']['procedureTypeGroups']).to eq([])
        end
      end
    end

    context 'キーワードが空の場合' do
      it '空の候補リストが返ること' do
        get '/v1/suggestions', params: { keyword: '' }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body

          expect(json['suggestions']['prefectures']).to be_empty
          expect(json['suggestions']['organizations']).to be_empty
          expect(json['suggestions']['bidCompanies']).to be_empty
        end
      end
    end
  end
end
