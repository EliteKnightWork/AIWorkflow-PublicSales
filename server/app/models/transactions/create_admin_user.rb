module Transactions
  class CreateAdminUser < ApplicationTransaction
    AUTH0_CONNECTION_NAME = 'Username-Password-Authentication'.freeze

    def initialize(params, company)
      super()
      @params = params
      @company = company
    end

    def exec
      with_transaction do
        auth0_user = create_auth0_user
        create_local_user(auth0_user['user_id'])
      end
    end

    private

    def create_auth0_user
      user_data = {
        name: @params[:name],
        email: @params[:email],
        password: @params[:password]
      }

      AUTH0_CLIENT.create_user(AUTH0_CONNECTION_NAME, user_data)
    rescue Auth0::Exception => e
      Rails.logger.error("Auth0 user creation failed: #{e.message}")
      @errors << "Auth0でのユーザー作成に失敗しました: #{e.message}"
      raise ActiveRecord::Rollback
    end

    def create_local_user(auth0_user_id)
      user = User.new(
        name: @params[:name],
        email: @params[:email],
        company_id: @company.id,
        auth0_user_id: auth0_user_id
      )
      save_in_transaction(user)
      cleanup_auth0_user(auth0_user_id) if @errors.present?
    end

    def cleanup_auth0_user(auth0_user_id)
      AUTH0_CLIENT.delete_user(auth0_user_id)
    rescue Auth0::Exception => e
      Rails.logger.error("Failed to cleanup Auth0 user: #{auth0_user_id}, error: #{e.message}")
      # Auth0の削除に失敗しても、ローカルDBの作成は失敗しているので
      # トランザクションはロールバックされる
    end
  end
end
