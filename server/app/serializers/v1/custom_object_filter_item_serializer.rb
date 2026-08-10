module V1
  class CustomObjectFilterItemSerializer < ActiveModel::Serializer
    attributes :id, :title, :description, :input_type, :custom_object_template

    def custom_object_template
      template = object.custom_object_template
      return unless template

      {
        id: template.id,
        title: template.title
      }
    end

    attribute :choices do
      object.custom_object_template_item_values.map do |value|
        {
          id: value.id,
          content: value.choice_content
        }
      end
    end
  end
end
