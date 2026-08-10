# == Schema Information
#
# Table name: custom_object_templates
# Database name: primary
#
#  id                          :bigint           not null, primary key
#  title(テンプレートタイトル) :string(255)      not null
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#  company_id(カンパニーID)    :bigint           not null
#
# Indexes
#
#  index_custom_object_templates_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
FactoryBot.define do
  factory :custom_object_template do
    company
    title { Faker::Lorem.sentence }
  end
end
