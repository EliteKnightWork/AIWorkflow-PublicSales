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
FactoryBot.define do
  factory :custom_object_item do
    custom_object_template_item_value
    custom_object
    user
    is_checked { Faker::Boolean.boolean }
    free_text { Faker::Lorem.sentence }
    calendar { Faker::Time.between(from: DateTime.now - 1, to: DateTime.now) }
    url { Faker::Internet.url }
    number_value { Faker::Number.decimal(l_digits: 4, r_digits: 2) }
  end
end
