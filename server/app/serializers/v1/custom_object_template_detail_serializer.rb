module V1
  class CustomObjectTemplateDetailSerializer < ActiveModel::Serializer
    attributes :id, :title

    has_many :custom_object_template_items, key: :customObjectTemplateItems, serializer: V1::CustomObjectTemplateItemSerializer
  end
end

