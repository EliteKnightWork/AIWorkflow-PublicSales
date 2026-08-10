module V1
  class CustomObjectItemSerializer < ActiveModel::Serializer
    attributes :id, :is_checked, :user_id, :free_text, :calendar, :url,
               :custom_object_template_item_value_id

    attribute :number_value do
      value = object.number_value
      next if value.nil?

      value.to_s('F')
    end

    attribute :title do
      template_item.title
    end

    attribute :description do
      template_item.description
    end

    attribute :input_type do
      template_item.input_type
    end

    attribute :custom_object_template_item_id do
      template_item.id
    end

    attribute :order do
      template_item.order
    end

    attribute :checkbox_title do
      object.custom_object_template_item_value.choice_content
    end

    attribute :radio_button_title do
      object.custom_object_template_item_value.choice_content
    end

    private

    def template_item
      object.custom_object_template_item_value.custom_object_template_item
    end
  end
end
