module V1
  class CustomObjectTemplatesController < ApplicationController
    CHOICE_INPUT_TYPES = %w[checkbox radio].freeze

    before_action :set_custom_object_template, only: [:show, :update, :destroy]
    before_action :check_template_authorization, only: [:show, :update, :destroy]

    def index
      templates = current_user.company.custom_object_templates
      render(
        json: templates,
        each_serializer: V1::CustomObjectTemplateListSerializer
      )
    end

    def show
      render(
        json: @custom_object_template,
        serializer: V1::CustomObjectTemplateDetailSerializer
      )
    end

    def create
      template = ActiveRecord::Base.transaction do
        template = CustomObjectTemplate.create!(custom_object_template_create_params)
        new_item_values = []

        items_params = custom_object_template_items_params[:custom_object_template_items] || []

        items_params.each_with_index do |item_params, index|
          item_attrs = item_params.except(:custom_object_template_item_values).to_h
          item_attrs[:order] = item_attrs[:order].presence || index
          template_item = template.custom_object_template_items.create!(item_attrs)

          values = Array(item_params[:custom_object_template_item_values])

          if values.present?
            values.each do |value_params|
              value_attrs = value_params.to_h
              new_item_values << template_item.custom_object_template_item_values.create!(value_attrs)
            end
          elsif template_item.input_type.present? && CHOICE_INPUT_TYPES.exclude?(template_item.input_type)
            new_item_values << template_item.custom_object_template_item_values.create!
          end
        end

        template.custom_objects.each do |custom_object|
          new_item_values.each do |value|
            CustomObjectItem.create!(
              custom_object: custom_object,
              custom_object_template_item_value: value
            )
          end
        end

        template
      end

      render(
        json: template,
        serializer: V1::CustomObjectTemplateSerializer,
        status: :created
      )
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :bad_request
    rescue StandardError => e
      render json: { errors: [e.message] }, status: :bad_request
    end


    def update
      ActiveRecord::Base.transaction do
        @custom_object_template.update!(custom_object_template_params)

        items_param_key = :custom_object_template_items
        next unless params.key?(items_param_key) || params.key?(items_param_key.to_s)

        items_params = custom_object_template_items_params[:custom_object_template_items]

        if items_params.present?
          ids_in_params = items_params.filter_map { |i| i[:id] }

          item_to_destroy = @custom_object_template
                              .custom_object_template_items
                              .where.not(id: ids_in_params)

          item_to_destroy.each do |i|
            i.custom_object_template_item_values.destroy_all
          end
          item_to_destroy.destroy_all

          items_params.each_with_index do |item_params, index|
            item_to_update = @custom_object_template.custom_object_template_items.find_or_initialize_by(id: item_params[:id])
            item_attrs = item_params.except(:custom_object_template_item_values)
                                     .merge(custom_object_template: @custom_object_template)
            item_attrs[:order] = item_attrs[:order].presence || index
            item_to_update.update!(item_attrs)

            values = Array(item_params[:custom_object_template_item_values])
            values_ids = values.filter_map { |v| v[:id] }
            if CHOICE_INPUT_TYPES.include?(item_to_update.input_type)
              item_to_update.custom_object_template_item_values.where.not(id: values_ids).destroy_all
            end

            new_item_values = []
            values.each do |value_params|
              value_to_update = item_to_update
                                  .custom_object_template_item_values
                                  .find_or_initialize_by(id: value_params[:id])
              is_new_value = value_to_update.new_record?
              value_to_update.update!(value_params)
              new_item_values << value_to_update if is_new_value
            end

            # チェックボックス/ラジオ以外の入力タイプの場合は、表示・入力用にダミーの値レコードを1つ作成する
            # （free_text/person/calendar/url は値配列が空でも1つの入力欄が必要なため）
            if values.blank? && item_to_update.input_type.present? && CHOICE_INPUT_TYPES.exclude?(item_to_update.input_type)
              unless item_to_update.custom_object_template_item_values.exists?
                default_value = item_to_update.custom_object_template_item_values.create!
                new_item_values << default_value
              end
            end

            # 新規追加されたテンプレートアイテムバリューに対して、既存の全てのカスタムオブジェクトにカスタムオブジェクトアイテムを作成
            if new_item_values.any?
              @custom_object_template.custom_objects.each do |custom_object|
                new_item_values.each do |new_value|
                  CustomObjectItem.create!(
                    custom_object: custom_object,
                    custom_object_template_item_value: new_value
                  )
                end
              end
            end
          end
        elsif params[:custom_object_template_items].is_a?(Array)
          item_to_destroy = @custom_object_template.custom_object_template_items
          item_to_destroy.each do |i|
            i.custom_object_template_item_values.destroy_all
          end
          item_to_destroy.destroy_all
        end
      end

      render(
        json: @custom_object_template.reload,
        serializer: V1::CustomObjectTemplateDetailSerializer
      )
    rescue StandardError => e
      return render json: { errors: [e.message] }, status: :bad_request
    end

    def destroy
      custom_object_template_items = @custom_object_template.custom_object_template_items
      custom_object_template_items.each do |custom_object_template_item|
        custom_object_template_item.custom_object_template_item_values.destroy_all
      end
      custom_object_template_items.destroy_all
      @custom_object_template.destroy
      render json: { message: 'Custom object template deleted successfully' }, status: :ok
    end

    private

    def set_custom_object_template
      @custom_object_template = CustomObjectTemplate
                                .includes(custom_object_template_items: :custom_object_template_item_values)
                                .find_by(id: params[:id])
      return render json: { errors: ['Custom object template not found'] }, status: :not_found unless @custom_object_template
    end

    def check_template_authorization
      return if @custom_object_template.nil? || current_user.company_id == @custom_object_template.company_id

      return render json: { errors: ['Forbidden'] }, status: :forbidden
    end

    def custom_object_template_params
      params.permit(:title)
    end

    def custom_object_template_create_params
      custom_object_template_params.merge(company: current_user.company)
    end

    def custom_object_template_items_params
      params.permit(custom_object_template_items: [
        :id, :title, :description, :input_type, :order,
        { custom_object_template_item_values: [:id, :choice_content] }
      ])
    end
  end
end
