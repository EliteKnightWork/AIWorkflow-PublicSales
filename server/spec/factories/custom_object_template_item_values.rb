# == Schema Information
#
# Table name: custom_object_template_item_values
# Database name: primary
#
#  id                                                     :bigint           not null, primary key
#  choice_content(チェックボックスの項目名)               :string(255)
#  created_at                                             :datetime         not null
#  updated_at                                             :datetime         not null
#  custom_object_template_item_id(テンプレートアイテムID) :bigint           not null
#
# Indexes
#
#  idx_on_custom_object_template_item_id_5bbccc179c  (custom_object_template_item_id)
#
# Foreign Keys
#
#  fk_rails_...  (custom_object_template_item_id => custom_object_template_items.id)
#
FactoryBot.define do
  factory :custom_object_template_item_value do
    custom_object_template_item
    choice_content { Faker::Lorem.word }
  end
end
