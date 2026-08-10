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
FactoryBot.define do
  factory :company_information do
    company
    corporate_number { Faker::Number.number(digits: 13).to_s }
    postal_code { Faker::Number.number(digits: 3).to_s + '-' + Faker::Number.number(digits: 4).to_s }
    address { Faker::Address.full_address }
    director { Faker::Name.name }
    tel_num { Faker::PhoneNumber.phone_number.to_s }
    fax_num { Faker::PhoneNumber.phone_number.to_s }
    capital { Faker::Number.between(from: 1_000_000, to: 100_000_000) }
    employees_num { Faker::Number.between(from: 1, to: 1000) }
    industry_type { Faker::Alphanumeric.alpha(number: 10) }
    business_description { Faker::Lorem.paragraph }
    sales { Faker::Number.between(from: 1_000_000, to: 100_000_000) }
    established_at { Faker::Date.between(from: 10.years.ago, to: Time.current) }
  end
end
