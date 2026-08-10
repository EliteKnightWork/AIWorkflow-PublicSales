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
require 'rails_helper'

RSpec.describe CompanySecurityQualification, type: :model do
  describe 'validations' do
    subject { build(:company_security_qualification) }

    it { is_expected.to validate_presence_of(:valid_from) }
    it { is_expected.to validate_presence_of(:valid_until) }
    it { is_expected.to validate_uniqueness_of(:company_id).scoped_to(:security_qualification_id) }
  end

  describe 'associations' do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:security_qualification) }
  end
end
