# == Schema Information
#
# Table name: company_security_qualifications
# Database name: primary
#
#  id                                                :bigint           not null, primary key
#  valid_from(認証有効開始日)                        :date             not null
#  valid_until(認証有効終了日)                       :date             not null
#  created_at                                        :datetime         not null
#  updated_at                                        :datetime         not null
#  company_id(企業ID)                                :bigint           not null
#  security_qualification_id(情報セキュリティ資格ID) :bigint           not null
#
# Indexes
#
#  idx_on_company_id_security_qualification_id_f390c70296  (company_id,security_qualification_id) UNIQUE
#  idx_on_security_qualification_id_1bc5d46d1c             (security_qualification_id)
#  index_company_security_qualifications_on_company_id     (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (security_qualification_id => security_qualifications.id)
#
class CompanySecurityQualification < ApplicationRecord
  belongs_to :company
  belongs_to :security_qualification

  validates :valid_from, presence: true
  validates :valid_until, presence: true
  validates :company_id, uniqueness: { scope: :security_qualification_id }
end
