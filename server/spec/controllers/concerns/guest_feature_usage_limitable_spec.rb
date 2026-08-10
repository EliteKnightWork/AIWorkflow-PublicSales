require 'rails_helper'

RSpec.describe GuestFeatureUsageLimitable, type: :controller do
  # テスト用のコントローラークラスを作成
  controller(ApplicationController) do
    include GuestFeatureUsageLimitable

    skip_before_action :require_login

    limit_guest_usage redirects: { index: '/limit_exceeded/search_projects' }


    def index
      render json: { success: true }
    end

  end

  let(:ip_address) { '192.168.1.100' }

  before do
    allow_any_instance_of(ActionDispatch::Request).to receive(:remote_ip).and_return(ip_address)
  end

  describe 'before_action' do
    context 'ログインしていない場合' do
      it 'check_guest_usage_limitが実行されること' do
        allow(controller).to receive(:check_guest_usage_limit)
        get :index
        expect(controller).to have_received(:check_guest_usage_limit)
      end
    end

    context 'ログインしている場合' do
      before { login_as(create(:user)) }

      it 'check_guest_usage_limitが実行されること（早期return）' do
        allow(controller).to receive(:check_guest_usage_limit).and_call_original
        get :index
        expect(controller).to have_received(:check_guest_usage_limit)
      end
    end
  end

  describe '#check_guest_usage_limit' do
    context '初回リクエストの場合' do
      it '利用回数レコードが作成されること' do
        expect {
          get :index
        }.to change(GuestFeatureUsage, :count).by(1)

        usage = GuestFeatureUsage.find_by(identifier: ip_address)
        expect(usage).to have_attributes(
          identifier: ip_address,
          count: 1,
          period_started_at: be_within(1.second).of(Time.current)
        )
      end

      it '正常にレスポンスが返されること' do
        get :index
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body).to eq({ 'success' => true })
      end
    end

    context '2回目以降のリクエストの場合' do
      let!(:usage) do
        create(:guest_feature_usage, identifier: ip_address, count: 3)
      end

      it '利用回数が増加すること' do
        expect {
          get :index
        }.to change { usage.reload.count }.by(1)
      end

      it '正常にレスポンスが返されること' do
        get :index
        expect(response).to have_http_status(:ok)
      end
    end

    context '利用回数制限に達している場合' do
      let!(:usage) do
        create(:guest_feature_usage, identifier: ip_address, count: 5)
      end

      it '303が返されること' do
        get :index
        expect(response).to have_http_status(:see_other)
      end

      it '利用回数は増加しないこと' do
        expect {
          get :index
        }.not_to(change { usage.reload.count })
      end
    end

    context 'リセット期間が経過している場合' do
      let!(:usage) do
        create(:guest_feature_usage, identifier: ip_address, count: 5, period_started_at: 2.months.ago)
      end

      it '利用回数がリセットされること' do
        expect {
          get :index
        }.to change { usage.reload.count }.from(5).to(1)
        expect(usage.period_started_at).to be_within(1.second).of(Time.current)
      end

      it '正常にレスポンスが返されること' do
        get :index
        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe '#extract_identifier' do
    it 'IPアドレスを返すこと' do
      expect(controller.send(:extract_identifier)).to eq(ip_address)
    end

    context 'IPアドレスが取得できない場合' do
      before do
        allow_any_instance_of(ActionDispatch::Request).to receive(:remote_ip).and_return(nil)
      end

      it 'nilを返すこと' do
        expect(controller.send(:extract_identifier)).to be_nil
      end

      it '利用回数制限が適用されないこと' do
        expect {
          get :index
        }.not_to change(GuestFeatureUsage, :count)

        expect(response).to have_http_status(:ok)
      end
    end
  end
end
