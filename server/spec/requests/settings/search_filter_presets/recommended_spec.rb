require 'rails_helper'

RSpec.describe 'SearchFilterPresets::Recommended' do
  let(:user) { create(:user) }

  before { login_as(user) }

  describe 'PUT /v1/settings/search_filter_presets/:id/recommended' do
    it 'おすすめ条件登録できること' do
      search_filter_preset = create(:search_filter_preset, user: user, business_description: 'hoge', recommended: false)

      put "/v1/settings/search_filter_presets/#{search_filter_preset.id}/recommended"
      assert_response_schema_confirm(200)

      expect(user.search_filter_presets.count).to eq 1
      expect(user.search_filter_presets.where(recommended: true).count).to eq 1
    end

    it '事業情報が登録されていない場合はおすすめ条件に登録できないこと' do
      search_filter_preset = create(:search_filter_preset, user: user, business_description: nil, recommended: false)

      put "/v1/settings/search_filter_presets/#{search_filter_preset.id}/recommended"
      assert_response_schema_confirm(400)
    end
  end
end
