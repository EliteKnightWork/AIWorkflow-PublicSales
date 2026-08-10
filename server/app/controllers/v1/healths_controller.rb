module V1
  class HealthsController < ApplicationController
    skip_before_action :require_login

    def show
      render json: { message: 'OK' }
    end
  end
end
