# == Schema Information
#
# Table name: users
# Database name: primary
#
#  id                               :bigint           not null, primary key
#  email(メールアドレス)            :string(255)
#  name(ユーザー名)                 :string(255)
#  created_at                       :datetime
#  updated_at                       :datetime
#  auth0_user_id(Auth0のユーザーID) :string(255)      not null
#  company_id(企業ID)               :bigint
#
# Indexes
#
#  index_users_on_auth0_user_id  (auth0_user_id) UNIQUE
#  index_users_on_company_id     (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require 'rails_helper'

RSpec.describe User, type: :model do
  describe '.search' do
    let!(:user_tanaka) { create(:user, name: '田中太郎', email: 'tanaka@example.com') }
    let!(:user_sato) { create(:user, name: '佐藤花子', email: 'sato@example.com') }
    let!(:user_yamada) { create(:user, name: '山田一郎', email: 'yamada@example.jp') }
    
    context '名前で検索する場合' do
      it '該当するユーザーが返される' do
        result = User.search(name: '田中')
        expect(result).to include(user_tanaka)
        expect(result).not_to include(user_sato, user_yamada)
      end
    end
    
    context 'メールアドレスで検索する場合' do
      it '該当するユーザーが返される' do
        result = User.search(email: 'example.com')
        expect(result).to include(user_tanaka, user_sato)
        expect(result).not_to include(user_yamada)
      end
    end
    
    context '名前とメールアドレスの両方で検索する場合' do
      it '両条件に一致するユーザーが返される' do
        result = User.search(name: '田中', email: 'example.com')
        expect(result).to include(user_tanaka)
        expect(result).not_to include(user_sato, user_yamada)
      end
    end
    
    context 'ページネーション' do
      before do
        # 30人のユーザーを作成するが、RuboCopの制限（10人）を超えないように分割
        3.times do
          create_list(:user, 10)
        end
      end
      
      it 'ページネーションが適用される' do
        result = User.search(page: 1, per_page: 10)
        expect(result.size).to eq(10)
      end
      
      it 'ページ番号とサイズが指定されていない場合はデフォルト値が使用される' do
        result = User.search({})
        expect(result.current_page).to eq(1)
        expect(result.limit_value).to eq(25)
      end
    end
  end

  describe 'validations' do
    subject { build(:user) }

    it { is_expected.to validate_presence_of(:auth0_user_id) }
    it { is_expected.to validate_uniqueness_of(:auth0_user_id).case_insensitive }

    describe '#company_id_write_once' do
      let(:primary_company) { create(:company) }
      let(:secondary_company) { create(:company) }

      context 'company_idが未設定のユーザーの場合' do
        let(:user) { create(:user, company: nil) }

        it 'company_idを設定できること' do
          user.company = primary_company
          expect(user).to be_valid
        end

      end

      context 'company_idが既に設定されているユーザーの場合' do
        let(:user) { create(:user, company: primary_company) }

        it '同じcompany_idに変更しようとしても有効であること' do
          user.company = primary_company
          expect(user).to be_valid
        end

        it '異なるcompany_idに変更しようとすると無効になること' do
          user.company = secondary_company
          expect(user).to be_invalid
          expect(user.errors[:company_id]).to include('一度設定すると変更・削除できません')
        end

        it 'company_idをnilに変更できること' do
          user.company = nil
          expect(user).to be_valid
        end
      end

      context 'company_idが変更されない場合' do
        let(:user) { create(:user, company: primary_company) }

        it '他の属性を変更しても有効であること' do
          user.name = '新しい名前'
          expect(user).to be_valid
        end
      end
    end
  end

  describe 'associations' do
    it { is_expected.to have_many(:favorites).dependent(:destroy) }
    it { is_expected.to have_many(:favorite_projects).through(:favorites).source(:project) }
    it { is_expected.to have_many(:search_filter_presets).dependent(:destroy) }
    it { is_expected.to have_many(:search_filter_preset_notifications).dependent(:destroy) }
    it { is_expected.to have_many(:notification_methods).dependent(:destroy) }
    it { is_expected.to have_many(:browsing_histories).dependent(:destroy) }
    it { is_expected.to have_many(:enabled_notification_methods).conditions(enabled: true).class_name('NotificationMethod').dependent(:destroy) }
    it { is_expected.to have_many(:proposal_jobs).dependent(:destroy) }
    it { is_expected.to have_many(:proposal_documents).dependent(:destroy) }
    it { is_expected.to belong_to(:company).optional }
  end

  describe 'notification methods' do
    context 'ユーザー作成時' do
      let(:user) { create(:user, email: 'test@example.com') }

      it 'メール通知設定が作成されること' do
        expect(user.notification_methods.count).to eq(2)
        expect(user.enabled_notification_methods.count).to eq(2)
      end

      it 'new_project の通知設定が作成されること' do
        # new_project通知設定の確認
        new_project_method = user.enabled_notification_methods.find_by(notifiable_type: 'EmailNotification', notification_type: 'new_project')
        expect(new_project_method).to be_present
        expect(new_project_method.notifiable).to be_a(EmailNotification)
        expect(new_project_method.notifiable.email).to eq('test@example.com')
      end

      it 'task の通知設定が作成されること' do
        # task通知設定の確認
        task_method = user.enabled_notification_methods.find_by(notifiable_type: 'EmailNotification', notification_type: 'task')
        expect(task_method).to be_present
        expect(task_method.notifiable).to be_a(EmailNotification)
        expect(task_method.notifiable.email).to eq('test@example.com')
      end
      
      it 'デフォルトの通知時間設定が作成されること' do
        expect(user.notification_timer_settings.count).to eq(2)
      end        

      it 'new_project の通知時間設定が作成されること' do
        new_project_setting = user.notification_timer_settings.find_by(notification_type: 'new_project')
        expect(new_project_setting).to be_present
        expect(new_project_setting.hour).to eq(9)
        expect(new_project_setting.days_before_due_date).to eq(3)
      end

      it 'task の通知時間設定が作成されること' do
        task_setting = user.notification_timer_settings.find_by(notification_type: 'task')
        expect(task_setting).to be_present
        expect(task_setting.hour).to eq(9)
        expect(task_setting.days_before_due_date).to eq(3)
      end
    end

    context 'メールアドレスが未設定の場合' do
      let(:user) { create(:user, email: nil) }

      it '通知設定が作成されないこと' do
        expect(user.notification_methods.count).to eq(0)
        expect(user.enabled_notification_methods).to be_empty
      end
      
      it 'デフォルトの通知時間設定が作成されること' do
        expect(user.notification_timer_settings.count).to eq(2)
      end

      it 'new_project の通知時間設定が作成されること' do
        new_project_setting = user.notification_timer_settings.find_by(notification_type: 'new_project')
        expect(new_project_setting).to be_present
        expect(new_project_setting.hour).to eq(9)
        expect(new_project_setting.days_before_due_date).to eq(3)
      end

      it 'task の通知時間設定が作成されること' do
        task_setting = user.notification_timer_settings.find_by(notification_type: 'task')
        expect(task_setting).to be_present
        expect(task_setting.hour).to eq(9)
        expect(task_setting.days_before_due_date).to eq(3)
      end
    end
  end

  describe '.from_token_payload' do
    let(:auth0_user_id) { 'auth0|123456789' }
    let(:payload) { { 'sub' => auth0_user_id } }

    context 'ユーザーが存在しない場合' do
      it '新しいユーザーを作成すること' do
        expect {
          User.from_token_payload(payload)
        }.to change(User, :count).by(1)
      end

      it '作成されたユーザーのauth0_user_idが正しいこと' do
        user = User.from_token_payload(payload)
        expect(user.auth0_user_id).to eq(auth0_user_id)
      end
    end

    context 'ユーザーが既に存在する場合' do
      before do
        create(:user, auth0_user_id: auth0_user_id)
      end

      it '新しいユーザーを作成しないこと' do
        expect {
          User.from_token_payload(payload)
        }.not_to change(User, :count)
      end

      it '既存のユーザーを返すこと' do
        user = User.from_token_payload(payload)
        expect(user.auth0_user_id).to eq(auth0_user_id)
      end
    end

    context '一意性制約違反が発生した場合' do
      it 'リトライすること' do
        allow(User).to receive(:find_or_create_by!).and_raise(ActiveRecord::RecordNotUnique).once
        allow(User).to receive(:find_or_create_by!).and_return(build(:user, auth0_user_id: auth0_user_id))
        
        expect { User.from_token_payload(payload) }.not_to raise_error
      end
    end
  end

  describe '#notify' do
    let(:user) { create(:user) }
    let(:message) { 'テストメッセージ' }

    context '有効な通知方法がある場合' do
      let!(:notification_method) { create(:notification_method, user: user, enabled: true) }

      it '通知メソッドのnotifyメソッドを呼び出すこと' do
        allow(user).to receive(:enabled_notification_methods).and_return([notification_method])
        allow(notification_method).to receive(:notify).with(message).and_return(true)
        
        user.notify(message)
        expect(notification_method).to have_received(:notify).with(message)
      end
    end
  end

  # describe '#auth0_email' do
  # end

  # describe '#notify_new_projects' do
  # end

  describe '#set_default_notification_timer_settings' do
    let(:user) { create(:user) }

    it 'デフォルトの通知タイマー設定が作成されること' do
      new_project_setting = user.notification_timer_settings.find_by(notification_type: 'new_project')
      expect(new_project_setting).to be_present
      expect(new_project_setting.notification_type).to eq('new_project')
      expect(new_project_setting.hour).to eq(9)
    end
  end

  describe '#set_default_task_notification_timer_settings' do
    let(:user) { create(:user) }

    it 'デフォルトのタスク通知タイマー設定が作成されること' do
      task_setting = user.notification_timer_settings.find_by(notification_type: 'task')
      expect(task_setting).to be_present
      expect(task_setting.notification_type).to eq('task')
      expect(task_setting.hour).to eq(9)
      expect(task_setting.days_before_due_date).to eq(3)
    end
  end

  describe '#set_notification_methods' do
    context 'メールアドレスが設定されている場合' do
      let!(:user) { create(:user, email: 'test@example.com') }

      it 'new_projectとtask両方の通知設定が作成されること' do
        expect(user.notification_methods.count).to eq(2)
      end

      it 'new_project の通知設定が作成されること' do
        new_project_method = user.notification_methods.find_by(notification_type: 'new_project')
        expect(new_project_method).to be_present
        expect(new_project_method.enabled).to be true
        expect(new_project_method.notifiable_type).to eq('EmailNotification')
        expect(new_project_method.notifiable.email).to eq('test@example.com')
      end

      it 'task の通知設定が作成されること' do
        task_method = user.notification_methods.find_by(notification_type: 'task')
        expect(task_method).to be_present
        expect(task_method.enabled).to be true
        expect(task_method.notifiable_type).to eq('EmailNotification')
        expect(task_method.notifiable.email).to eq('test@example.com')
      end
    end

    context 'メールアドレスが設定されていない場合' do
      let(:user) { build(:user, email: nil) }

      it '通知設定が作成されないこと' do
        user.save!
        
        expect(user.notification_methods.count).to eq(0)
      end
    end
  end
end
