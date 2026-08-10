module PublicRequestValidatable
  extend ActiveSupport::Concern

  ALLOWLIST = %w[controller action prefectures or_keywords page tab sort_by only_successful_bidders project_type procedure_type_groups organization_name_array ].freeze

  private

  def valid_public_request?
    return false unless valid_params?
    return false unless valid_keywords?
    return false unless valid_combination?

    params[:page].to_i <= 1 && params[:or_keywords]&.split(' ')&.size.to_i <= 1 && params[:prefectures]&.size.to_i <= 1 && params[:procedure_type_groups]&.size.to_i <= 1 && params[:organization_name_array]&.size.to_i <= 1
  end

  def valid_params?
    (params.keys - ALLOWLIST).empty?
  end

  def valid_keywords?
    return true if params[:or_keywords].blank? 

    or_keywords = params[:or_keywords].is_a?(Array) ? params[:or_keywords] : params[:or_keywords].split(' ')
    or_keywords.size <= 1
  end

  def valid_combination?
    targets = [params[:or_keywords], params[:prefectures], params[:procedure_type_groups], params[:organization_name_array]]
    targets.count(&:present?) <= 1
  end
end
