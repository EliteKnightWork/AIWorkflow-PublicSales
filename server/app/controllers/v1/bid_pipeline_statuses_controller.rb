module V1
  class BidPipelineStatusesController < ApplicationController
    def index
      if current_user.company.nil?
        return render json: { errors: ['forbidden'] }, status: :forbidden
      end

      render(
        json: current_user.company.bid_pipeline_statuses.order(:stage, :order),
        each_serializer: V1::BidPipelineStatusSerializer,
        adapter: :json,
        root: 'bid_pipeline_statuses'
      )
    end

    def create
      status = BidPipelineStatus.new(bid_pipeline_status_create_params)

      if status.save
        render json: status, serializer: V1::BidPipelineStatusSerializer, status: :created
      else
        render json: { errors: status.errors.full_messages }, status: :bad_request
      end
    rescue ArgumentError => e
      render json: { errors: [e.message] }, status: :bad_request
    end

    def update
      status = current_user.company.bid_pipeline_statuses.find(params[:id])

      if status.update(bid_pipeline_status_update_params)
        render json: status, serializer: V1::BidPipelineStatusSerializer, status: :ok
      else
        render json: { errors: status.errors.full_messages }, status: :bad_request
      end
    end

    def destroy
      status = BidPipelineStatus.where(company: current_user.company).find(params[:id])

      if status.destroy
        render json: {}, status: :ok
      else
        render json: { errors: status.errors.full_messages }, status: :bad_request
      end
    end

    private

    def bid_pipeline_status_create_params
      params.permit(:name, :stage).merge(company: current_user.company, order: :last)
    end

    def bid_pipeline_status_update_params
      params.permit(:name, :order)
    end
  end
end
