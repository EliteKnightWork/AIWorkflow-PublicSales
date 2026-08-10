module V1
  module CustomObjects
    class CustomObjectItemsController < ApplicationController
      before_action :set_custom_object
      before_action :authorize_custom_object_company
      before_action :validate_custom_object_item_params
      before_action :validate_user_company

      def update
        updated_items = []

        ActiveRecord::Base.transaction do
          valid_template_value_ids = @custom_object
                                     .custom_object_template
                                     .custom_object_template_item_values
                                     .pluck(:id)

          custom_object_item_params[:custom_object_items].each do |raw_item_params|
            item_params = raw_item_params.to_h
            template_value_id = normalize_integer(item_params['custom_object_template_item_value_id'])

            if template_value_id.present?
              unless valid_template_value_ids.include?(template_value_id)
                invalid_record = CustomObjectItem.new
                invalid_record.errors.add(:custom_object_template_item_value_id, :invalid)
                raise ActiveRecord::RecordInvalid.new(invalid_record)
              end
            end

            if item_params['id'].present?
              item = @custom_object.custom_object_items.find(item_params['id'])
            else
              item = @custom_object.custom_object_items.build
            end

            item.update!(item_update_attributes(item_params, template_value_id))

            updated_items << item
          end
        end

        return render json: updated_items, each_serializer: V1::CustomObjectItemSerializer
      rescue ActiveRecord::RecordInvalid => e
        error_messages = e.record&.errors&.full_messages.presence || [e.message]
        return render json: { errors: error_messages }, status: :bad_request
      end

      private

      def set_custom_object
        @custom_object = CustomObject.find_by(id: params[:custom_object_id])
        return render json: { errors: ['not found'] }, status: :not_found unless @custom_object
      end

      def authorize_custom_object_company
        return unless @custom_object
        if @custom_object.bid_pipeline.company_id != current_user.company_id
          return render json: { errors: ['forbidden'] }, status: :forbidden
        end
      end

      def validate_custom_object_item_params
        if custom_object_item_params[:custom_object_items].blank? || !custom_object_item_params[:custom_object_items].is_a?(Array)
          return render json: { errors: ['invalid parameters'] }, status: :bad_request
        end
      end

      def validate_user_company
        return unless @custom_object

        user_ids = custom_object_item_params[:custom_object_items].filter_map do |item|
          user_id = item[:user_id] || item['user_id']
          next if user_id.blank?

          user_id.to_i
        end.uniq

        return if user_ids.blank?

        company_id = @custom_object.bid_pipeline.company_id
        valid_user_ids = User.where(id: user_ids, company_id: company_id).pluck(:id)
        return if (user_ids - valid_user_ids).empty?

        render json: { errors: ['invalid user'] }, status: :bad_request
      end

      def custom_object_item_params
        params.permit(custom_object_items: [:id, :custom_object_template_item_value_id, :is_checked, :user_id, :free_text, :calendar, :url, :number_value])
      end

      def item_update_attributes(item_params, template_value_id)
        attributes = { custom_object_template_item_value_id: template_value_id }

        optional_keys = {
          'is_checked' => :is_checked,
          'user_id' => :user_id,
          'free_text' => :free_text,
          'calendar' => :calendar,
          'url' => :url,
          'number_value' => :number_value
        }

        optional_keys.each do |param_key, attribute_key|
          next unless item_params.key?(param_key)

          value = item_params[param_key]
          value = normalize_integer(value) if attribute_key == :user_id
          value = normalize_decimal(value) if attribute_key == :number_value

          attributes[attribute_key] = value
        end

        attributes
      end

      def normalize_integer(value)
        return if value.blank?

        value.to_i
      end

      def normalize_decimal(value)
        return if value.blank?

        BigDecimal(value.to_s)
      end
    end
  end
end
