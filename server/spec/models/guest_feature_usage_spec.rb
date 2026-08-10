# == Schema Information
#
# Table name: guest_feature_usages
# Database name: primary
#
#  id                                                :bigint           not null, primary key
#  count(利用回数)                                   :integer          default(0), not null
#  identifier(ゲストユーザー識別子)                  :string(255)      not null
#  period_started_at(期間開始日時（最初の利用日時）) :datetime         not null
#  created_at                                        :datetime         not null
#  updated_at                                        :datetime         not null
#
# Indexes
#
#  index_guest_feature_usages_on_identifier         (identifier) UNIQUE
#  index_guest_feature_usages_on_period_started_at  (period_started_at)
#
require 'rails_helper'

RSpec.describe GuestFeatureUsage, type: :model do
  let(:usage) { create(:guest_feature_usage, count: 5) }

  describe 'バリデーション' do
    subject { build(:guest_feature_usage) }

    it { is_expected.to validate_presence_of(:identifier) }
    it { is_expected.to validate_presence_of(:period_started_at) }
    it { is_expected.to validate_numericality_of(:count).is_greater_than_or_equal_to(0) }
    it { is_expected.to validate_uniqueness_of(:identifier).case_insensitive }
  end

  describe '.find_or_create_for' do
    context '既存のレコードが存在する場合' do
      let!(:existing_usage) do
        create(:guest_feature_usage, identifier: '192.168.1.1', count: 5)
      end

      it '既存のレコードを返すこと' do
        result = described_class.find_or_create_for(identifier: '192.168.1.1')
        expect(result).to eq(existing_usage)
        expect(result.count).to eq(5)
      end
    end

    context '新規レコードの場合' do
      it '新しいレコードを作成すること' do
        expect {
          described_class.find_or_create_for(identifier: '192.168.1.1')
        }.to change(described_class, :count).by(1)
      end

      it '適切な初期値が設定されること' do
        result = described_class.find_or_create_for(identifier: '192.168.1.1')
        expect(result).to have_attributes(
          identifier: '192.168.1.1',
          count: 0,
          period_started_at: be_within(1.second).of(Time.current)
        )
      end
    end
  end


  describe '#period_expired?' do
    context '期間が満了している場合' do
      before { usage.update!(period_started_at: 2.months.ago) }

      it 'trueを返すこと' do
        expect(usage.period_expired?).to be true
      end
    end

    context '期間が満了していない場合' do
      before { usage.update!(period_started_at: 2.weeks.ago) }

      it 'falseを返すこと' do
        expect(usage.period_expired?).to be false
      end
    end
  end

  describe '#reset_period!' do
    it '期間とカウントをリセットすること' do
      expect {
        usage.reset_period!
      }.to change(usage, :period_started_at).
        and change(usage, :count).to(0)
    end
  end

  describe '#limit_reached?' do
    context '上限に達している場合' do
      before { usage.update!(count: 5) }

      it 'trueを返すこと' do
        expect(usage.limit_reached?).to be true
      end
    end

    context '上限に達していない場合' do
      before { usage.update!(count: 3) }

      it 'falseを返すこと' do
        expect(usage.limit_reached?).to be false
      end
    end
  end
end
