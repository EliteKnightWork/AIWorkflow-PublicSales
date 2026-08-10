# == Schema Information
#
# Table name: offices
# Database name: primary
#
#  id                 :bigint           not null, primary key
#  address(住所)      :string(255)      not null
#  name(事業所名)     :string(255)      not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  company_id(会社ID) :bigint           not null
#
# Indexes
#
#  index_offices_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require 'rails_helper'

RSpec.describe Office, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:company) }
  end

  describe 'validations' do
    subject { build(:office) }

    it { is_expected.to validate_length_of(:name).is_at_most(255) }
    it { is_expected.to validate_length_of(:address).is_at_most(255) }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:address) }
  end
end
