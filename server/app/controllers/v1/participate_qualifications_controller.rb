module V1
  class ParticipateQualificationsController < ApplicationController
    def index
      # パラメータ取得
      prefectures = params[:prefectures] || []
      types = params[:types] || []
      ids = params[:ids] || []
      grade_ids = params[:grade_ids] || []

      # prefectures を prefecture_codes に変換
      prefecture_codes = prefectures.filter_map do |code|
        LgCodeConverter.to_formatted_code(code)
      end

      # ParticipateQualificationをクエリ
      qualifications = ParticipateQualification.includes(:participate_qualification_grades)

      # OR条件での絞り込み
      or_conditions = []

      if prefecture_codes.present?
        or_conditions << ParticipateQualification.arel_table[:lg_code].in(prefecture_codes)
      end

      if types.present?
        or_conditions << ParticipateQualification.arel_table[:participate_qualification_type].in(types)
      end

      if ids.present?
        or_conditions << ParticipateQualification.arel_table[:id].in(ids)
      end

      if grade_ids.present?
        # grade_idsを含むqualificationを返す
        grade_qualification_ids = ParticipateQualificationGrade.where(id: grade_ids).pluck(:participate_qualification_id).uniq
        or_conditions << ParticipateQualification.arel_table[:id].in(grade_qualification_ids)
      end

      if or_conditions.any?
        condition = or_conditions.shift
        or_conditions.each do |c|
          condition = condition.or(c)
        end
        qualifications = qualifications.where(condition)
      end

      # レスポンスを返す
      render(
        json: qualifications,
        each_serializer: V1::ParticipateQualificationSerializer,
        adapter: :json,
        root: 'participate_qualifications'
      )
    end
  end
end
