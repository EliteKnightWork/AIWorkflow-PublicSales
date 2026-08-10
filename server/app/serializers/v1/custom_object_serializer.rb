module V1
  class CustomObjectSerializer < ActiveModel::Serializer
    attributes :id

    attribute :title do
      object.custom_object_template.title
    end

    attribute :custom_object_items do
      ActiveModelSerializers::SerializableResource.new(
        object.custom_object_items,
        each_serializer: V1::CustomObjectItemSerializer,
        **instance_options
      ).as_json
    end
  end
end
