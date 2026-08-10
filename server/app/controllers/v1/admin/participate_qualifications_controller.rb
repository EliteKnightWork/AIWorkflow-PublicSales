module V1
  module Admin
    class ParticipateQualificationsController < ApplicationController
      skip_before_action :require_login

      def index
        # パラメータの取得
        page = params[:page] || 1
        name = params[:name]

        # クエリ
        qualifications = ParticipateQualification.includes(:participate_qualification_grades)

        # 絞り込み
        if name.present?
          qualifications = qualifications.where('name LIKE ?', "%#{name}%")
        end

        # ページネーション
        qualifications = qualifications.page(page)

        render(
          json: qualifications,
          each_serializer: V1::ParticipateQualificationSerializer,
          adapter: :json,
          root: 'participate_qualifications'
        )
      end
    end
  end
end
