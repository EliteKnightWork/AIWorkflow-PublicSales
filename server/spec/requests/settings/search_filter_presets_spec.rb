require 'rails_helper'

RSpec.describe 'SearchPresets' do
  let(:user) { create(:user) }

  before { login_as(user) }

  describe 'GET /v1/settings/search_filter_presets' do
    let(:company) { create(:company) }

    it 'success' do
      create(:search_filter_preset, user: user)
      get '/v1/settings/search_filter_presets'
      assert_response_schema_confirm(200)
    end
  end

  describe 'POST /v1/settings/search_filter_presets' do
    it 'success' do
      post '/v1/settings/search_filter_presets', params: {
        projectType: 'Project',
        filter: {
          keywords: ['keyword'],
          notKeywords: ['not_keyword'],
          prefectures: [1],
          organizations: ['株式会社Nehan'],
          procedureTypes: ['一般競争入札'],
          period: '1week',
          publicationDateFrom: '2024-01-01',
          publicationDateTo: '2024-01-31',
          plannedPriceFrom: 100000,
          plannedPriceTo: 1000000,
          isExperienceRequired: true,
          isOfficeRequired: true,
          securityQualifications: ['ISMS'],
        },
        businessDescription: 'hoge'
      }
      assert_response_schema_confirm(201)
      expect(response.parsed_body['id']).to eq(SearchFilterPreset.last.id)
    end

    it 'success with deadline days remaining' do
      post '/v1/settings/search_filter_presets', params: {
        projectType: 'Project',
        filter: {
          keywords: ['keyword'],
          deadlineDaysRemaining: 7
        }
      }
      expect(response).to have_http_status(201)
      
      preset = SearchFilterPreset.last
      expect(preset.deadline_days_remaining).to eq(7)
      expect(response.parsed_body['id']).to eq(preset.id)
    end

    it 'success with recommended' do
      post '/v1/settings/search_filter_presets', params: {
        projectType: 'Project',
        filter: {
          keywords: ['keyword'],
          notKeywords: ['not_keyword'],
          prefectures: [1],
          organizations: ['株式会社Nehan'],
          procedureTypes: ['一般競争入札'],
          period: '1week',
          publicationDateFrom: '2024-01-01',
          publicationDateTo: '2024-01-31',
          plannedPriceFrom: 100000,
          plannedPriceTo: 1000000,
          isExperienceRequired: true,
          isOfficeRequired: true,
          securityQualifications: ['ISMS'],
        },
        businessDescription: 'hoge',
        recommended: true
      }
      assert_response_schema_confirm(201)
      expect(response.parsed_body['id']).to eq(SearchFilterPreset.last.id)
    end
  end

  describe 'PATCH /v1/settings/search_filter_presets/:id' do
    it 'success with deadline days remaining' do
      preset = create(:search_filter_preset, user: user, deadline_days_remaining: nil)
      
      patch "/v1/settings/search_filter_presets/#{preset.id}", params: {
        projectType: 'Project',
        filter: {
          keywords: ['updated keyword'],
          deadlineDaysRemaining: 14
        }
      }
      
      assert_response_schema_confirm(200)
      
      preset.reload
      expect(preset.deadline_days_remaining).to eq(14)
      expect(preset.keywords).to eq(['updated keyword'])
    end
  end

  describe 'DELETE /v1/settings/search_filter_presets/:id' do
    it 'success' do
      preset = create(:search_filter_preset, user: user)
      delete "/v1/settings/search_filter_presets/#{preset.id}"
      expect(SearchFilterPreset.count).to eq(0)
      assert_response_schema_confirm(200)
    end
  end
end
