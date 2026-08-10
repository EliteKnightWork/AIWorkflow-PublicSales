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
class CustomObjectTemplateItem < ApplicationRecord
  belongs_to :custom_object_template
  has_many :custom_object_template_item_values, dependent: :destroy

  validates :title, presence: true
  validates :order, numericality: { only_integer: true }

  default_scope { order(:order, :id) }

  enum :input_type, {
    checkbox: 0,
    radio: 1,
    person: 2,
    free_text: 3,
    calendar: 4,
    url: 5,
    free_text_multiline: 6,
    number: 7,
  }, prefix: true, validate: true
end
