module V1
  module Companies
    class CustomObjectFilterItemsController < ApplicationController
      before_action :set_company
      before_action :check_company_authorization

      def index
        custom_object_template_items = CustomObjectTemplateItem
                                         .where(custom_object_template_id: @company.custom_object_templates.select(:id))
                                         .includes(:custom_object_template, :custom_object_template_item_values)

        render(
          json: custom_object_template_items,
          each_serializer: V1::CustomObjectFilterItemSerializer,
        )
      end

      private

      def set_company
        @company = Company.find_by(id: params[:company_id])
        return render json: { errors: ['Company not found'] }, status: :not_found unless @company
      end

      def check_company_authorization
        return if @company.nil? || current_user.company_id == @company.id

        render json: { errors: ['Forbidden'] }, status: :forbidden
      end
    end
  end
end
