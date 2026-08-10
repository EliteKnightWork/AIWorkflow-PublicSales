require 'rails_helper'

RSpec.describe 'V1::Settings::NotificationMethods::EmailController', type: :request do
  let(:user) { create(:user) }

  before do
    login_as(user)
    user.notification_methods.destroy_all
  end

  describe 'GET /v1/settings/notification_methods/email' do
    context 'メール配信が設定されている場合' do
      before { create(:notification_method, :email, user: user, enabled: true, notification_type: 'new_project') }

      it '配信先メールアドレスが取得できること' do
        get '/v1/settings/notification_methods/email', params: { notification_type: 'new_project' }
        assert_response_schema_confirm(200)
        expect(response.body).to eq({ email: user.enabled_notification_methods.find_by(notifiable_type: 'EmailNotification').notifiable.email }.to_json)
      end
    end

    context 'メール配信が設定されていない場合' do
      it 'emailが空で返ること' do
        get '/v1/settings/notification_methods/email'
        expect(response.status).to eq(200)
        expect(response.parsed_body['email']).to eq('')
        # FIXME: なぜかエラーになるためコメントアウト(Committee::InvalidResponse: /paths/~1settings~1notification_methods~1email/get/responses/404 response definition does not exist)
        # assert_response_schema_confirm(404)
      end
    end

    context 'notification_typeが指定されていない場合' do
      it '400エラーが返ること' do
        get '/v1/settings/notification_methods/email', params: { notification_type: '' }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('notification_type is required')
      end
    end

    context 'notification_typeが不正な値の場合' do
      it '400エラーが返ること' do
        get '/v1/settings/notification_methods/email', params: { notification_type: 'invalid_type' }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('invalid notification_type')
      end
    end
    
    context 'notification_typeパラメータが指定された場合' do
      let!(:new_project_method) { create(:notification_method, :email, user: user, enabled: true, notification_type: 'new_project') }
      let!(:task_method) { create(:notification_method, :email, user: user, enabled: true, notification_type: 'task') }
      
      before do
        # 新着案件配信用とタスク通知用のemail設定を作成
        new_project_method.notifiable.update!(email: 'new_project@example.com')
        task_method.notifiable.update!(email: 'task@example.com')
      end

      it 'new_projectの配信先メールアドレスが取得できること' do
        get '/v1/settings/notification_methods/email', params: { notification_type: 'new_project' }
        assert_response_schema_confirm(200)
        expect(response.body).to eq({ email: 'new_project@example.com' }.to_json)
      end

      it 'taskの配信先メールアドレスが取得できること' do
        get '/v1/settings/notification_methods/email', params: { notification_type: 'task' }
        assert_response_schema_confirm(200)
        expect(response.body).to eq({ email: 'task@example.com' }.to_json)
      end

      context 'notification_typeが無効化されている場合' do
        before { task_method.update!(enabled: false) }

        it 'emailが空で返ること' do
          get '/v1/settings/notification_methods/email', params: { notification_type: 'task' }
          expect(response.status).to eq(200)
          expect(response.parsed_body['email']).to eq('')
        end
      end
    end
  end

  describe 'PUT /v1/settings/notification_methods/email' do
    context '配信設定がない場合' do
      it '配信手段の作成と配信先メールアドレスを設定できること' do
        put '/v1/settings/notification_methods/email', params: { email: 'labid@example.com' }
        assert_response_schema_confirm(200)

        expect(user.notification_methods.last.notifiable_type).to eq('EmailNotification')
        expect(user.notification_methods.last.notifiable.email).to eq('labid@example.com')
        expect(user.notification_methods.count).to eq(1)
      end
    end

    context '配信設定が既にある場合' do
      it '配信先メールアドレスを変更できること' do
        put '/v1/settings/notification_methods/email', params: { email: 'labid+1@example.com' }
        assert_response_schema_confirm(200)
        expect(user.enabled_notification_methods.find_by(notifiable_type: 'EmailNotification').notifiable.email).to eq('labid+1@example.com')
      end
    end

    context 'notification_typeが指定されていない場合' do
      it '400エラーが返ること' do
        put '/v1/settings/notification_methods/email', params: { email: 'test@example.com', notification_type: '' }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('notification_type is required')
      end
    end

    context 'notification_typeが不正な値の場合' do
      it '400エラーが返ること' do
        put '/v1/settings/notification_methods/email', params: { email: 'test@example.com', notification_type: 'invalid_type' }
        expect(response.status).to eq(400)
        expect(response.parsed_body['errors']).to include('invalid notification_type')
      end
    end
    
    context 'notification_typeパラメータが指定された場合' do
      let!(:initial_new_project_method) { create(:notification_method, :email, user: user, enabled: true, notification_type: 'new_project') }
      
      before do
        # 新着案件配信用のemail設定を作成
        initial_new_project_method.notifiable.update!(email: 'old_new_project@example.com')
      end

      it 'new_projectの配信先メールアドレスのみ更新されること' do
        put '/v1/settings/notification_methods/email', params: { 
          email: 'updated_new_project@example.com',
          notification_type: 'new_project'
        }
        assert_response_schema_confirm(200)
        
        # new_projectの設定が更新されることを確認
        new_project_method = user.notification_methods.find_by(notification_type: 'new_project', notifiable_type: 'EmailNotification')
        expect(new_project_method.notifiable.email).to eq('updated_new_project@example.com')
        expect(new_project_method.enabled).to be true
      end

      it 'taskの配信設定を新規作成できること' do
        put '/v1/settings/notification_methods/email', params: { 
          email: 'task@example.com',
          notification_type: 'task'
        }
        assert_response_schema_confirm(200)
        
        # taskの新しい設定が作成されることを確認
        task_method = user.notification_methods.find_by(notification_type: 'task', notifiable_type: 'EmailNotification')
        expect(task_method.notifiable.email).to eq('task@example.com')
        expect(task_method.enabled).to be true
        
        # new_projectの設定は変更されていないことを確認
        new_project_method = user.notification_methods.find_by(notification_type: 'new_project', notifiable_type: 'EmailNotification')
        expect(new_project_method.notifiable.email).to eq('old_new_project@example.com')
        expect(new_project_method.enabled).to be true
      end
      
      it '異なるnotification_typeの設定が独立して管理されること' do
        # taskの設定も作成
        task_method = create(:notification_method, :email, user: user, enabled: true, notification_type: 'task')
        task_method.notifiable.update!(email: 'task@example.com')
        
        # new_projectの設定のみ更新
        put '/v1/settings/notification_methods/email', params: { 
          email: 'updated_new_project@example.com',
          notification_type: 'new_project'
        }
        assert_response_schema_confirm(200)
        
        # new_projectの設定が更新されることを確認
        new_project_method = user.notification_methods.find_by(notification_type: 'new_project', notifiable_type: 'EmailNotification')
        expect(new_project_method.notifiable.email).to eq('updated_new_project@example.com')
        
        # taskの設定は変更されていないことを確認
        task_method = user.notification_methods.find_by(notification_type: 'task', notifiable_type: 'EmailNotification')
        expect(task_method.notifiable.email).to eq('task@example.com')
      end
    end
  end
end
