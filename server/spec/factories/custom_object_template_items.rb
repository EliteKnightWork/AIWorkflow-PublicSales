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
FactoryBot.define do
  factory :custom_object_template_item do
    custom_object_template
    title { Faker::Lorem.sentence }
    description { Faker::Lorem.paragraph }
    input_type { [:checkbox, :radio, :person, :free_text, :calendar, :url, :free_text_multiline, :number].sample }
  end
end
