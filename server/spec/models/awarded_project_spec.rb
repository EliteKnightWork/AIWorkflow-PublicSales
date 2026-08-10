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
require 'rails_helper'

RSpec.describe AwardedProject, type: :model do
  describe 'validations' do
    describe 'registration_date_not_in_future' do
      context '登録日が未来の日付の場合' do
        let(:awarded_project) { build(:awarded_project, registration_date: Time.zone.today + 1.day) }

        it '無効であること' do
          expect(awarded_project).not_to be_valid
          expect(awarded_project.errors[:registration_date]).to include("cannot be in the future")
        end
      end

      context '登録日が現在の日付の場合' do
        let(:awarded_project) { build(:awarded_project, registration_date: Time.zone.today) }

        it '有効であること' do
          expect(awarded_project).to be_valid
        end
      end
    end
  end
end
