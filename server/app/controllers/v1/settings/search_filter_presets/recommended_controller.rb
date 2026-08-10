module V1
  module Settings
    module SearchFilterPresets
      class RecommendedController < ApplicationController
        def update
          owner = current_user.company || current_user
          search_filter_preset = owner.search_filter_presets.find(params[:id])

          if search_filter_preset[:business_description].blank?
            render json: { errors: ['business_description is required'] }, status: :bad_request
            return
          end

          if search_filter_preset.update(recommended: true)
            render json: {}, status: :ok
          else
            render json: { errors: search_filter_preset.errors.full_messages }, status: :internal_server_error
          end
        end
      end
    end
  end
end
