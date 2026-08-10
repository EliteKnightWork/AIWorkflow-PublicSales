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
class GuestFeatureUsage < ApplicationRecord
  COUNT_LIMIT = 5
  PERIOD_DAYS = 30.days

  validates :identifier, presence: true
  validates :count, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :period_started_at, presence: true
  validates :identifier, uniqueness: true

  def self.find_or_create_for(identifier:)
    find_or_create_by(identifier: identifier) do |usage|
      usage.period_started_at = Time.current
      usage.count = 0
    end
  end

  def period_expired?
    period_started_at < PERIOD_DAYS.ago
  end

  def reset_period!
    update!(period_started_at: Time.current, count: 0)
  end

  def limit_reached?
    count >= COUNT_LIMIT
  end
end
