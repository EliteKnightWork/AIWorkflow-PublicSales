require 'rails_helper'

#rubocop:disable RSpec/MultipleExpectations
RSpec.describe 'V1::Companies::Me::FunctionalLimitation', type: :request do
  let(:company) { create(:company) }

  describe 'GET /v1/companies/me/functional_limitation' do
    context '企業に所属していない場合' do
      let(:user) { create(:user, company: nil) }

      before { login_as(user) }

      it '403エラーを返却する' do
        get "/v1/companies/me/functional_limitation"
        assert_response_schema_confirm(403)
      end
    end

    context '企業に所属している場合' do
      let(:user) { create(:user, company: company) }

      before { login_as(user) }

      it '機能制限が登録されていない場合はデフォルトの機能制限を返却できる' do
        get "/v1/companies/me/functional_limitation"

        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['maxSearchFilterPresetNotificationCount']).to eq(10)
        expect(json['maxRecommendationCount']).to eq(5)
        expect(json['maxBusinessDescriptionFormatCount']).to eq(5)
        expect(json['searchFilterPresetNotificationCount']).to eq(0)
        expect(json['recommendationCount']).to eq(0)
        expect(json['businessDescriptionFormatCount']).to eq(0)
      end

      context '機能制限が登録されている場合は登録された値が返却される' do
        it 'returns the registered functional limitation' do
          create(:company_functional_limitation, company: user.company, max_search_filter_preset_notification_count: 20, max_recommendation_count: 10, max_business_description_format_count: 8)

          get "/v1/companies/me/functional_limitation"

          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['maxSearchFilterPresetNotificationCount']).to eq(20)
          expect(json['maxRecommendationCount']).to eq(10)
          expect(json['maxBusinessDescriptionFormatCount']).to eq(8)
          expect(json['searchFilterPresetNotificationCount']).to eq(0)
          expect(json['recommendationCount']).to eq(0)
          expect(json['businessDescriptionFormatCount']).to eq(0)
        end
      end

      context '検索条件と事業情報がすでに登録されている時' do
        it 'returns the number of registered search filter presets and business descriptions' do
          create(:company_functional_limitation, company: user.company, max_search_filter_preset_notification_count: 20, max_recommendation_count: 10, max_business_description_format_count: 8)

          preset = create(:search_filter_preset, user: user, recommended: true)
          create(:search_filter_preset_notification, user: user, search_filter_preset: preset)
          create(:business_description_format, company: user.company)

          get "/v1/companies/me/functional_limitation"

          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['maxSearchFilterPresetNotificationCount']).to eq(20)
          expect(json['maxRecommendationCount']).to eq(10)
          expect(json['maxBusinessDescriptionFormatCount']).to eq(8)
          expect(json['searchFilterPresetNotificationCount']).to eq(1)
          expect(json['recommendationCount']).to eq(1)
          expect(json['businessDescriptionFormatCount']).to eq(1)
        end
      end
    end
  end
end
#rubocop:enable RSpec/MultipleExpectations
