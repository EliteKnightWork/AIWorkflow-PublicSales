# spec/services/search_filter_preset_notification_service_spec.rb
require 'rails_helper'

RSpec.describe SearchFilterPresetNotificationService do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:no_company_user) { create(:user, company: nil) }
  let(:service) { described_class.new(user) }
  let(:no_company_service) { described_class.new(no_company_user) }

  describe '#remaining_notification_count' do
    context '会社に所属している場合' do
      before do
        company.create_company_functional_limitation!(
          max_search_filter_preset_notification_count: 5
        )
      end

      it '残り通知数が正しく計算される' do
        create_list(:search_filter_preset_notification, 2, user: user)
        expect(service.remaining_notification_count).to eq(3)
      end

      it '通知が0件の場合、上限値が返される' do
        expect(service.remaining_notification_count).to eq(5)
      end

      it '上限まで通知がある場合、0が返される' do
        create_list(:search_filter_preset_notification, 5, user: user)
        expect(service.remaining_notification_count).to eq(0)
      end
    end

    context '会社に所属していない場合' do
      it 'デフォルトの上限値から残り通知数が計算される' do
        create_list(:search_filter_preset_notification, 1, user: no_company_user)
        expected = CompanyFunctionalLimitation::DEFAULT_MAX_SEARCH_FILTER_PRESET_NOTIFICATION_COUNT - 1
        expect(no_company_service.remaining_notification_count).to eq(expected)
      end
    end
  end

  
end