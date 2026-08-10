# == Schema Information
#
# Table name: security_qualifications
# Database name: primary
#
#  id                                       :bigint           not null, primary key
#  code(情報セキュリティ資格コード)         :string(255)      not null
#  display_name(情報セキュリティ資格表示名) :string(255)      not null
#  created_at                               :datetime         not null
#  updated_at                               :datetime         not null
#
# Indexes
#
#  index_security_qualifications_on_code  (code) UNIQUE
#
class SecurityQualification < ApplicationRecord
  has_many :company_security_qualifications, dependent: :destroy

  validates :code, presence: true, uniqueness: { case_sensitive: false }
  validates :display_name, presence: true
end
