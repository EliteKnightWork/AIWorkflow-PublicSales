module V1
  module Admin
    class HiddenProjectsController < ApplicationController
      def index
        projects = Project.for_company(nil).hidden.order(hidden_at: :desc).page(params[:page])

        render(
          json: projects,
          each_serializer: V1::ProjectSerializer,
          meta: {
            pagination: PaginationSerializer.new(projects),
          },
          adapter: :json,
          root: 'hiddenProjects'
        )
      end
    end
  end
end
