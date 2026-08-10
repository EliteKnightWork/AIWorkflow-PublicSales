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
require 'rails_helper'

RSpec.describe SecurityQualification, type: :model do
  describe 'validations' do
    subject { build(:security_qualification) }

    it { is_expected.to validate_presence_of(:code) }
    it { is_expected.to validate_uniqueness_of(:code).case_insensitive }
    it { is_expected.to validate_presence_of(:display_name) }
  end

  describe 'associations' do
    it { is_expected.to have_many(:company_security_qualifications).dependent(:destroy) }
  end
end
