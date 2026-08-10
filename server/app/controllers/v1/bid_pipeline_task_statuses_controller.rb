module V1
  class BidPipelineTaskStatusesController < ApplicationController
    def index
      if current_user.company.nil?
        return render json: { errors: ['forbidden'] }, status: :forbidden
      end

      render(
        json: current_user.company.bid_pipeline_task_statuses.order(:order),
        each_serializer: V1::BidPipelineTaskStatusSerializer,
        adapter: :json,
        root: 'bid_pipeline_task_statuses'
      )
    end

    def create
      status = BidPipelineTaskStatus.new(bid_pipeline_task_status_create_params)

      if status.save
        render json: {}, status: :created
      else
        render json: { errors: status.errors.full_messages }, status: :bad_request
      end
    end

    def update
      status = current_user.company.bid_pipeline_task_statuses.find(params[:id])

      if status.update(bid_pipeline_task_status_update_params)
        render json: {}, status: :ok
      else
        render json: { errors: status.errors.full_messages }, status: :bad_request
      end
    end

    def destroy
      status = BidPipelineTaskStatus.where(company: current_user.company).find(params[:id])

      if status.destroy
        render json: {}, status: :ok
      else
        render json: { errors: status.errors.full_messages }, status: :bad_request
      end
    end

    private

    def bid_pipeline_task_status_create_params
      params.permit(:name).merge(company: current_user.company, order: :last)
    end

    def bid_pipeline_task_status_update_params
      params.permit(:name, :is_default, :order)
    end
  end
end
