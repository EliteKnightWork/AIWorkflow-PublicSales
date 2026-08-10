module V1
  module Admin
    class CompaniesController < ApplicationController
      def index
        if params[:all].present? && params[:all] == 'true'
          companies = Company.order(created_at: :desc)
          
          # 企業名フィルタリングの適用（all=trueの場合も適用）
          if params[:name].present?
            name_term = "%#{params[:name]}%"
            companies = companies.where("name LIKE ?", name_term)
          end
          
        else
          page = params[:page] || 1
          companies = Company.includes(:users).order(created_at: :desc)
          
          # 企業名フィルタリングの適用
          if params[:name].present?
            name_term = "%#{params[:name]}%"
            companies = companies.where("name LIKE ?", name_term)
          end
          
          companies = companies.page(page)
        end

        render(
          json: companies,
          each_serializer: V1::CompanySerializer,
          meta: params[:all].present? ? nil : { pagination: PaginationSerializer.new(companies) },
          adapter: :json,
          root: 'companies'
        )
      end

      def show
        company = Company.find(params[:id])
        render json: company, serializer: V1::CompanySerializer, root: false
      end

      def create
        company = Company.build_from(company_params)

        if company.save
          render json: company, serializer: V1::CompanySerializer, root: false, status: :created
        else
          render json: { errors: company.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        company = Company.find(params[:id])

        begin
          Company.transaction do
            unless company.update(company_update_params)
              raise ActiveRecord::RecordInvalid, company
            end

            assign_company_features!(company)
          end

          render json: company, serializer: V1::CompanySerializer, root: false
        rescue ActiveRecord::RecordInvalid
          render json: { errors: company.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        company = Company.find(params[:id])

        if company.users.exists?
          return render json: { errors: ['Company has users associated with it'], has_users: true }, status: :unprocessable_entity
        end

        if company.destroy
          render json: {}, status: :ok
        else
          render json: { errors: company.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def company_params
        @company_params ||= params.permit(:name, :is_trial, company_feature_keys: [])
      end

      def company_update_params
        company_params.except(:company_feature_keys)
      end

      def assign_company_features!(company)
        return unless params[:company_feature_keys]

        feature_keys = Array(params[:company_feature_keys]).map(&:to_s).compact_blank
        features = Feature.where(key: feature_keys)
        company.features = features
      end

    end
  end
end
