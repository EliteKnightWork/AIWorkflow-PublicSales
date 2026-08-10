require 'rails_helper'

RSpec.describe 'V1::Settings::NotificationMethod', type: :request do
  let(:user) { create(:user) }

  before do
    login_as(user)
    user.notification_methods.destroy_all
    user.notification_timer_settings.destroy_all
  end

  describe 'GET /v1/settings/notification_method' do
    context '通知方法が設定されていない場合' do
      it 'noneが返ること' do
        get '/v1/settings/notification_method'
        assert_response_schema_confirm(200)
        expect(response.parsed_body['values']).to eq([])
      end
    end

    context 'メール通知が有効な場合' do
      before { create(:notification_method, :email, user: user, enabled: true, notification_type: 'new_project') }

      it 'emailが返ること' do
        get '/v1/settings/notification_method', params: { notification_type: 'new_project' }
        assert_response_schema_confirm(200)
        expect(response.parsed_body['values']).to eq(['email'])
      end
    end

    context 'Slack通知が有効な場合' do
      before do
        user.notification_methods.find_each { |method| method.update(enabled: false) }
        create(:notification_method, :slack, user: user, enabled: true, notification_type: 'new_project')
      end

      it 'slackが返ること' do
        get '/v1/settings/notification_method', params: { notification_type: 'new_project' }
        assert_response_schema_confirm(200)
        expect(response.parsed_body['values']).to eq(['slack'])
      end
    end

    context 'notification_typeが指定されていない場合' do
      it '400エラーが返ること' do
        get '/v1/settings/notification_method', params: { notification_type: '' }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('notification_type is required')
      end
    end

    context 'notification_typeが不正な値の場合' do
      it '400エラーが返ること' do
        get '/v1/settings/notification_method', params: { notification_type: 'invalid_type' }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('invalid notification_type')
      end
    end
    
    context 'notification_typeパラメータが指定された場合' do
      before do
        # 新着案件配信用（有効・無効の両方を作成）
        create(:notification_method, :email, user: user, enabled: true, notification_type: 'new_project')
        create(:notification_method, :slack, user: user, enabled: false, notification_type: 'new_project')
        
        # タスク通知用（有効・無効の両方を作成）
        create(:notification_method, :slack, user: user, enabled: true, notification_type: 'task')
        create(:notification_method, :email, user: user, enabled: false, notification_type: 'task')
      end

      it 'new_projectの有効な通知方法のみ返ること' do
        get '/v1/settings/notification_method', params: { notification_type: 'new_project' }
        assert_response_schema_confirm(200)
        expect(response.parsed_body['values']).to eq(['email'])
      end

      it 'taskの有効な通知方法のみ返ること' do
        get '/v1/settings/notification_method', params: { notification_type: 'task' }
        assert_response_schema_confirm(200)
        expect(response.parsed_body['values']).to eq(['slack'])
      end
      
      it '無効な通知方法は返らないこと' do
        # new_projectのslack通知とtaskのemail通知は無効なので返らない
        get '/v1/settings/notification_method', params: { notification_type: 'new_project' }
        expect(response.parsed_body['values']).not_to include('slack')
        
        get '/v1/settings/notification_method', params: { notification_type: 'task' }
        expect(response.parsed_body['values']).not_to include('email')
      end
    end
  end

  describe 'PUT /v1/settings/notification_method' do
    context '通知を無効にする場合' do
      before { create(:notification_method, :email, user: user, enabled: true, notification_type: 'new_project') }

      it '通知方法が無効になること' do
        put '/v1/settings/notification_method', params: { types: ['none'], notification_type: 'new_project' }
        expect(response.status).to eq(200)
        expect(user.reload.notification_methods.first.enabled).to be false
      end
    end

    context 'type noneの場合に対応するnotification_timer_settingが削除される' do
      before do
        # 通知方法を設定
        create(:notification_method, :email, user: user, enabled: true, notification_type: 'task')
        create(:notification_method, :slack, user: user, enabled: true, notification_type: 'new_project')
        
        # notification_timer_settingsを作成
        create(:notification_timer_setting, user: user, notification_type: 'task', hour: 9, days_before_due_date: 3)
        create(:notification_timer_setting, user: user, notification_type: 'new_project', hour: 10, days_before_due_date: 1)
      end

      it 'taskタイプの通知を無効にした場合、taskのnotification_timer_settingのみ削除されること' do
        expect {
          put '/v1/settings/notification_method', params: { types: ['none'], notification_type: 'task' }
        }.to change { user.notification_timer_settings.where(notification_type: 'task').count }.from(1).to(0)
          .and(not_change { user.notification_timer_settings.where(notification_type: 'new_project').count })

        expect(response.status).to eq(200)
        
        # taskの通知方法が無効化されていることを確認
        task_methods = user.notification_methods.where(notification_type: 'task')
        expect(task_methods.all? { |method| !method.enabled }).to be true
        
        # new_projectの通知方法は影響を受けていないことを確認
        new_project_methods = user.notification_methods.where(notification_type: 'new_project')
        expect(new_project_methods.any? { |method| method.enabled }).to be true
      end

      it 'new_projectタイプの通知を無効にした場合、new_projectのnotification_timer_settingのみ削除されること' do
        expect {
          put '/v1/settings/notification_method', params: { types: ['none'], notification_type: 'new_project' }
        }.to change { user.notification_timer_settings.where(notification_type: 'new_project').count }.from(1).to(0)
          .and(not_change { user.notification_timer_settings.where(notification_type: 'task').count })

        expect(response.status).to eq(200)
        
        # new_projectの通知方法が無効化されていることを確認
        new_project_methods = user.notification_methods.where(notification_type: 'new_project')
        expect(new_project_methods.all? { |method| !method.enabled }).to be true
        
        # taskの通知方法は影響を受けていないことを確認
        task_methods = user.notification_methods.where(notification_type: 'task')
        expect(task_methods.any? { |method| method.enabled }).to be true
      end

      it '複数のnotification_timer_settingがある場合、指定したnotification_typeのもののみ削除されること' do
        # new_projectは最大2件まで、追加で1件作成可能
        create(:notification_timer_setting, user: user, notification_type: 'new_project', hour: 18, days_before_due_date: 1)
        
        expect(user.notification_timer_settings.where(notification_type: 'task').count).to eq(1)
        expect(user.notification_timer_settings.where(notification_type: 'new_project').count).to eq(2)

        expect {
          put '/v1/settings/notification_method', params: { types: ['none'], notification_type: 'new_project' }
        }.to change { user.notification_timer_settings.where(notification_type: 'new_project').count }.from(2).to(0)
          .and(not_change { user.notification_timer_settings.where(notification_type: 'task').count })

        expect(response.status).to eq(200)
      end
    end

    context 'メール通知を設定する場合' do
      context '既存のメール通知が設定されていない場合' do
        it 'メール通知が設定されること' do
          put '/v1/settings/notification_method', params: { types: ['email'], email: 'test@example.com' }
          expect(response.status).to eq(200)
          expect(user.notification_methods.last.notifiable_type).to eq('EmailNotification')
          expect(user.notification_methods.last.notifiable.email).to eq('test@example.com')
        end
      end

      context '既存のメール通知設定がある場合' do
        before { create(:notification_method, :email, user: user, enabled: true, notification_type: 'new_project') }

        it '既存の設定が更新されること' do
          put '/v1/settings/notification_method', params: { types: ['email'], email: 'test@example.com', notification_type: 'new_project' }
          expect(response.status).to eq(200)
          expect(user.enabled_notification_methods.count).to eq(1)
          expect(user.enabled_notification_methods.find_by(notifiable_type: 'EmailNotification').notifiable.email).to eq('test@example.com')
        end
      end
    end

    context 'Slack通知を設定する場合' do
      it 'Slack通知が設定されること' do
        expect {
          put '/v1/settings/notification_method', params: { types: ['slack'], slack_webhook_url: 'https://hooks.slack.com/services/xxx/yyy/zzz', notification_type: 'new_project' }
        }.to change { user.notification_methods.count }.by(1)
        expect(response.status).to eq(200)
        expect(user.notification_methods.last.notifiable_type).to eq('SlackNotification')
        expect(user.notification_methods.last.notifiable.webhook_url).to eq('https://hooks.slack.com/services/xxx/yyy/zzz')
      end

      context '既存のSlack通知設定がある場合' do
        let(:existing_notification) { create(:notification_method, :slack, user: user, enabled: true, notification_type: 'new_project') }

        before do
          existing_notification.notifiable.update!(webhook_url: 'https://hooks.slack.com/services/old/url')
        end

        it '既存の設定が更新されること' do
          expect {
            put '/v1/settings/notification_method', params: { types: ['slack'], slack_webhook_url: 'https://hooks.slack.com/services/new/url', notification_type: 'new_project' }
          }.not_to(change { user.notification_methods.count })
          expect(response.status).to eq(200)
          expect(existing_notification.reload.notifiable.webhook_url).to eq('https://hooks.slack.com/services/new/url')
          expect(SlackNotification.count).to eq(1)
        end
      end

      context '既存のメール通知設定がある場合' do
        before { create(:notification_method, :email, user: user, enabled: true, notification_type: 'new_project') }

        it '既存の設定が更新されること' do
          put '/v1/settings/notification_method', params: { types: ['slack'], slack_webhook_url: 'https://hooks.slack.com/services/new/url', notification_type: 'new_project' }
          expect(response.status).to eq(200)
          expect(user.enabled_notification_methods.count).to eq(1)
          expect(user.enabled_notification_methods.find_by(notifiable_type: 'SlackNotification').notifiable.webhook_url).to eq('https://hooks.slack.com/services/new/url')
        end
      end
    end

    context '不正な通知タイプを指定した場合' do
      it '400エラーが返ること' do
        put '/v1/settings/notification_method', params: { types: ['invalid'] }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('無効な値です')
      end
    end

    context 'notification_typeが指定されていない場合' do
      it '400エラーが返ること' do
        put '/v1/settings/notification_method', params: { types: ['email'], email: 'test@example.com', notification_type: '' }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('notification_type is required')
      end
    end

    context 'notification_typeが不正な値の場合' do
      it '400エラーが返ること' do
        put '/v1/settings/notification_method', params: { types: ['email'], email: 'test@example.com', notification_type: 'invalid_type' }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('invalid notification_type')
      end
    end
    
    context 'notification_typeパラメータが指定された場合' do
      before do
        # 新着案件配信とタスク通知の両方でメール通知を有効化
        create(:notification_method, :email, user: user, enabled: true, notification_type: 'new_project')
        create(:notification_method, :email, user: user, enabled: true, notification_type: 'task')
      end

      it 'new_projectの通知設定がslackのみ有効になること' do
        put '/v1/settings/notification_method', params: { 
          types: ['slack'], 
          slack_webhook_url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
          notification_type: 'new_project'
        }
        expect(response.status).to eq(200)
        new_project_methods = user.notification_methods.where(notification_type: 'new_project', enabled: true)
        expect(new_project_methods.count).to eq(1)
        expect(new_project_methods.first.notifiable_type).to eq('SlackNotification')
      end

      it 'new_projectのemail通知は無効化されていること' do
        put '/v1/settings/notification_method', params: { 
          types: ['slack'], 
          slack_webhook_url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
          notification_type: 'new_project'
        }
        new_project_email_methods = user.notification_methods.where(notification_type: 'new_project', notifiable_type: 'EmailNotification')
        expect(new_project_email_methods.first.enabled).to be false
      end

      it 'taskの通知方法は変更されていないこと' do
        put '/v1/settings/notification_method', params: { 
          types: ['slack'], 
          slack_webhook_url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
          notification_type: 'new_project'
        }
        task_methods = user.notification_methods.where(notification_type: 'task', enabled: true)
        expect(task_methods.count).to eq(1)
        expect(task_methods.first.notifiable_type).to eq('EmailNotification')
      end
      
      it 'taskの通知設定がslackのみ有効になること' do
        put '/v1/settings/notification_method', params: { 
          types: ['slack'], 
          slack_webhook_url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
          notification_type: 'task'
        }
        expect(response.status).to eq(200)
        task_methods = user.notification_methods.where(notification_type: 'task', enabled: true)
        expect(task_methods.count).to eq(1)
        expect(task_methods.first.notifiable_type).to eq('SlackNotification')
      end

      it 'taskのemail通知は無効化されていること' do
        put '/v1/settings/notification_method', params: { 
          types: ['slack'], 
          slack_webhook_url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
          notification_type: 'task'
        }
        task_email_methods = user.notification_methods.where(notification_type: 'task', notifiable_type: 'EmailNotification')
        expect(task_email_methods.first.enabled).to be false
      end

      it 'new_projectの通知方法は変更されていないこと' do
        put '/v1/settings/notification_method', params: { 
          types: ['slack'], 
          slack_webhook_url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
          notification_type: 'task'
        }
        new_project_methods = user.notification_methods.where(notification_type: 'new_project', enabled: true)
        expect(new_project_methods.count).to eq(1)
        expect(new_project_methods.first.notifiable_type).to eq('EmailNotification')
      end

      it 'email・slack両方を同時に有効化できること' do
        put '/v1/settings/notification_method', params: { 
          types: ['email', 'slack'], 
          email: 'test@example.com',
          slack_webhook_url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
          notification_type: 'task'
        }
        expect(response.status).to eq(200)
        
        # taskの有効な通知方法を確認（emailとslackの両方が有効）
        task_methods = user.notification_methods.where(notification_type: 'task', enabled: true)
        expect(task_methods.count).to eq(2)
        expect(task_methods.pluck(:notifiable_type)).to contain_exactly('EmailNotification', 'SlackNotification')

        # new_projectの通知方法は変更されていないことを確認
        new_project_methods = user.notification_methods.where(notification_type: 'new_project', enabled: true)
        expect(new_project_methods.count).to eq(1)
        expect(new_project_methods.first.notifiable_type).to eq('EmailNotification')
      end
    end
  end
end
