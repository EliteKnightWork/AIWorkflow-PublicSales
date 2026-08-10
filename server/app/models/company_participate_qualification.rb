# == Schema Information
#
# Table name: company_participate_qualifications
# Database name: primary
#
#  id                                       :bigint           not null, primary key
#  organization_name(機関名)                :string(255)      not null
#  qualification_status(資格状態)           :string(255)      not null
#  qualification_type(資格種別)             :string(255)      not null
#  remarks(備考)                            :text(65535)
#  valid_from(認証有効開始日)               :date             not null
#  valid_until(認証有効終了日)              :date             not null
#  created_at                               :datetime         not null
#  updated_at                               :datetime         not null
#  company_id(企業ID)                       :bigint           not null
#  participate_qualification_id(参加資格ID) :bigint           not null
#
# Indexes
#
#  idx_on_participate_qualification_id_5815bbe543          (participate_qualification_id)
#  index_company_participate_qualifications_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (participate_qualification_id => participate_qualifications.id)
#
class CompanyParticipateQualification < ApplicationRecord
  belongs_to :company
  belongs_to :participate_qualification

  has_many :qualification_certificates, as: :attachable, dependent: :destroy
  has_many :company_participate_qualification_grades, dependent: :destroy
  has_many :participate_qualification_grades, through: :company_participate_qualification_grades

  validates :organization_name, presence: true
  validates :qualification_status, presence: true
  validates :qualification_type, presence: true
  validates :valid_from, presence: true
  validates :valid_until, presence: true

  enum :qualification_status, {
    pending: 'pending',
    active: 'active',
    inactive: 'inactive'
  }, suffix: true

  enum :qualification_type, {
    goods: 'goods',
    services: 'services',
    construction_consulting: 'construction_consulting',
    construction_work: 'construction_work'
  }, suffix: true
end
