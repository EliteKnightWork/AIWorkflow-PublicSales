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
FactoryBot.define do
  factory :guest_feature_usage do
    identifier { Faker::Internet.ip_v4_address }
    count { 0 }
    period_started_at { Time.current }

    trait :with_count do
      count { 3 }
    end

    trait :at_limit do
      count { 5 }
    end

    trait :over_limit do
      count { 10 }
    end

    trait :expired do
      period_started_at { 2.months.ago }
    end

    trait :recent do
      period_started_at { 2.weeks.ago }
    end
  end
end
