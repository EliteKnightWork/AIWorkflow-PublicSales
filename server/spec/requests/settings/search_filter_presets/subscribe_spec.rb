require 'rails_helper'

RSpec.describe 'SearchFilterPresets::Subscribe' do
  let(:user) { create(:user) }

  before { login_as(user) }

  describe 'PUT /v1/settings/search_filter_presets/:id/subscribe' do
    it '配信開始できること' do
      search_filter_preset = create(:search_filter_preset, user: user, notification_required: false)

      put "/v1/settings/search_filter_presets/#{search_filter_preset.id}/subscribe"
      assert_response_schema_confirm(200)

      expect(user.search_filter_presets.count).to eq 1
      expect(user.search_filter_presets.where(notification_required: true).count).to eq 1
    end

    it '上限数に達している場合、配信開始できないこと' do
      search_filter_presets = create_list(:search_filter_preset, 10, user: user, notification_required: true)
      search_filter_presets.each do |search_filter_preset|
        create(:search_filter_preset_notification, user: user, search_filter_preset: search_filter_preset)
      end

      search_filter_preset = create(:search_filter_preset, user: user, notification_required: false)

      put "/v1/settings/search_filter_presets/#{search_filter_preset.id}/subscribe"
      assert_response_schema_confirm(500)
    end
  end
end
