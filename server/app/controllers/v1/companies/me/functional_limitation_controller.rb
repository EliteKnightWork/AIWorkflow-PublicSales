module V1
  module Companies
    module Me
      class FunctionalLimitationController < ApplicationController
        def index
          if current_user.company.nil?
            return render json: { errors: ['forbidden'] }, status: :forbidden
          end

          # TODO: LABID-613が完了したらnilの場合の作成処理を削除
          limit = current_user.company&.company_functional_limitation
          if limit.nil?
            limit = CompanyFunctionalLimitation.new(
              company: current_user.company,
              max_search_filter_preset_notification_count: CompanyFunctionalLimitation::DEFAULT_MAX_SEARCH_FILTER_PRESET_NOTIFICATION_COUNT,
              max_recommendation_count: CompanyFunctionalLimitation::DEFAULT_MAX_RECOMMENDATION_COUNT,
              max_business_description_format_count: CompanyFunctionalLimitation::DEFAULT_MAX_BUSINESS_DESCRIPTION_FORMAT_COUNT,
              max_member_count: CompanyFunctionalLimitation::DEFAULT_MAX_MEMBER_COUNT
            )

            limit.save!
          end

          render json: limit, serializer: V1::FunctionalLimitationSerializer
        end
      end
    end
  end
end
