require 'rails_helper'

RSpec.describe 'SearchFilterPresets::Unrecommended' do
  let(:user) { create(:user) }

  before { login_as(user) }

  describe 'PUT /v1/settings/search_filter_presets/:id/unrecommended' do
    it 'おすすめ条件解除できること' do
      search_filter_preset = create(:search_filter_preset, user: user, recommended: true)

      put "/v1/settings/search_filter_presets/#{search_filter_preset.id}/unrecommended"
      assert_response_schema_confirm(200)

      expect(user.search_filter_presets.count).to eq 1
      expect(user.search_filter_presets.where(recommended: false).count).to eq 1
    end
  end
end
