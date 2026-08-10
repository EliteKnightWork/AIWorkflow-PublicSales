# == Schema Information
#
# Table name: company_attachments
# Database name: primary
#
#  id                    :bigint           not null, primary key
#  file_type(資料の形式) :string(255)
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  company_id(会社ID)    :bigint           not null
#
# Indexes
#
#  index_company_attachments_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
class CompanyAttachment < ApplicationRecord
  include FileNameValidatable

  belongs_to :company

  has_one_attached :file

  enum :file_type, {
    certificate_of_registered_matters: 'certificate_of_registered_matters', # 登記事項証明書
    financial_statements: 'financial_statements',              # 決算書
    tax_payment_certificate: 'tax_payment_certificate',           # 納税証明書
    list_of_executives: 'list_of_executives',                # 役員名簿
    permits_and_licenses: 'permits_and_licenses',              # 許認可書類等
    others: 'others',                            # その他
  }

  validates :file_type, presence: true
  validates :file, presence: true
end
