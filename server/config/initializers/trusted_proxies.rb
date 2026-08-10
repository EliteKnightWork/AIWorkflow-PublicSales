Rails.application.configure do
  ip_ranges_res = Faraday.get('https://ip-ranges.amazonaws.com/ip-ranges.json')
  ip_ranges = JSON.parse(ip_ranges_res.body)

  # CLOUDFRONTのIPアドレス
  cloudfront_ips = ip_ranges['prefixes'].select { |v| v['service'] == 'CLOUDFRONT' }.map { |v| IPAddr.new(v['ip_prefix']) } +
                   ip_ranges['ipv6_prefixes'].select { |v| v['service'] == 'CLOUDFRONT' }.map { |v| IPAddr.new(v['ipv6_prefix']) }

  # EC2のIPアドレス
  ec2_ips = ip_ranges['prefixes'].select { |v| v['service'] == 'EC2' }.map { |v| IPAddr.new(v['ip_prefix']) } +
            ip_ranges['ipv6_prefixes'].select { |v| v['service'] == 'EC2' }.map { |v| IPAddr.new(v['ipv6_prefix']) }

  # CLOUDFRONTとEC2のIPを両方trusted_proxiesに設定
  config.action_dispatch.trusted_proxies = cloudfront_ips + ec2_ips
end
