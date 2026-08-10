module V1
  module Users
    class MeController < ApplicationController
      def index
        render json: current_user, serializer: V1::UserSerializer, include_authorized_providers: true
      end

      def update
        if current_user.update(user_params)
          render json: current_user, serializer: V1::UserSerializer, include_authorized_providers: true
        else
          render json: current_user.errors, status: :internal_server_error
        end
      end

      private

      def user_params
        params.permit(:name)
      end
    end
  end
end
