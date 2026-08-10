module V1
  class BidPipelinesController < ApplicationController
    def index
      pipelines = current_user.company.bid_pipelines.
        includes(
          :status,
          { project: [:lg_codes, :project_security_qualifications] },
          :assigned_users,
          bid_pipeline_assignments: :user,
          custom_objects: [
            :custom_object_template,
            { custom_object_items: [:user, { custom_object_template_item_value: :custom_object_template_item }] }
          ]
        ).preload(
          :upcomming_task,
          upcomming_task: [:status, :assigned_users]
        )

      pipelines = build_where_clause(pipelines, params)

      render(
        json: pipelines,
        each_serializer: V1::BidPipelineSerializer,
        adapter: :json,
        root: 'bid_pipelines',
        current_user: current_user
      )
    end

    def show
      pipeline = current_user.company.bid_pipelines.
        includes(
          :status,
          { project: [:lg_codes, :project_security_qualifications] },
          :assigned_users,
          bid_pipeline_assignments: :user,
          custom_objects: [
            :custom_object_template,
            { custom_object_items: [:user, { custom_object_template_item_value: :custom_object_template_item }] }
          ]
        ).
        find(params[:id])

      render(
        json: pipeline,
        serializer: V1::BidPipelineSerializer,
        current_user: current_user
      )
    end

    def create
      pipeline = BidPipeline.build_with_params(
        company: current_user.company,
        create_params: bid_pipeline_create_params
      )

      if pipeline.save
        render(
          json: pipeline,
          serializer: V1::BidPipelineSerializer,
          status: :created,
          current_user: current_user
        )
      else
        render json: { errors: pipeline.errors.full_messages }, status: :bad_request
      end
    end

    def update
      pipeline = BidPipeline.where(company: current_user.company).find(params[:id])

      if pipeline.update_with_params(bid_pipeline_update_params)
        render json: {}, status: :ok
      else
        render json: { errors: pipeline.errors.full_messages }, status: :bad_request
      end
    end

    def destroy
      pipeline = BidPipeline.where(company: current_user.company).find(params[:id])

      if pipeline.destroy
        render json: {}, status: :ok
      else
        render json: { errors: pipeline.errors.full_messages }, status: :bad_request
      end
    end

    private

    def bid_pipeline_create_params
      params.permit(:project_uuid, :bid_pipeline_status_id, assigned_user_ids: [])
    end

    def bid_pipeline_update_params
      params.permit(:bid_pipeline_status_id, assigned_user_ids: [])
    end

    def build_where_clause(pipelines, params)
      if params[:bidding_deadline_date_from].present?
        pipelines = pipelines.where(projects: { bidding_deadline_date: (params[:bidding_deadline_date_from]).. })
      end

      if params[:bidding_deadline_date_to].present?
        pipelines = pipelines.where(projects: { bidding_deadline_date: ..(params[:bidding_deadline_date_to]) })
      end

      if params[:bid_pipeline_status_ids].present?
        pipelines = pipelines.where(bid_pipeline_status_id: params[:bid_pipeline_status_ids])
      end

      if params[:assigned_user_ids].present?
        pipelines = pipelines.where(bid_pipeline_assignments: { user_id: params[:assigned_user_ids] })
      end

      if params[:bid_pipeline_status_stages].present?
        pipelines = pipelines.where(status: { stage: params[:bid_pipeline_status_stages] })
      end

      if params[:sort_key].present?
        order = params[:sort_order] || 'asc'
        pipelines = pipelines.order(conv_sort_key(params[:sort_key]) => order)
      end

      pipelines
    end

    def conv_sort_key(sort_key)
      case sort_key
      when 'project_title'
        'projects.title'
      when 'status'
        'status.order'
      when 'assigned_user'
        'assigned_users.name'
      else
        'projects.bidding_deadline_date'
      end
    end
  end
end
