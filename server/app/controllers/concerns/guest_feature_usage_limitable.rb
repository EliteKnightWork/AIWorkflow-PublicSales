module GuestFeatureUsageLimitable
  extend ActiveSupport::Concern

  included do
    class_attribute :guest_limit_redirect_map, instance_accessor: false, default: {}
  end

  class_methods do
    # 例) limit_guest_usage redirects: { search: '/limit_exceeded/search_projects', show: '/limit_exceeded/show_project' }
    # 例) limit_guest_usage redirects: { show: -> { "/limit_exceeded/get_project?uuid=#{params[:id]}" } }
    def limit_guest_usage(options = {})
      self.guest_limit_redirect_map ||= {}
      options[:redirects].each do |action, redirect_path|
        guest_limit_redirect_map[action.to_sym] = redirect_path
      end
      before_action :check_guest_usage_limit
    end
  end

  private

  def check_guest_usage_limit
    return unless should_check_guest_limit?

    identifier = extract_identifier
    return unless identifier

    # Googlebot の IP アドレスは許可する
    if BotIpChecker.new.googlebot_ip?(identifier)
      return
    end

    # Bingbot の IP アドレスは許可する
    if BotIpChecker.new.bingbot_ip?(identifier)
      return
    end

    # Applebot の IP アドレスは許可する
    if BotIpChecker.new.applebot_ip?(identifier)
      return
    end

    usage = GuestFeatureUsage.find_or_create_for(identifier: identifier)
    usage.reset_period! if usage.period_expired?

    if usage.limit_reached?
      Rails.logger.info "Guest usage limit exceeded: #{identifier}"
      head :see_other, location: guest_limit_redirect_location! and return
    end

    usage.update!(count: usage.count + 1)
  end

  def should_check_guest_limit?
    return false if ENV['GUEST_FEATURE_USAGE_LIMITABLE'] == 'false'

    # 対象アクション以外は無視
    return false unless self.class.guest_limit_redirect_map.key?(action_name.to_sym)

    # NOTE: ログインしていないユーザーの場合のみチェック
    current_user.nil?
  end

  def guest_limit_redirect_location!
    redirect_path = self.class.guest_limit_redirect_map[action_name.to_sym]
    location = redirect_path.respond_to?(:call) ? instance_exec(&redirect_path) : redirect_path
    raise NotImplementedError, 'redirect destination for guest limit is not configured' if location.blank?

    location
  end

  def extract_identifier
    request.remote_ip
  end
end
