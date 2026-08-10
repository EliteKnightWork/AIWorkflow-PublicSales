module V1
  module Admin
    class UsersController < ApplicationController
      def show
        user = User.includes(:company).find(params[:id])

        if user
          render json: user, serializer: V1::UserSerializer, status: :ok
        else
          render json: { error: 'User not found' }, status: :not_found
        end
      end

      def create
        company = Company.find(params[:company_id])
        transaction = Transactions::CreateAdminUser.new(params, company)

        if transaction.exec
          render json: {}, status: :created
        else
          render json: { errors: transaction.errors }, status: :unprocessable_entity
        end
      end

      def update
        user = User.find(params[:id])

        if user.update_with(params)
          render json: user, serializer: V1::UserSerializer, status: :ok
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def search
        result = User.search(params)

        render(
          json: result,
          each_serializer: V1::UserSerializer,
          meta: {
            pagination: PaginationSerializer.new(result),
          },
          adapter: :json,
          root: 'users'
        )
      end

      def destroy
        user = User.find(params[:id])

        if user.destroy
          render json: {}, status: :ok
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end
    end
  end
end
