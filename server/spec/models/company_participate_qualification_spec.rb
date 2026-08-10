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
require 'rails_helper'

RSpec.describe CompanyParticipateQualification, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:participate_qualification) }
    it { is_expected.to have_many(:qualification_certificates).dependent(:destroy) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:organization_name) }
    it { is_expected.to validate_presence_of(:qualification_status) }
    it { is_expected.to validate_presence_of(:qualification_type) }
    it { is_expected.to validate_presence_of(:valid_from) }
    it { is_expected.to validate_presence_of(:valid_until) }
  end

  describe 'enums' do
    it do
      expect(described_class.qualification_statuses).to eq({
        'pending' => 'pending',
        'active' => 'active',
        'inactive' => 'inactive'
      })
    end

    it do
      expect(described_class.qualification_types).to eq({
        'goods' => 'goods',
        'services' => 'services',
        'construction_consulting' => 'construction_consulting',
        'construction_work' => 'construction_work'
      })
    end
  end
end
