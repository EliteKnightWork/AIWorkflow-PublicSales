module V1
  class CustomObjectTemplateItemValueSerializer < ActiveModel::Serializer
    attributes :id

    attribute :choiceContent do
      object.choice_content
    end
  end
end

