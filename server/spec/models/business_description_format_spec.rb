# == Schema Information
#
# Table name: business_description_formats
# Database name: primary
#
#  id                                :bigint           not null, primary key
#  description(事業情報テキスト)     :text(4294967295) not null
#  embedding(事業情報の埋め込み情報) :json
#  created_at                        :datetime         not null
#  updated_at                        :datetime         not null
#  company_id(企業ID)                :bigint           not null
#
# Indexes
#
#  index_business_description_formats_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require 'rails_helper'

RSpec.describe BusinessDescriptionFormat, type: :model do
  describe 'validations' do
    subject { build(:business_description_format) }

    it { is_expected.to validate_presence_of(:description) }

    describe '#check_limitation' do
      context '事業情報が登録上限数を超えている場合' do
        it 'エラーになる' do
          company = create(:company)
          create_list(:business_description_format, 5, company: company)
          business_description = build(:business_description_format, company: company)
          business_description.valid?
          expect(business_description.errors).to be_of_kind(:base, :check_limitation)
        end
      end

      context '事業情報が登録上限数を超えていない場合' do
        it 'エラーにならない' do
          company = create(:company)
          create_list(:business_description_format, 4, company: company)
          business_description = build(:business_description_format, company: company)
          business_description.valid?
          expect(business_description.errors).to be_empty
        end
      end
    end
  end
end
