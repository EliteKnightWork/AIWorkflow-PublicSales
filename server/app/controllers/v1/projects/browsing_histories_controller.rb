module V1
  module Projects
    class BrowsingHistoriesController < ApplicationController
      def create
        project = Project.for_company(current_user.company_id).visible.find_by!(uuid: params[:id])

        history = current_user.browsing_histories.find_or_initialize_by(browsable: project)
        if history.save
          render json: {}, status: :created
        else
          render json: { error: '既読登録に失敗しました' }, status: :internal_server_error
        end
      end
    end
  end
end
