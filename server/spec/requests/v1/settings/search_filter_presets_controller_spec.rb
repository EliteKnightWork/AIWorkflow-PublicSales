require 'rails_helper'

RSpec.describe 'V1::Settings::SearchFilterPresetsController', type: :request do
  let(:user) { create(:user) }
  let(:valid_params) do
    {
      title: '検索条件1',
      project_type: 'project',
      subscribed: 'true',
      filter: {
        keywords: ["hogehgoe"]
      }
    }
  end

  before do
    login_as(user)
    user.notification_methods.destroy_all
    user.notification_timer_settings.destroy_all
  end

  describe 'POST /v1/settings/search_filter_presets' do
    context '通知設定に関するテスト' do
      context 'Slack通知が既に有効な場合' do
        let!(:slack_notification) do
          create(:notification_method, :slack,
            user: user,
            enabled: true,
            notifiable: create(:slack_notification, webhook_url: 'https://hooks.slack.com/services/xxx')
          )
        end

        it 'Slack通知設定が維持されること' do
          expect {
            post '/v1/settings/search_filter_presets', params: valid_params
          }.to change(SearchFilterPresetNotification, :count).by(1)
          .and(not_change { slack_notification.reload.enabled })

          expect(response).to have_http_status(:created)
          expect(user.notification_methods.find_by(notifiable_type: 'SlackNotification', enabled: true)).to be_present
          expect(user.notification_methods.find_by(notifiable_type: 'EmailNotification', enabled: true)).to be_nil
        end
      end

      context 'メール通知が既に有効な場合' do
        let!(:email_notification) do
          create(:notification_method, :email,
            user: user,
            enabled: true,
            notifiable: create(:email_notification, email: 'test@example.com')
          )
        end

        it 'メール通知設定が維持されること' do
          expect {
            post '/v1/settings/search_filter_presets', params: valid_params
          }.to change(SearchFilterPresetNotification, :count).by(1)
          .and(not_change { email_notification.reload.enabled })

          expect(response).to have_http_status(:created)
          expect(user.notification_methods.find_by(notifiable_type: 'EmailNotification', enabled: true)).to be_present
        end
      end

      context '通知設定が無効な場合' do
        before do
          create(:notification_method, :slack,
            user: user,
            enabled: false,
            notifiable: create(:slack_notification, webhook_url: 'https://hooks.slack.com/services/xxx')
          )
        end

        it 'メール通知が新規作成され有効化されること' do
          expect {
            post '/v1/settings/search_filter_presets', params: valid_params
          }.to change(SearchFilterPresetNotification, :count).by(1)

          expect(response).to have_http_status(:created)
          expect(user.notification_methods.find_by(notifiable_type: 'EmailNotification', enabled: true)).to be_present
        end
      end

      context '通知設定が全く存在しない場合' do
        it 'メール通知が新規作成され有効化されること' do
          expect {
            post '/v1/settings/search_filter_presets', params: valid_params
          }.to change(SearchFilterPresetNotification, :count).by(1)

          expect(response).to have_http_status(:created)
          
          expect(NotificationMethod.count).to eq(1)
          new_notification = user.notification_methods.find_by(notifiable_type: 'EmailNotification', enabled: true)
          expect(new_notification).to be_present
          expect(new_notification.notifiable.email).to eq(user.email)
        end
      end

      context 'subscribed: falseの場合' do
        let(:slack_notification) do
          create(:notification_method, :slack,
            user: user,
            enabled: true,
            notifiable: create(:slack_notification, webhook_url: 'https://hooks.slack.com/services/xxx')
          )
        end

        it '通知設定が変更されないこと' do
          params = valid_params.merge(subscribed: false)
          
          expect {
            post '/v1/settings/search_filter_presets', params: params
          }.to not_change(SearchFilterPresetNotification, :count)

          expect(response).to have_http_status(:created)
          expect(slack_notification.reload.enabled).to be(true)
          
        end
      end
    end

    context 'use_synonym_searchパラメータに関するテスト' do
      context 'use_synonym_searchがtrueの場合' do
        let(:params_with_synonym) do
          valid_params.deep_merge(
            filter: {
              keywords: ["hogehgoe"],
              use_synonym_search: true
            }
          )
        end

        it '類義語検索が有効なプリセットが作成されること' do
          expect {
            post '/v1/settings/search_filter_presets', params: params_with_synonym
          }.to change(SearchFilterPreset, :count).by(1)

          expect(response).to have_http_status(:created)
          preset = SearchFilterPreset.last
          expect(preset.use_synonym_search).to be(true)
        end
      end

      context 'use_synonym_searchがfalseの場合' do
        let(:params_without_synonym) do
          valid_params.deep_merge(
            filter: {
              keywords: ["hogehgoe"],
              use_synonym_search: false
            }
          )
        end

        it '類義語検索が無効なプリセットが作成されること' do
          expect {
            post '/v1/settings/search_filter_presets', params: params_without_synonym
          }.to change(SearchFilterPreset, :count).by(1)

          expect(response).to have_http_status(:created)
          preset = SearchFilterPreset.last
          expect(preset.use_synonym_search).to be(false)
        end
      end

      context 'use_synonym_searchが指定されていない場合' do
        it 'use_synonym_searchがnilのプリセットが作成されること' do
          expect {
            post '/v1/settings/search_filter_presets', params: valid_params
          }.to change(SearchFilterPreset, :count).by(1)

          expect(response).to have_http_status(:created)
          preset = SearchFilterPreset.last
          expect(preset.use_synonym_search).to be_nil
        end
      end
    end
  end

  describe 'GET /v1/settings/search_filter_presets' do
    let!(:preset_with_synonym) { create(:search_filter_preset, user: user, use_synonym_search: true) }
    let!(:preset_without_synonym) { create(:search_filter_preset, user: user, use_synonym_search: false) }
    let!(:preset_with_nil_synonym) { create(:search_filter_preset, user: user, use_synonym_search: nil) }

    it 'use_synonym_searchが正しく返されること' do
      get '/v1/settings/search_filter_presets'
      expect(response).to have_http_status(:ok)
      
      json_response = response.parsed_body
      presets = json_response['searchFilterPresets']
      
      synonym_preset = presets.find { |p| p['id'] == preset_with_synonym.id }
      no_synonym_preset = presets.find { |p| p['id'] == preset_without_synonym.id }
      nil_synonym_preset = presets.find { |p| p['id'] == preset_with_nil_synonym.id }
      
      expect(synonym_preset['filter']['useSynonymSearch']).to be(true)
      expect(no_synonym_preset['filter']['useSynonymSearch']).to be(false)
      expect(nil_synonym_preset['filter']['useSynonymSearch']).to be_nil
    end
  end

  describe 'GET /v1/settings/search_filter_presets/:id' do
    let!(:preset) { create(:search_filter_preset, user: user, use_synonym_search: true) }

    it 'use_synonym_searchが正しく返されること' do
      get "/v1/settings/search_filter_presets/#{preset.id}"
      expect(response).to have_http_status(:ok)
      
      json_response = response.parsed_body
      expect(json_response['searchFilterPreset']['filter']['useSynonymSearch']).to be(true)
    end
  end

  describe 'PUT /v1/settings/search_filter_presets/:id' do
    let!(:preset) { create(:search_filter_preset, user: user, use_synonym_search: false) }

    context 'use_synonym_searchを更新する場合' do
      let(:update_params) do
        {
          title: '更新されたタイトル',
          filter: {
            keywords: ["updated_keyword"],
            use_synonym_search: true
          }
        }
      end

      it 'use_synonym_searchが正しく更新されること' do
        put "/v1/settings/search_filter_presets/#{preset.id}", params: update_params
        expect(response).to have_http_status(:ok)
        
        preset.reload
        expect(preset.use_synonym_search).to be(true)
      end
    end
  end
end 