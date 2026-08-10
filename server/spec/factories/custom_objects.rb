# == Schema Information
#
# Table name: custom_objects
# Database name: primary
#
#  id                                        :bigint           not null, primary key
#  created_at                                :datetime         not null
#  updated_at                                :datetime         not null
#  bid_pipeline_id(パイプラインID)           :bigint           not null
#  custom_object_template_id(テンプレートID) :bigint           not null
#
# Indexes
#
#  index_custom_objects_on_bid_pipeline_id            (bid_pipeline_id)
#  index_custom_objects_on_custom_object_template_id  (custom_object_template_id)
#
# Foreign Keys
#
#  fk_rails_...  (bid_pipeline_id => bid_pipelines.id)
#  fk_rails_...  (custom_object_template_id => custom_object_templates.id)
#
FactoryBot.define do
  factory :custom_object do
    custom_object_template
    bid_pipeline
  end
end
