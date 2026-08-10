module V1
  module Admin
    class AwardedProjectsController < ApplicationController
      skip_before_action :require_login

      def create
        transaction = Transactions::UpsertAwardedProject.new(params)

        if transaction.exec
          # TODO: indexアクション実装時にaward_projectを返すように修正
          render json: {}, status: :created
        else
          render json: { errors: transaction.errors }, status: :internal_server_error
        end
      end
    end
  end
end
