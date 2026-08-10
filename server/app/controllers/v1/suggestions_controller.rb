module V1
  class SuggestionsController < ApplicationController
    skip_before_action :require_login

    DEFAULT_LIMIT = 10
    MAX_LIMIT = 50 # 極端に大きな値を防ぐための上限
    VALID_TYPES = %w[prefectures organizations bidCompanies procedureTypeGroups]

    def index
      keyword = params[:keyword]
      limit = [params[:limit].to_i, MAX_LIMIT].min
      limit = DEFAULT_LIMIT if limit <= 0
      
      # 配列形式とカンマ区切り文字列の両方に対応
      types = if params[:types].is_a?(Array)
        params[:types]
      elsif params[:types].is_a?(String)
        params[:types].split(',')
      else
        VALID_TYPES
      end

      # 無効な種類を除外
      types = types & VALID_TYPES

      suggestions = {}
      # 指定されたtypesに対して、デフォルトで空配列を設定
      types.each do |type|
        suggestions[type.to_sym] = []
      end

      # 各タイプの検索結果で上書き
      suggestions[:prefectures] = types.include?('prefectures') ? search_prefectures(keyword, limit) : []
      suggestions[:organizations] = types.include?('organizations') ? search_organizations(keyword, limit) : []
      suggestions[:bidCompanies] = types.include?('bidCompanies') ? search_bid_companies(keyword, limit) : []
      suggestions[:procedureTypeGroups] = types.include?('procedureTypeGroups') ? search_procedure_type_groups(keyword, limit) : []

      render json: { suggestions: suggestions }
    end

    private

    def search_prefectures(keyword, limit)
      return [] if keyword.blank?

      prefectures = LgCodeConverter::PREFECTURES_MAP.values
      prefectures.
        select { |name| name.include?(keyword) }.
        map { |name| { value: name } }.
        take(limit)
    end

    def search_organizations(keyword, limit)
      return [] if keyword.blank?

      Organization.
        where('name LIKE ?', "%#{ActiveRecord::Base.sanitize_sql_like(keyword)}%").
        limit(limit).
        pluck(:name).
        map { |name| { value: name } }
    end

    def search_bid_companies(keyword, limit)
      return [] if keyword.blank?

      BidCompany.
        where('name LIKE ?', "%#{ActiveRecord::Base.sanitize_sql_like(keyword)}%").
        limit(limit).
        pluck(:name).
        map { |name| { value: name } }
    end

    def search_procedure_type_groups(keyword, limit)
      return [] if keyword.blank?

      %w[一般競争入札 指名競争入札 企画競争入札 随意契約 見積もり合わせ 資料招請 意見招請 その他].
        select { |name| name.include?(keyword) }.
        map { |name| { value: name } }.
        take(limit)
    end
  end
end
