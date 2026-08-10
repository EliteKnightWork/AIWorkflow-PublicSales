require 'rails_helper'

RSpec.describe 'V1::Settings::NotificationTimerSetting', type: :request do
  let(:user) { create(:user) }

  before do
    login_as(user)
    user.notification_timer_settings.destroy_all
  end

  describe 'GET /v1/settings/notification_timer_setting' do
    context 'notification_type: new_project' do
      before do
        create(:notification_timer_setting, user: user, notification_type: 'new_project', hour: 9, days_before_due_date: 0)
        create(:notification_timer_setting, user: user, notification_type: 'new_project', hour: 18, days_before_due_date: 0)
      end

      it '新着案件配信の通知時間設定が返されること' do
        get '/v1/settings/notification_timer_setting', params: { notification_type: 'new_project' }
        expect(response.status).to eq(200)
        expect(response.parsed_body['hours']).to contain_exactly(9, 18)
      end
    end

    context 'notification_type: task' do
      before do
        create(:notification_timer_setting, user: user, notification_type: 'task', hour: 10, days_before_due_date: 1)
      end

      it 'タスク通知の設定が返されること' do
        get '/v1/settings/notification_timer_setting', params: { notification_type: 'task' }
        expect(response.status).to eq(200)
        expect(response.parsed_body['settings']).to be_present
        expect(response.parsed_body['settings'].first['hour']).to eq(10)
        expect(response.parsed_body['settings'].first['days_before_due_date']).to eq(1)
      end
    end

    context '設定が存在しない場合' do
      before { user.notification_timer_settings.destroy_all }

      it '空の配列が返されること' do
        get '/v1/settings/notification_timer_setting', params: { notification_type: 'new_project' }
        expect(response.status).to eq(200)
        expect(response.parsed_body['hours']).to eq([])
      end
    end
  end

  describe 'PUT /v1/settings/notification_timer_setting' do
    context 'notification_type: new_project' do
      it '新着案件配信の通知時間設定を更新できること' do
        put '/v1/settings/notification_timer_setting', params: {
          notification_type: 'new_project',
          hours: [8, 12]
        }
        expect(response.status).to eq(200)
        
        settings = user.notification_timer_settings.where(notification_type: 'new_project')
        expect(settings.count).to eq(2)
        expect(settings.pluck(:hour)).to contain_exactly(8, 12)
        expect(settings.pluck(:days_before_due_date).uniq).to eq([0])
      end
    end

    context 'notification_type: task' do
      it 'タスク通知の設定を更新できること' do
        put '/v1/settings/notification_timer_setting', params: {
          notification_type: 'task',
          settings: [
            { hour: 9, days_before_due_date: 1 }
          ]
        }
        expect(response.status).to eq(200)
        
        settings = user.notification_timer_settings.where(notification_type: 'task')
        expect(settings.count).to eq(1)
        expect(settings.pluck(:hour)).to contain_exactly(9)
        expect(settings.pluck(:days_before_due_date)).to contain_exactly(1)
      end
    end

    context '既存の設定がある場合' do
      before do
        create(:notification_timer_setting, user: user, notification_type: 'new_project', hour: 10, days_before_due_date: 0)
        create(:notification_timer_setting, user: user, notification_type: 'task', hour: 14, days_before_due_date: 0)
      end

      it '指定されたnotification_typeの設定のみが更新されること' do
        put '/v1/settings/notification_timer_setting', params: {
          notification_type: 'new_project',
          hours: [8, 16]
        }
        expect(response.status).to eq(200)
        
        # new_projectの設定が更新される
        new_project_settings = user.notification_timer_settings.where(notification_type: 'new_project')
        expect(new_project_settings.count).to eq(2)
        expect(new_project_settings.pluck(:hour)).to contain_exactly(8, 16)
        
        # taskの設定は変更されない
        task_settings = user.notification_timer_settings.where(notification_type: 'task')
        expect(task_settings.count).to eq(1)
        expect(task_settings.first.hour).to eq(14)
      end
    end

    context '上限を超える設定を送信した場合' do
      it 'エラーが返されること' do
        hours = (0..(User::MAX_SETTINGS_NEW_PROJECT)).to_a
        
        put '/v1/settings/notification_timer_setting', params: {
          notification_type: 'new_project',
          hours: hours
        }
        expect(response.status).to eq(400)
      end
    end
  end
end