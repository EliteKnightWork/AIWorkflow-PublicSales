module V1
  module BidPipelines
    module Tasks
      class AttachmentsController < ApplicationController
        def index
          bid_pipeline_task = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
          task = bid_pipeline_task.tasks.find(params[:task_id])
          attachments = task.attachments

          render json: attachments, each_serializer: V1::BidPipelineTaskAttachmentSerializer
        end

        def show
          bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
          task = bid_pipeline.tasks.find(params[:task_id])
          attachment = task.attachments.find(params[:id])

          render json: attachment, serializer: V1::BidPipelineTaskAttachmentSerializer
        end

        def create
          bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
          task = bid_pipeline.tasks.find(params[:task_id])
          attachment = task.attachments.build(attachment_params)

          if attachment.save
            render json: attachment, serializer: V1::BidPipelineTaskAttachmentSerializer, status: :created
          else
            render json: attachment.errors, status: :unprocessable_entity
          end
        end


        def destroy
          bid_pipeline = current_user.company.bid_pipelines.find(params[:bid_pipeline_id])
          task = bid_pipeline.tasks.find(params[:task_id])
          attachment = task.attachments.find(params[:id])

          if attachment.destroy
            head :no_content
          else
            render json: attachment.errors, status: :unprocessable_entity
          end
        end

        private

        def attachment_params
          params.expect(attachment: [:file])
        end
      end
    end
  end
end
