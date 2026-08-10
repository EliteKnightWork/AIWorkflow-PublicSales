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
class CustomObjectItem < ApplicationRecord
  MAX_INTEGER_DIGITS = 15
  MAX_FRACTION_DIGITS = 5
  MAX_FREE_TEXT_LENGTH = 1000

  belongs_to :custom_object_template_item_value
  belongs_to :custom_object
  belongs_to :user, optional: true

  validates :free_text, length: { maximum: MAX_FREE_TEXT_LENGTH }

  validate :number_value_precision_within_limit

  private

  def number_value_precision_within_limit
    return if number_value.nil?

    number_value_str = number_value.abs.to_s('F')
    integer_str, fraction_str = number_value_str.split('.', 2)

    if (integer_str&.length&. > MAX_INTEGER_DIGITS) || (fraction_str&.length&. > MAX_FRACTION_DIGITS)
      errors.add(:number_value, "は整数部#{MAX_INTEGER_DIGITS}桁以内、小数部#{MAX_FRACTION_DIGITS}桁以内で入力してください")
    end
  end
end
