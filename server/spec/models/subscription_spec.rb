# == Schema Information
#
# Table name: subscriptions
# Database name: primary
#
#  id                    :bigint           not null, primary key
#  ends_on(契約終了日)   :date
#  starts_on(契約開始日) :date             not null
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  company_id(企業ID)    :bigint           not null
#
# Indexes
#
#  index_subscriptions_on_company_id                            (company_id)
#  index_subscriptions_on_company_id_and_starts_on_and_ends_on  (company_id,starts_on,ends_on)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require 'rails_helper'

RSpec.describe Subscription, type: :model do
  describe 'validations' do
    subject { build(:subscription) }

    it { is_expected.to validate_presence_of(:starts_on) }

    describe 'valid_ends_on' do
      context 'ends_onが存在する場合' do
        context 'starts_onがends_onよりも前の日付の場合' do
          it 'エラーになること' do
            subscription = build(:subscription, starts_on: Date.current, ends_on: Date.current - 1)
            subscription.valid?
            expect(subscription.errors).to be_of_kind(:ends_on, :later_than_or_equal_to)
          end
        end

        context 'starts_onがends_onと同じ日付の場合' do
          it 'エラーにならないこと' do
            subscription = build(:subscription, starts_on: Date.current, ends_on: Date.current)
            subscription.valid?
            expect(subscription.errors).to be_empty
          end
        end

        context 'starts_onがends_onよりも後の日付の場合' do
          it 'エラーにならないこと' do
            subscription = build(:subscription, starts_on: Date.current, ends_on: Date.current + 1)
            subscription.valid?
            expect(subscription.errors).to be_empty
          end
        end
      end
    end

    describe 'active_subscription_per_company' do
      context '同じ企業で有効な契約が存在する場合' do
        it 'エラーになること' do
          company = create(:company)
          create(:subscription, company: company)
          subscription = build(:subscription, company: company)
          subscription.valid?
          expect(subscription.errors).to be_of_kind(:base, :active_subscription_exists)
        end
      end

      context '同じ企業で有効な契約が存在しない場合' do
        it 'エラーにならないこと' do
          company = create(:company)
          create(:subscription, company: company, starts_on: Date.current - 2, ends_on: Date.current - 1)
          subscription = build(:subscription, company: company)
          subscription.valid?
          expect(subscription.errors).to be_empty
        end
      end
    end
  end

  describe 'scopes' do
    describe '.active' do
      it '契約開始日が今日以前、契約終了日が空もしくは今日以降の契約が取得できること' do
        subscription_1 = create(:subscription, starts_on: Date.current, ends_on: Date.current)
        subscription_2 = create(:subscription, starts_on: Date.current - 1, ends_on: Date.current + 1)
        _subscription_3 = create(:subscription, starts_on: Date.current - 1, ends_on: Date.current - 1)
        subscription_4 = create(:subscription, starts_on: Date.current - 1, ends_on: nil)
        expect(Subscription.active).to contain_exactly(subscription_1, subscription_2, subscription_4)
      end
    end
  end
end
