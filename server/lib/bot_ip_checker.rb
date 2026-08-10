require 'json'
require 'open-uri'
require 'ipaddr'
require 'resolv'

class BotIpChecker
  GOOGLEBOT_IP_JSON = 'https://developers.google.com/search/apis/ipranges/googlebot.json'

  def initialize
    @googlebot_prefixes = fetch_prefixes
  end

  def googlebot_ip?(ip)
    ip_addr = IPAddr.new(ip)
    @googlebot_prefixes.any? { |range| range.include?(ip_addr) }
  end

  def bingbot_ip?(ip)
    begin
      # 逆引き（IP -> ホスト名）
      hostname = Resolv.getname(ip)
      # "search.msn.com" で終わるか厳密に確認
      return false unless hostname.end_with?('.search.msn.com')

      # 正引き（ホスト名 -> IP）して、元のIPが含まれるか確認
      resolved_ips = Resolv.getaddresses(hostname)
      resolved_ips.any?(ip)
    rescue Resolv::ResolvError, SocketError
      false
    end
  end

  def applebot_ip?(ip)
    begin
      # 逆引き（IP -> ホスト名）
      hostname = Resolv.getname(ip)
      # "apple.com" で終わるか厳密に確認
      return false unless hostname.end_with?('.applebot.apple.com')

      # 正引き（ホスト名 -> IP）して、元のIPが含まれるか確認
      resolved_ips = Resolv.getaddresses(hostname)
      resolved_ips.any?(ip)
    rescue Resolv::ResolvError, SocketError
      false
    end
  end

  private

  def fetch_prefixes
    data = JSON.parse(Faraday.get(GOOGLEBOT_IP_JSON).body)
    data['prefixes'].filter_map do |p|
      if p['ipv4Prefix']
        IPAddr.new(p['ipv4Prefix'])
      elsif p['ipv6Prefix']
        IPAddr.new(p['ipv6Prefix'])
      end
    end
  end
end
