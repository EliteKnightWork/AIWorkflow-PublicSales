require 'rails_helper'

RSpec.describe 'SearchFilterPresets::Unsubscribe' do
  let(:user) { create(:user) }

  before { login_as(user) }

  describe 'PUT /v1/settings/search_filter_presets/:id/unsubscribe' do
    it '配信停止できること' do
      search_filter_preset = create(:search_filter_preset, user: user)
      create(:search_filter_preset_notification, user: user, search_filter_preset: search_filter_preset)

      put "/v1/settings/search_filter_presets/#{search_filter_preset.id}/unsubscribe"
      assert_response_schema_confirm(200)

      expect(user.search_filter_presets.count).to eq 1
      expect(user.search_filter_preset_notifications.count).to eq 0
    end
  end
end
