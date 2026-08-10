module V1
  module Admin
    class CompanyFeaturesController < ApplicationController
      def index
        features = Feature.order(:key)
        
        render(
          json: features,
          each_serializer: V1::FeatureSerializer,
          adapter: :json,
          root: 'features'
        )
      end
    end
  end
end

