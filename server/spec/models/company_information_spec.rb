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
require 'rails_helper'

RSpec.describe CompanyInformation, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:company) }
  end

  describe 'validations' do
    it { is_expected.to validate_length_of(:corporate_number).is_at_most(255).allow_blank }
    it { is_expected.to validate_length_of(:postal_code).is_at_most(255).allow_blank }
    it { is_expected.to validate_length_of(:address).is_at_most(255).allow_blank }
    it { is_expected.to validate_length_of(:director).is_at_most(255).allow_blank }
    it { is_expected.to validate_length_of(:tel_num).is_at_most(255).allow_blank }
    it { is_expected.to validate_length_of(:fax_num).is_at_most(255).allow_blank }
    it { is_expected.to validate_length_of(:industry_type).is_at_most(255).allow_blank }
    it { is_expected.to validate_length_of(:business_description).is_at_most(10_000).allow_blank }
    it { is_expected.to validate_numericality_of(:capital).only_integer.is_greater_than_or_equal_to(0).allow_nil }
    it { is_expected.to validate_numericality_of(:employees_num).only_integer.is_greater_than_or_equal_to(0).allow_nil }
    it { is_expected.to validate_numericality_of(:sales).only_integer.is_greater_than_or_equal_to(0).allow_nil }
  end

  describe 'validate#established_at_cannot_be_in_future' do
    context 'when established_at is in the future' do
      it 'is invalid' do
        info = build(:company_information, established_at: 1.day.from_now)
        expect(info).to be_invalid
        expect(info.errors[:established_at]).to include('は未来の日付を設定できません')
      end
    end
    
    context 'when established_at is in the past' do
      it 'is valid' do
        info = build(:company_information, established_at: 1.day.ago)
        expect(info).to be_valid
      end
    end
  end
end
