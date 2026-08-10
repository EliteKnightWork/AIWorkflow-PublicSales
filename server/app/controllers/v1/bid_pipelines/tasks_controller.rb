module V1
  module BidPipelines
    class TasksController < ApplicationController
      def index
        bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
        tasks = bid_pipeline.tasks.includes(:status, :assigned_users, bid_pipeline: :project)

        render(
          json: tasks,
          each_serializer: V1::BidPipelineTaskSerializer,
          current_user: current_user,
        )
      end

      def show
        bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
        task = bid_pipeline.tasks.includes(:status, :assigned_users, bid_pipeline: :project).find(params[:id])

        render json: task, serializer: V1::BidPipelineTaskSerializer
      end

      def create
        bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
        task = bid_pipeline.tasks.build(task_params)

        if params[:bid_pipeline_task_status_id].present?
          task.status = current_user.company.bid_pipeline_task_statuses.find(params[:bid_pipeline_task_status_id])
        else
          task.status = current_user.company.bid_pipeline_task_statuses.find_by(is_default: true)
        end

        if task.save
          render json: task, serializer: V1::BidPipelineTaskSerializer, status: :created
        else
          render json: { errors: task.errors }, status: :unprocessable_entity
        end
      end

      def update
        bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
        task = bid_pipeline.tasks.find(params[:id])

        if params[:bid_pipeline_task_status_id].present?
          task.status = current_user.company.bid_pipeline_task_statuses.find(params[:bid_pipeline_task_status_id])
        end

        if task.update(task_params)
          render json: task, serializer: V1::BidPipelineTaskSerializer
        else
          render json: { errors: task.errors }, status: :unprocessable_entity
        end
      end

      def destroy
        bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
        task = bid_pipeline.tasks.find(params[:id])

        if task.destroy
          head :no_content
        else
          render json: { errors: task.errors }, status: :unprocessable_entity
        end
      end

      def duplicate
        bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
        task = bid_pipeline.tasks.find(params[:id])
        new_task = task.dup
        new_task.assigned_user_ids = task.assigned_user_ids
        new_task.title = "#{task.title} - コピー"

        if new_task.save
          render json: new_task, serializer: V1::BidPipelineTaskSerializer, status: :created
        else
          render json: { errors: new_task.errors }, status: :unprocessable_entity
        end
      end

      def bulk_delete
        bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
        task_ids = params[:task_ids].compact_blank

        if task_ids.blank?
          render json: { errors: ['タスクIDが指定されていません'] }, status: :bad_request
          return
        end

        tasks = bid_pipeline.tasks.where(id: task_ids)

        if tasks.destroy_all
          head :no_content
        else
          render json: { errors: ['一部のタスクの削除に失敗しました'] }, status: :internal_server_error
        end
      end

      def bulk_duplicate
        bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
        task_ids = params[:task_ids].compact_blank

        if task_ids.blank?
          render json: { errors: ['タスクIDが指定されていません'] }, status: :bad_request
          return
        end

        tasks = bid_pipeline.tasks.where(id: task_ids)
        new_tasks = []

        tasks.each do |task|
          new_task = task.dup
          new_task.assigned_user_ids = task.assigned_user_ids
          new_task.title = "#{task.title} - コピー"
          new_tasks << new_task if new_task.save
        end

        if new_tasks.present?
          render json: new_tasks, each_serializer: V1::BidPipelineTaskSerializer, status: :created
        else
          render json: { errors: ['タスクの複製に失敗しました'] }, status: :internal_server_error
        end
      end

      private

      def task_params
        normalize_attachments_params!
        params.permit(
          :title,
          :description,
          :due_date,
          assigned_user_ids: [],
          attachments_attributes: [:file]
        )
      end

      # 添付ファイルのパラメータを正規化する
      def normalize_attachments_params!
        raw = params[:attachments_attributes]
        return if raw.blank?

        # 単一ファイルで送られてきた場合を配列化
        files = raw.is_a?(Array) ? raw : [raw]

        # {file: f} の配列へ変換
        params[:attachments_attributes] = files.map { |f| { file: f } }
      end
    end
  end
end
