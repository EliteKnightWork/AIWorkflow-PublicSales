# == Schema Information
#
# Table name: notification_methods
# Database name: primary
#
#  id                                  :bigint           not null, primary key
#  enabled(配信可否)                   :boolean          default(FALSE), not null
#  notifiable_type(配信手段のモデル名) :string(255)      not null
#  notification_type(通知の対象タイプ) :string(255)
#  created_at                          :datetime
#  updated_at                          :datetime
#  notifiable_id(配信手段のモデルID)   :bigint           not null
#  user_id(ユーザーID)                 :bigint           not null
#
# Indexes
#
#  idx_on_notification_type_notifiable_type_notifiable_60a23274dd  (notification_type,notifiable_type,notifiable_id)
#  index_notification_methods_on_user_id                           (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
require 'rails_helper'

RSpec.describe NotificationMethod do
  describe 'associations' do
    it { is_expected.to belong_to(:user) }
  end

  describe 'callbacks' do
    describe 'before_validation' do
      describe '#disable_other_notification_methods' do
        context '同じnotification_typeの場合' do
          it '同じnotifiable_typeで同じnotification_typeの配信手段は1つだけ有効になること' do
            user = create(:user)
            # 新着案件配信用のメール通知を3つ作成
            email1 = create(:email_notification, email: 'test1@example.com')
            email2 = create(:email_notification, email: 'test2@example.com')
            email3 = create(:email_notification, email: 'test3@example.com')
            
            method1 = create(:notification_method, user: user, notifiable: email1, notification_type: 'new_project', enabled: true)
            method2 = create(:notification_method, user: user, notifiable: email2, notification_type: 'new_project', enabled: true)
            method3 = create(:notification_method, user: user, notifiable: email3, notification_type: 'new_project', enabled: true)
            
            # 最後に有効にしたものだけがenabledになる
            expect(method1.reload.enabled).to be false
            expect(method2.reload.enabled).to be false
            expect(method3.reload.enabled).to be true
          end
        end
        
        context '異なるnotification_typeの場合' do
          it '異なるnotification_typeの配信手段は影響を受けないこと' do
            user = create(:user)
            
            # 新着案件配信用のメール通知
            email1 = create(:email_notification, email: 'new_project@example.com')
            new_project_method = create(:notification_method, user: user, notifiable: email1, notification_type: 'new_project', enabled: true)
            
            # タスク通知用のメール通知
            email2 = create(:email_notification, email: 'task@example.com')
            task_method = create(:notification_method, user: user, notifiable: email2, notification_type: 'task', enabled: true)
            
            # 両方ともenabledのまま
            expect(new_project_method.reload.enabled).to be true
            expect(task_method.reload.enabled).to be true
          end
        end
        
        context '異なるnotifiable_typeの場合' do
          it '異なるnotifiable_typeの配信手段は影響を受けないこと' do
            user = create(:user)
            
            # メール通知
            email = create(:email_notification, email: 'test@example.com')
            email_method = create(:notification_method, user: user, notifiable: email, notification_type: 'new_project', enabled: true)
            
            # Slack通知
            slack = create(:slack_notification, webhook_url: 'https://hooks.slack.com/services/TEST/TEST/test')
            slack_method = create(:notification_method, user: user, notifiable: slack, notification_type: 'new_project', enabled: true)
            
            # 両方ともenabledのまま
            expect(email_method.reload.enabled).to be true
            expect(slack_method.reload.enabled).to be true
          end
        end
      end
    end
  end
end
