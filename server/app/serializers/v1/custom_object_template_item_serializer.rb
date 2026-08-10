module V1
  class CustomObjectTemplateItemSerializer < ActiveModel::Serializer
    attributes :id, :title, :description, :input_type, :order

    attribute :customObjectTemplateItemValues do
      object.custom_object_template_item_values.map do |value|
        V1::CustomObjectTemplateItemValueSerializer.new(value).as_json
      end
    end
  end
end
