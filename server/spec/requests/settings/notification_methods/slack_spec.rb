require 'rails_helper'

RSpec.describe 'V1::Settings::NotificationMethods::SlackController', type: :request do
  let(:user) { create(:user) }

  before { login_as(user) }

  describe 'GET /v1/settings/notification_methods/slack' do
    context '通知設定が存在する場合' do
      before do
        create(:notification_method,
          user: user,
          notification_type: 'new_project',
          notifiable: create(:slack_notification, webhook_url: 'https://hooks.slack.com/services/xxx')
        )
      end

      it 'webhook URLを返すこと' do
        get '/v1/settings/notification_methods/slack', params: { notification_type: 'new_project' }
        assert_response_schema_confirm(200)
        expect(response.parsed_body['webhookUrl']).to eq('https://hooks.slack.com/services/xxx')
      end
    end

    context '通知設定が存在しない場合' do
      it 'webhookUrlが空で返ること' do
        get '/v1/settings/notification_methods/slack', params: { notification_type: 'new_project' }
        assert_response_schema_confirm(200)
        expect(response.parsed_body['webhookUrl']).to eq('')
      end
    end

    context 'notification_typeが指定されていない場合' do
      it '400エラーが返ること' do
        get '/v1/settings/notification_methods/slack', params: { notification_type: '' }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('notification_type is required')
      end
    end

    context 'notification_typeが不正な値の場合' do
      it '400エラーが返ること' do
        get '/v1/settings/notification_methods/slack', params: { notification_type: 'invalid_type' }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('invalid notification_type')
      end
    end
    
    context 'notification_typeパラメータが指定された場合' do
      let!(:new_project_method) { create(:notification_method, :slack, user: user, enabled: true, notification_type: 'new_project') }
      let!(:task_method) { create(:notification_method, :slack, user: user, enabled: true, notification_type: 'task') }
      
      before do
        # 新着案件配信用とタスク通知用のslack設定を作成
        new_project_method.notifiable.update!(webhook_url: 'https://hooks.slack.com/services/new_project')
        task_method.notifiable.update!(webhook_url: 'https://hooks.slack.com/services/task')
      end

      it 'new_projectのwebhook URLが取得できること' do
        get '/v1/settings/notification_methods/slack', params: { notification_type: 'new_project' }
        assert_response_schema_confirm(200)
        expect(response.parsed_body['webhookUrl']).to eq('https://hooks.slack.com/services/new_project')
      end

      it 'taskのwebhook URLが取得できること' do
        get '/v1/settings/notification_methods/slack', params: { notification_type: 'task' }
        assert_response_schema_confirm(200)
        expect(response.parsed_body['webhookUrl']).to eq('https://hooks.slack.com/services/task')
      end

      context 'notification_typeが無効化されている場合' do
        before { task_method.update!(enabled: false) }

        it 'webhookUrlが空で返ること' do
          get '/v1/settings/notification_methods/slack', params: { notification_type: 'task' }
          assert_response_schema_confirm(200)
          expect(response.parsed_body['webhookUrl']).to eq('')
        end
      end
    end
  end

  describe 'PUT /v1/settings/notification_methods/slack' do
    let(:webhook_url) { 'https://hooks.slack.com/services/new-webhook' }

    context '新規作成の場合' do
      it '通知設定を作成すること' do
        expect {
          put '/v1/settings/notification_methods/slack', params: { webhook_url: webhook_url, notification_type: 'new_project' }
        }.to change(NotificationMethod, :count).by(1)

        assert_response_schema_confirm(200)
        created_method = user.notification_methods.find_by(notifiable_type: 'SlackNotification', notification_type: 'new_project')
        expect(created_method.notifiable.webhook_url).to eq(webhook_url)
      end
    end

    context '更新の場合' do
      let!(:notification_method) do
        create(:notification_method,
          user: user,
          notification_type: 'new_project',
          notifiable: create(:slack_notification, webhook_url: 'https://hooks.slack.com/services/old')
        )
      end

      it '通知設定を更新すること' do
        expect {
          put '/v1/settings/notification_methods/slack', params: { webhook_url: webhook_url, notification_type: 'new_project' }
        }.not_to change(NotificationMethod, :count)

        assert_response_schema_confirm(200)
        expect(notification_method.reload.notifiable.webhook_url).to eq(webhook_url)
      end
    end

    context '保存に失敗する場合' do
      before do
        allow_any_instance_of(NotificationMethod).to receive(:save).and_return(false)
        allow_any_instance_of(NotificationMethod).to receive(:errors).and_return(
          instance_double(ActiveModel::Errors, full_messages: ['エラーが発生しました'])
        )
      end

      it 'エラーを返すこと' do
        put '/v1/settings/notification_methods/slack', params: { webhook_url: webhook_url }
        assert_response_schema_confirm(500)
        expect(response.parsed_body['errors']).to eq(['エラーが発生しました'])
      end
    end

    context 'notification_typeが指定されていない場合' do
      it '400エラーが返ること' do
        put '/v1/settings/notification_methods/slack', params: { webhook_url: 'https://hooks.slack.com/services/test', notification_type: '' }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('notification_type is required')
      end
    end

    context 'notification_typeが不正な値の場合' do
      it '400エラーが返ること' do
        put '/v1/settings/notification_methods/slack', params: { webhook_url: 'https://hooks.slack.com/services/test', notification_type: 'invalid_type' }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('invalid notification_type')
      end
    end
    
    context 'notification_typeパラメータが指定された場合' do
      let!(:initial_new_project_method) { create(:notification_method, :slack, user: user, enabled: true, notification_type: 'new_project') }
      
      before do
        # 新着案件配信用のslack設定を作成
        initial_new_project_method.notifiable.update!(webhook_url: 'https://hooks.slack.com/services/old_new_project')
      end

      it 'new_projectのwebhook URLのみ更新されること' do
        put '/v1/settings/notification_methods/slack', params: { 
          webhook_url: 'https://hooks.slack.com/services/updated_new_project',
          notification_type: 'new_project'
        }
        assert_response_schema_confirm(200)
        
        # new_projectの設定が更新されることを確認
        new_project_method = user.notification_methods.find_by(notification_type: 'new_project', notifiable_type: 'SlackNotification')
        expect(new_project_method.notifiable.webhook_url).to eq('https://hooks.slack.com/services/updated_new_project')
        expect(new_project_method.enabled).to be true
      end

      it 'taskの通知設定を新規作成できること' do
        put '/v1/settings/notification_methods/slack', params: { 
          webhook_url: 'https://hooks.slack.com/services/task',
          notification_type: 'task'
        }
        assert_response_schema_confirm(200)
        
        # taskの新しい設定が作成されることを確認
        task_method = user.notification_methods.find_by(notification_type: 'task', notifiable_type: 'SlackNotification')
        expect(task_method.notifiable.webhook_url).to eq('https://hooks.slack.com/services/task')
        expect(task_method.enabled).to be true
        
        # new_projectの設定は変更されていないことを確認
        new_project_method = user.notification_methods.find_by(notification_type: 'new_project', notifiable_type: 'SlackNotification')
        expect(new_project_method.notifiable.webhook_url).to eq('https://hooks.slack.com/services/old_new_project')
        expect(new_project_method.enabled).to be true
      end
      
      it '異なるnotification_typeの設定が独立して管理されること' do
        # taskの設定も作成
        task_method = create(:notification_method, :slack, user: user, enabled: true, notification_type: 'task')
        task_method.notifiable.update!(webhook_url: 'https://hooks.slack.com/services/task')
        
        # new_projectの設定のみ更新
        put '/v1/settings/notification_methods/slack', params: { 
          webhook_url: 'https://hooks.slack.com/services/updated_new_project',
          notification_type: 'new_project'
        }
        assert_response_schema_confirm(200)
        
        # new_projectの設定が更新されることを確認
        new_project_method = user.notification_methods.find_by(notification_type: 'new_project', notifiable_type: 'SlackNotification')
        expect(new_project_method.notifiable.webhook_url).to eq('https://hooks.slack.com/services/updated_new_project')
        
        # taskの設定は変更されていないことを確認
        task_method_reloaded = user.notification_methods.find_by(notification_type: 'task', notifiable_type: 'SlackNotification')
        expect(task_method_reloaded.notifiable.webhook_url).to eq('https://hooks.slack.com/services/task')
      end
    end
  end
end
