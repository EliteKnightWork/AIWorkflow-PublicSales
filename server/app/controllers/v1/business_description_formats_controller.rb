module V1
  class BusinessDescriptionFormatsController < ApplicationController
    def index
      business_description_formats = current_user.company&.business_description_formats || []

      render(
        json: business_description_formats,
        each_serializer: V1::BusinessDescriptionFormatSerializer,
        adapter: :json,
        root: 'business_description_formats'
      )
    end

    def create
      if current_user.company.nil?
        render json: { erros: ['事業情報フォーマットの作成に失敗しました'] }, status: :bad_request
      end

      if params[:description].blank?
        render json: { erros: ['事業情報フォーマットのテキストを入力してください'] }, status: :bad_request
        return
      end

      business_description_format = BusinessDescriptionFormat.new(description: params[:description])
      business_description_format.company = current_user.company

      if business_description_format.save
        render json: {}, status: :created
      else
        render json: { erros: business_description_format.errors.full_messages }, status: :internal_server_error
      end
    end

    def destroy
      business_description_format = current_user.company&.business_description_formats&.find_by(id: params[:id])

      if business_description_format.nil?
        render json: { erros: ['事業情報フォーマットの削除に失敗しました'] }, status: :bad_request
        return
      end

      if business_description_format.destroy
        render json: {}, status: :ok
      else
        render json: { erros: business_description_format.errors.full_messages }, status: :internal_server_error
      end
    end
  end
end
