module V1
  class BidPipelineTasksController < ApplicationController
    def index

      if current_user.company.nil?
        return render json: { errors: ['forbidden'] }, status: :forbidden
      end

      tasks = BidPipelineTask
        .joins(bid_pipeline: :project)
        .includes(:status, :assigned_users)

      tasks = build_where_clause(tasks, params)

      render(
        json: tasks,
        each_serializer: V1::BidPipelineTaskSerializer,
        current_user: current_user,
      )
    end

    private

    def build_where_clause(tasks, params)

      tasks = tasks.where(bid_pipelines: { company_id: current_user.company_id })

      if params[:bid_pipeline_task_status_stages].present?
        tasks = tasks.where(bid_pipeline_task_statuses: { stage: params[:bid_pipeline_task_status_stages] })
      end

      tasks = tasks.order(created_at: :desc)

      tasks
    end
  end
end
