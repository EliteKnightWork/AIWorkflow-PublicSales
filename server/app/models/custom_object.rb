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
class CustomObject < ApplicationRecord
  belongs_to :custom_object_template
  belongs_to :bid_pipeline
  has_many :custom_object_items, dependent: :destroy

  after_create :create_items_from_template_values

  private

  def create_items_from_template_values
    template = custom_object_template
    template.custom_object_template_items.find_each do |item|
      values = item.custom_object_template_item_values.to_a
      if values.empty? && %w[checkbox radio].exclude?(item.input_type)
        values = [item.custom_object_template_item_values.create!]
      end
      values.each do |value|
        CustomObjectItem.create!(custom_object: self, custom_object_template_item_value: value)
      end
    end
  end
end
