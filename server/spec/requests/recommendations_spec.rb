require 'rails_helper'

RSpec.describe 'Recommendations' do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  before { login_as(user) }

  describe 'GET /v1/recommendations' do
    context 'パラメータが有効な場合' do
      it '200が返ること' do
        preset = create(:search_filter_preset, user: user, keywords: ['keyword1', 'keyword2'], business_description: 'business_description')

        get '/v1/recommendations', params: {
          search_filter_preset_id: preset.id,
          status: 'open',
          size: 10,
        }

        assert_response_schema_confirm(200)
      end
    end

    context 'お気に入り案件を使用する設定の場合' do
      it '200が返ること' do
        preset = create(:search_filter_preset, user: user, keywords: ['keyword1', 'keyword2'], business_description: 'business_description')
        project = create(:project)
        create(:business_description_favorite_project, search_filter_preset: preset, project: project)

        get '/v1/recommendations', params: { search_filter_preset_id: preset.id }

        assert_response_schema_confirm(200)
      end
    end

    context 'パラメータが不正な場合' do
      it '400が返ること' do
        get '/v1/recommendations'

        assert_response_schema_confirm(400)
      end

      it 'keywordsが設定されていない場合' do
        preset = create(:search_filter_preset, user: user, keywords: [], or_keywords: [], business_description: 'business_description')

        get '/v1/recommendations', params: { search_filter_preset_id: preset.id }

        assert_response_schema_confirm(400)
      end

      it 'business_descriptionが設定されていない場合' do
        preset = create(:search_filter_preset, user: user, keywords: ['keyword1', 'keyword2'], business_description: '')

        get '/v1/recommendations', params: { search_filter_preset_id: preset.id }

        assert_response_schema_confirm(400)
      end
    end
  end
end
