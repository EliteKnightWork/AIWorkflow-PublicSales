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
class AwardedProject < ApplicationRecord
  include ProjectAndAwardedProjectCommon

  has_many :external_documents, as: :attachable, dependent: :destroy
  has_many :screenshots, as: :attachable, dependent: :destroy
  has_many :source_files, as: :attachable, dependent: :destroy
  has_many :bidders, dependent: :destroy
  has_many :browsing_histories, as: :browsable, dependent: :destroy

  belongs_to :organization, optional: true
  # NOTE: Projectに紐づけたときにProjectのElasticsearchインデックスが更新されるようtouch: trueを設定
  belongs_to :project, optional: true, touch: true

  validates :source, presence: true
  validate :registration_date_not_in_future

  def registration_date_not_in_future
    if registration_date.present? && registration_date > Time.zone.today
      errors.add(:registration_date, "cannot be in the future")
    end
  end
end
