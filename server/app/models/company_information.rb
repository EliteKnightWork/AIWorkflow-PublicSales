# == Schema Information
#
# Table name: company_informations
# Database name: primary
#
#  id                             :bigint           not null, primary key
#  address(住所)                  :string(255)
#  business_description(事業内容) :text(65535)
#  capital(資本金)                :integer
#  corporate_number(法人番号)     :string(255)
#  director(代表者名)             :string(255)
#  employees_num(従業員数)        :integer
#  established_at(設立記念日)     :date
#  fax_num(FAX番号)               :string(255)
#  industry_type(業種)            :string(255)
#  postal_code(郵便番号)          :string(255)
#  sales(売上高)                  :bigint
#  tel_num(電話番号)              :string(255)
#  created_at                     :datetime         not null
#  updated_at                     :datetime         not null
#  company_id(会社ID)             :bigint           not null
#
# Indexes
#
#  index_company_informations_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
class CompanyInformation < ApplicationRecord
  belongs_to :company

  validates :corporate_number, :postal_code, :address, :director, :fax_num, :tel_num, :industry_type, length: { maximum: 255, allow_blank: true }
  validates :capital, :employees_num, :sales, numericality: { only_integer: true, greater_than_or_equal_to: 0, allow_blank: true }
  validates :business_description, length: { maximum: 10_000, allow_blank: true }

  validate :established_at_cannot_be_in_future

  private

  def established_at_cannot_be_in_future
    return if established_at.blank?

    errors.add(:established_at, 'は未来の日付を設定できません') if established_at > Time.current
  end
end
