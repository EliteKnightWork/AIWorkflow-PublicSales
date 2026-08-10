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
class Subscription < ApplicationRecord
  belongs_to :company

  validates :starts_on, presence: true
  validate :valid_ends_on, if: -> { starts_on.present? && ends_on.present? }
  validate :active_subscription_per_company

  scope :active, -> {
    where('starts_on <= ? AND (ends_on IS NULL OR ends_on >= ?)', Date.current, Date.current)
  }

  private

  def valid_ends_on
    return if starts_on <= ends_on

    errors.add(:ends_on, :later_than_or_equal_to, date_name: I18n.t('activerecord.attributes.subscription.starts_on'))
  end

  def active_subscription_per_company
    return unless company.subscriptions.active.where.not(id: id).exists?

    errors.add(:base, :active_subscription_exists)
  end
end
