# == Schema Information
#
# Table name: custom_object_template_items
# Database name: primary
#
#  id                                        :bigint           not null, primary key
#  description(説明文)                       :text(65535)
#  input_type(入力タイプ)                    :integer
#  order(表示順)                             :integer          default(0), not null
#  title(項目タイトル)                       :string(255)      not null
#  created_at                                :datetime         not null
#  updated_at                                :datetime         not null
#  custom_object_template_id(テンプレートID) :bigint           not null
#
# Indexes
#
#  idx_on_custom_object_template_id_ad2c4e60e3  (custom_object_template_id)
#
# Foreign Keys
#
#  fk_rails_...  (custom_object_template_id => custom_object_templates.id)
#
require 'rails_helper'

RSpec.describe CustomObjectTemplateItem, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:custom_object_template) }
    it { is_expected.to have_many(:custom_object_template_item_values).dependent(:destroy) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:title) }
  end

  describe 'enums' do
    let(:custom_object_template_item) { build(:custom_object_template_item) }
    
    it 'defines input_type enum with correct values and prefix' do
      expect(custom_object_template_item).to define_enum_for(:input_type).with_values(
        checkbox: 0,
        radio: 1,
        person: 2,
        free_text: 3,
        calendar: 4,
        url: 5,
        free_text_multiline: 6,
        number: 7,
      ).with_prefix(true)
    end
  end
end
