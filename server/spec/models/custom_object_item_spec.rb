# == Schema Information
#
# Table name: custom_object_items
# Database name: primary
#
#  id                                                           :bigint           not null, primary key
#  calendar(カレンダー)                                         :datetime
#  free_text(フリーテキスト)                                    :text(65535)
#  is_checked(チェック入れたか)                                 :boolean
#  number_value(数値)                                           :decimal(20, 5)
#  url(url)                                                     :text(65535)
#  created_at                                                   :datetime         not null
#  updated_at                                                   :datetime         not null
#  custom_object_id(カスタムオブジェクトID)                     :bigint           not null
#  custom_object_template_item_value_id(テンプレートアイテムID) :bigint           not null
#  user_id(担当者)                                              :bigint
#
# Indexes
#
#  idx_on_custom_object_template_item_value_id_00b9d7c4d0  (custom_object_template_item_value_id)
#  index_custom_object_items_on_custom_object_id           (custom_object_id)
#  index_custom_object_items_on_user_id                    (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (custom_object_id => custom_objects.id)
#  fk_rails_...  (custom_object_template_item_value_id => custom_object_template_item_values.id)
#  fk_rails_...  (user_id => users.id)
#
require 'rails_helper'

RSpec.describe CustomObjectItem, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:custom_object_template_item_value) }
    it { is_expected.to belong_to(:custom_object) }
    it { is_expected.to belong_to(:user).optional }
  end

  describe 'validates: free_text' do
    it { is_expected.to validate_length_of(:free_text).is_at_most(CustomObjectItem::MAX_FREE_TEXT_LENGTH) }
  end

  describe 'validate: #number_value_precision_within_limit' do
    let(:custom_object_item) { build(:custom_object_item, number_value: nil) }

    context 'when number_value has up to 15 integer digits and 5 fractional digits' do
      it 'is valid' do
        custom_object_item.number_value = BigDecimal('123456789012345.12345')

        expect(custom_object_item).to be_valid
      end
    end

    context 'when integer digits exceed 15' do
      it 'is invalid' do
        custom_object_item.number_value = BigDecimal(1234567890123456)

        expect(custom_object_item).to be_invalid
        expect(custom_object_item.errors[:number_value]).to include('は整数部15桁以内、小数部5桁以内で入力してください')
      end
    end

    context 'when fractional digits exceed 5' do
      it 'is invalid' do
        # ActiveRecord rounds decimal attributes to the column scale, so stub to mimic raw input
        allow(custom_object_item).to receive(:number_value).and_return(BigDecimal('1.123456'))

        expect(custom_object_item).to be_invalid
        expect(custom_object_item.errors[:number_value]).to include('は整数部15桁以内、小数部5桁以内で入力してください')
      end
    end
  end
end
