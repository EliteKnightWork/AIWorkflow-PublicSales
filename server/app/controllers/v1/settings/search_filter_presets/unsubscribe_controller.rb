module V1
  module Settings
    module SearchFilterPresets
      class UnsubscribeController < ApplicationController
        def update
          search_filter_preset_notification = current_user.search_filter_preset_notifications.find_by(search_filter_preset_id: params[:id])
          if search_filter_preset_notification&.destroy
            render json: {}, status: :ok
          else
            render json: { errors: ['配信解除に失敗しました'] }, status: :internal_server_error
          end
        end
      end
    end
  end
end
