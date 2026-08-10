module V1
  module Admin
    class ProjectsController < ApplicationController
      skip_before_action :require_login, only: [:create, :show, :update_key]

      def show
        scope = Project.for_company(nil).includes(external_documents: { file_attachment: :blob }, screenshots: { file_attachment: :blob })

        if params[:only_awarded] == 'true'
          scope = scope.joins(:awarded_project)
        end

        project = scope.find_by(key: params[:id], source: params[:source])

        if project
          render json: project, serializer: V1::ProjectSerializer,  status: :ok
        else
          render json: { errors: ["Project not found"] }, status: :not_found
        end
      end

      def show_by_uuid
        project = Project.for_company(nil).
        includes(
          external_documents: { file_attachment: :blob },
          screenshots: { file_attachment: :blob },
        ).
        visible.
        find_by!(uuid: params[:uuid])
      render json: project, serializer: V1::ProjectSerializer,
        include: {
          attachments: { file_attachment: :blob },
          screenshots: { file_attachment: :blob },
        }
      end

      def create
        transaction = Transactions::CreateProject.new(params)
        if transaction.exec
          project = transaction.project

          # TODO: コールバックに移動したい
          project.external_documents.each do |external_document|
            external_document.extract_and_update_text
          end

          begin
            project.summarize_and_save_summary
          rescue => e
            Rails.logger.error("Error in summarize_and_save_summary: #{e.message}, project title: #{params[:raw_title].presence || params[:title].presence}")
            Sentry.capture_exception(e)
          end

          project.build_project_summary_embedding(project.summary || project.description || project.title)
          project.extract_keywords_and_save
          project.extract_participation_qualification_and_save

          render json: project, serializer: V1::ProjectSerializer, status: :created
        # TODO: of_kind?(:key, :taken)のように具体的なメッセージ内容に依存しない実装にしたい
        elsif transaction.errors.any? { |m| m.to_s.include?("Keyはすでに存在します") }
          render json: { errors: transaction.errors }, status: :conflict
        else
          render json: { errors: transaction.errors }, status: :internal_server_error
        end
      end

      def update
        project = Project.for_company(nil).find_by!(uuid: params[:id])

        if project.update_with(params)
          render json: project, serializer: V1::ProjectSerializer, status: :ok
        else
          render json: { errors: project.errors.full_messages }, status: :internal_server_error
        end
      end

      def update_key
        project = Project.for_company(nil).find_by!(uuid: params[:id])

        if project.update(key: params[:key])
          render json: project, serializer: V1::ProjectSerializer, status: :ok
        elsif project.errors[:key].any?
          render json: { errors: project.errors.full_messages }, status: :conflict
        else
          render json: { errors: project.errors.full_messages }, status: :internal_server_error
        end
      end

      def destroy
        project = Project.for_company(nil).find_by!(uuid: params[:uuid])

        if project.destroy
          render json: {}, status: :ok
        else
          render json: { error: project.errors.full_messages }, status: :internal_server_error
        end
      end

      def search
        page_number = params[:page].to_i.zero? ? 1 : params[:page].to_i
        result = Project.for_company(nil).search(params).page(page_number).per(100)
        total_projects = result.records
        project_ids = total_projects.ids

        projects = Project
          .includes(:lg_codes, external_documents: { file_attachment: :blob }, screenshots: { file_attachment: :blob })
          .where(id: project_ids)
          .in_order_of(:id, project_ids)

        buckets = result.aggregations.dig('tabs', 'buckets')

        render(
          json: projects,
          each_serializer: V1::ProjectSerializer,
          meta: {
            pagination: PaginationSerializer.new(total_projects),
            aggregation: AggregationSerializer.new(buckets),
          },
          adapter: :json,
          root: 'projects'
        )
      end
    end
  end
end
