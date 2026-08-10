#  index_awarded_projects_on_organization_id  (organization_id)
#  index_awarded_projects_on_project_id       (project_id)
#  index_awarded_projects_on_url              (url)

#
# Foreign Keys
#
#  fk_rails_...  (organization_id => organizations.id)
#  fk_rails_...  (project_id => projects.id)
#
# == Schema Information
#
# Table name: awarded_projects
# Database name: primary
#
#  id                              :bigint           not null, primary key
#  is_unsuccessful(入札不調フラグ) :boolean          default(FALSE), not null
#  registration_date(登録日)       :date
#  source(落札情報の取得元)        :string(255)      not null
#  successful_bid_price(落札金額)  :bigint
#  url(掲載元URL)                  :text(65535)
#  created_at                      :datetime         not null
#  updated_at                      :datetime         not null
#  organization_id(発注機関ID)     :bigint
#  project_id(プロジェクトID)      :bigint
#
# Indexes
#
#  index_awarded_projects_on_organization_id  (organization_id)
#  index_awarded_projects_on_project_id       (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (organization_id => organizations.id)
#  fk_rails_...  (project_id => projects.id)
#
FactoryBot.define do
  factory :awarded_project do
    organization
    successful_bid_price {Faker::Number.number(digits: 7)}
    registration_date { Time.zone.today }
    is_unsuccessful { false }
    source { Faker::Lorem.word }
    url { Faker::Internet.url }

    trait :with_bidders do
      after(:create) do |awarded_project|
        create_list(:bidder, 2, awarded_project:)
      end
    end
  end
end
