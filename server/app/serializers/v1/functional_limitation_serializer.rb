module V1
  class FunctionalLimitationSerializer < ActiveModel::Serializer
    attributes :id, :max_search_filter_preset_notification_count, :max_recommendation_count, :max_business_description_format_count

    attribute :search_filter_preset_notification_count do
      current_user.search_filter_preset_notifications.count
    end

    attribute :recommendation_count do
      owner = current_user.company || current_user
      owner.search_filter_presets.where(recommended: true).count
    end

    attribute :business_description_format_count do
      current_user.company.business_description_formats.count
    end
  end
end
