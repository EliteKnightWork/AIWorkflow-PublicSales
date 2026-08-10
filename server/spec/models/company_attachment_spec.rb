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
require 'rails_helper'

RSpec.describe CompanyAttachment, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to have_one_attached(:file) }
  end

  describe 'validations' do
    subject { build(:company_attachment) }

    it { is_expected.to validate_presence_of(:file) }
    it { is_expected.to validate_presence_of(:file_type) }
  end

  describe 'enums' do
    let(:company_attachment) { build(:company_attachment) }

    it do
      expect(company_attachment).to define_enum_for(:file_type)
      .with_values(
        certificate_of_registered_matters: 'certificate_of_registered_matters',
        financial_statements: 'financial_statements',
        tax_payment_certificate: 'tax_payment_certificate',
        list_of_executives: 'list_of_executives',
        permits_and_licenses: 'permits_and_licenses',
        others: 'others'
      )
      .backed_by_column_of_type(:string)
    end
  end
end
