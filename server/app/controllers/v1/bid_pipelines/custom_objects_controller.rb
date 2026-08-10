module V1
  module BidPipelines
    class CustomObjectsController < ApplicationController
      def index
        bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
        custom_objects = bid_pipeline.custom_objects.includes(
          :custom_object_template,
          custom_object_items: [
            :user,
            custom_object_template_item_value: :custom_object_template_item
          ]
        )

        render(
          json: custom_objects,
          each_serializer: V1::CustomObjectSerializer,
        )
      end
    end
  end
end

