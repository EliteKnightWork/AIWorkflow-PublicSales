require 'rails_helper'

RSpec.describe 'V1::GuestFeatureUsagesController', type: :request do
  let(:user) { create(:user) }
  let(:ip) { '203.0.113.10' }

  describe 'POST /v1/guest_feature_usages/reset' do
    before do
      allow_any_instance_of(ActionDispatch::Request).to receive(:remote_ip).and_return(ip)
    end

    context 'ログイン済みの場合' do
      before { login_as(user) }

      it '該当IPのレコードがあればcountを0にリセットする' do
        usage = GuestFeatureUsage.create!(identifier: ip, count: 3, period_started_at: Time.current)

        expect {
          post '/v1/guest_feature_usages/reset'
        }.to not_change(GuestFeatureUsage, :count).
          and change { usage.reload.count }.from(3).to(0)

        assert_response_schema_confirm(204)
      end

      it '該当IPのレコードが無くても204を返す' do
        expect {
          post '/v1/guest_feature_usages/reset'
        }.to not_change(GuestFeatureUsage, :count)

        assert_response_schema_confirm(204)
      end
    end

    context '未ログインの場合' do
      it '401を返す' do
        post '/v1/guest_feature_usages/reset'
        assert_response_schema_confirm(401)
      end
    end
  end
end
