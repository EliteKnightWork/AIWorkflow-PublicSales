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
FactoryBot.define do
  factory :subscription do
    company
    starts_on { Date.current }
    ends_on { Date.current + 1 }
  end
end
