module V1
  module Admin
    class ProposalJobsController < ApplicationController
      def index
        proposal_jobs = ProposalJob.includes(:company, :user, :project, :proposal_document)

        # Completed ステータスでのフィルタリング
        completed = ActiveModel::Type::Boolean.new.cast(params[:completed])
        proposal_jobs = proposal_jobs.completed if completed

        # ページネーション
        page = params[:page] || 1
        proposal_jobs = proposal_jobs.order(created_at: :desc).page(page)

        render(
          json: proposal_jobs,
          each_serializer: V1::ProposalJobSerializer,
          meta: { pagination: PaginationSerializer.new(proposal_jobs) },
          adapter: :json,
          root: 'proposal_jobs'
        )
      end
    end
  end
end
