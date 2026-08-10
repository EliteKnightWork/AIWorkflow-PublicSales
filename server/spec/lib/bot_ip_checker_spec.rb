require 'rails_helper'

RSpec.describe BotIpChecker do
  describe '#initialize' do
    it 'GooglebotのIPレンジをフェッチすること' do
      mock_response = {
        'prefixes' => [
          { 'ipv4Prefix' => '192.168.1.0/24' },
          { 'ipv6Prefix' => '2001:db8::/32' }
        ]
      }.to_json

      allow(URI).to receive(:open).and_return(StringIO.new(mock_response))
      
      checker = described_class.new
      expect(checker.instance_variable_get(:@googlebot_prefixes)).not_to be_empty
    end
  end

  describe '#googlebot_ip?' do
    let(:checker) { described_class.new }

    before do
      mock_response = {
        'prefixes' => [
          { 'ipv4Prefix' => '66.249.64.0/19' },   # 66.249.64.0 - 66.249.95.255
          { 'ipv4Prefix' => '66.249.96.0/20' },   # 66.249.96.0 - 66.249.111.255
          { 'ipv6Prefix' => '2001:db8::/32' }     # 2001:db8:0:0:0:0:0:0 - 2001:db8:ffff:ffff:ffff:ffff:ffff:ffff
        ]
      }.to_json

      # GooglebotIpCheckerはFaraday.getを使っているので、Faraday.getをモックする必要がある
      mock_faraday_response = instance_double(Faraday::Response, body: mock_response)
      allow(Faraday).to receive(:get).and_return(mock_faraday_response)
    end

    context 'GooglebotのIPアドレスの場合' do
      it 'IPv4アドレスに対してtrueを返すこと' do
        # 66.249.65.1 は 66.249.64.0/19 に含まれる（OK）
        expect(checker.googlebot_ip?('66.249.65.1')).to be true
        # 66.249.96.1 は 66.249.96.0/20 に含まれる（OK）
        expect(checker.googlebot_ip?('66.249.96.1')).to be true
        # 66.249.112.1 は どちらにも含まれない（falseになるはず）
        expect(checker.googlebot_ip?('66.249.112.1')).to be false
      end

      it 'IPv6アドレスに対してtrueを返すこと' do
        # 2001:db8::1 は 2001:db8::/32 に含まれる（OK）
        expect(checker.googlebot_ip?('2001:db8::1')).to be true
        # 2001:db8:0:1::1 も 2001:db8::/32 に含まれる（OK）
        expect(checker.googlebot_ip?('2001:db8:0:1::1')).to be true
        # 2001:db9::1 は含まれない（falseになるはず）
        expect(checker.googlebot_ip?('2001:db9::1')).to be false
      end
    end

    context 'GooglebotのIPアドレスではない場合' do
      it 'IPv4アドレスに対してfalseを返すこと' do
        expect(checker.googlebot_ip?('192.168.1.1')).to be false
        expect(checker.googlebot_ip?('10.0.0.1')).to be false
        expect(checker.googlebot_ip?('8.8.8.8')).to be false
      end

      it 'IPv6アドレスに対してfalseを返すこと' do
        expect(checker.googlebot_ip?('2001:4860:4860::8888')).to be false
        expect(checker.googlebot_ip?('fe80::1')).to be false
      end
    end

    context '無効なIPアドレスの場合' do
      it 'IPAddr::InvalidAddressErrorが発生すること' do
        expect { checker.googlebot_ip?('invalid-ip') }.to raise_error(IPAddr::InvalidAddressError)
        expect { checker.googlebot_ip?('256.256.256.256') }.to raise_error(IPAddr::InvalidAddressError)
      end
    end
  end

  describe '#fetch_prefixes' do
    let(:checker) { described_class.new }

    context 'JSONにipv4PrefixとIPv6Prefixが混在している場合' do
      before do
        mock_response = {
          'prefixes' => [
            { 'ipv4Prefix' => '192.168.1.0/24' },
            { 'ipv6Prefix' => '2001:db8::/32' },
            { 'ipv4Prefix' => '10.0.0.0/8' }
          ]
        }.to_json

        mock_faraday_response = instance_double(Faraday::Response, body: mock_response)
        allow(Faraday).to receive(:get).and_return(mock_faraday_response)
      end

      it 'すべてのプレフィックスがIPAddrオブジェクトに変換されること' do
        prefixes = checker.send(:fetch_prefixes)
        expect(prefixes.size).to eq(3)
        expect(prefixes).to all(be_a(IPAddr))
      end
    end

    context 'JSONにipv4PrefixもIPv6Prefixも含まれないオブジェクトがある場合' do
      before do
        mock_response = {
          'prefixes' => [
            { 'ipv4Prefix' => '192.168.1.0/24' },
            { 'someOtherKey' => 'someValue' },
            { 'ipv6Prefix' => '2001:db8::/32' }
          ]
        }.to_json

        mock_faraday_response = instance_double(Faraday::Response, body: mock_response)
        allow(Faraday).to receive(:get).and_return(mock_faraday_response)
      end

      it 'nilは除外されること' do
        prefixes = checker.send(:fetch_prefixes)
        expect(prefixes.size).to eq(2)
        expect(prefixes.compact).to eq(prefixes)
      end
    end

    context 'ネットワークエラーが発生した場合' do
      before do
        allow(Faraday).to receive(:get).and_raise(Faraday::ConnectionFailed.new('connection failed'))
      end

      it 'Faraday::ConnectionFailedが発生すること' do
        expect { described_class.new }.to raise_error(Faraday::ConnectionFailed)
      end
    end

    context 'JSONパースエラーが発生した場合' do
      before do
        mock_faraday_response = instance_double(Faraday::Response, body: 'invalid json')
        allow(Faraday).to receive(:get).and_return(mock_faraday_response)
      end

      it 'JSON::ParserErrorが発生すること' do
        expect { described_class.new }.to raise_error(JSON::ParserError)
      end
    end
  end

  describe '#bingbot_ip?' do
    let(:checker) { described_class.new }

    context '有効なBingbotのIPアドレスの場合' do
      before do
        # 逆引きで正しいホスト名を返すようにモック
        allow(Resolv).to receive(:getname).with('1.2.3.4').and_return('msnbot-1-2-3-4.search.msn.com')
        allow(Resolv).to receive(:getname).with('5.6.7.8').and_return('msnbot-5-6-7-8.search.msn.com')
        
        # 正引きで元のIPアドレスを含むようにモック
        allow(Resolv).to receive(:getaddresses).with('msnbot-1-2-3-4.search.msn.com').and_return(['1.2.3.4', '1.2.3.5'])
        allow(Resolv).to receive(:getaddresses).with('msnbot-5-6-7-8.search.msn.com').and_return(['5.6.7.8'])
      end

      it 'trueを返すこと' do
        expect(checker.bingbot_ip?('1.2.3.4')).to be true
        expect(checker.bingbot_ip?('5.6.7.8')).to be true
      end
    end

    context 'search.msn.comで終わらないホスト名の場合' do
      before do
        allow(Resolv).to receive(:getname).with('1.2.3.4').and_return('fake-bot.example.com')
        allow(Resolv).to receive(:getaddresses).with('fake-bot.example.com').and_return(['1.2.3.4'])
      end

      it 'falseを返すこと' do
        expect(checker.bingbot_ip?('1.2.3.4')).to be false
      end
    end

    context '正引きで元のIPアドレスが含まれない場合' do
      before do
        allow(Resolv).to receive(:getname).with('1.2.3.4').and_return('msnbot-1-2-3-4.search.msn.com')
        allow(Resolv).to receive(:getaddresses).with('msnbot-1-2-3-4.search.msn.com').and_return(['9.9.9.9', '8.8.8.8'])
      end

      it 'falseを返すこと' do
        expect(checker.bingbot_ip?('1.2.3.4')).to be false
      end
    end

    context '逆引きでResolvErrorが発生した場合' do
      before do
        allow(Resolv).to receive(:getname).with('1.2.3.4').and_raise(Resolv::ResolvError.new('NXDOMAIN'))
      end

      it 'falseを返すこと' do
        expect(checker.bingbot_ip?('1.2.3.4')).to be false
      end
    end

    context '逆引きでSocketErrorが発生した場合' do
      before do
        allow(Resolv).to receive(:getname).with('1.2.3.4').and_raise(SocketError.new('getaddrinfo: Name or service not known'))
      end

      it 'falseを返すこと' do
        expect(checker.bingbot_ip?('1.2.3.4')).to be false
      end
    end

    context '正引きでResolvErrorが発生した場合' do
      before do
        allow(Resolv).to receive(:getname).with('1.2.3.4').and_return('msnbot-1-2-3-4.search.msn.com')
        allow(Resolv).to receive(:getaddresses).with('msnbot-1-2-3-4.search.msn.com').and_raise(Resolv::ResolvError.new('NXDOMAIN'))
      end

      it 'falseを返すこと' do
        expect(checker.bingbot_ip?('1.2.3.4')).to be false
      end
    end

    context '正引きでSocketErrorが発生した場合' do
      before do
        allow(Resolv).to receive(:getname).with('1.2.3.4').and_return('msnbot-1-2-3-4.search.msn.com')
        allow(Resolv).to receive(:getaddresses).with('msnbot-1-2-3-4.search.msn.com').and_raise(SocketError.new('getaddrinfo: Name or service not known'))
      end

      it 'falseを返すこと' do
        expect(checker.bingbot_ip?('1.2.3.4')).to be false
      end
    end

    context '複数のIPアドレスが正引きで返される場合' do
      before do
        allow(Resolv).to receive(:getname).with('1.2.3.4').and_return('msnbot-1-2-3-4.search.msn.com')
        allow(Resolv).to receive(:getaddresses).with('msnbot-1-2-3-4.search.msn.com').and_return(['9.9.9.9', '1.2.3.4', '8.8.8.8'])
      end

      it '元のIPアドレスが含まれていればtrueを返すこと' do
        expect(checker.bingbot_ip?('1.2.3.4')).to be true
      end
    end

    context '空のIPアドレス配列が正引きで返される場合' do
      before do
        allow(Resolv).to receive(:getname).with('1.2.3.4').and_return('msnbot-1-2-3-4.search.msn.com')
        allow(Resolv).to receive(:getaddresses).with('msnbot-1-2-3-4.search.msn.com').and_return([])
      end

      it 'falseを返すこと' do
        expect(checker.bingbot_ip?('1.2.3.4')).to be false
      end
    end

    context '異なるドメインで終わるホスト名の場合' do
      test_cases = [
        'msnbot-1-2-3-4.search.google.com',  # .search.google.com
        'msnbot-1-2-3-4.msn.com',            # .msn.com
        'msnbot-1-2-3-4.search.msn.org',     # .search.msn.org
        'msnbot-1-2-3-4.search.msn.com.evil.com', # .search.msn.com.evil.com
        'search.msn.com',                     # 直接 .search.msn.com
        'msnbot-1-2-3-4.search.msn.com.',    # 末尾にドット
      ]

      test_cases.each do |hostname|
        context "ホスト名が '#{hostname}' の場合" do
          before do
            allow(Resolv).to receive(:getname).with('1.2.3.4').and_return(hostname)
            allow(Resolv).to receive(:getaddresses).with(hostname).and_return(['1.2.3.4'])
          end

          it 'falseを返すこと' do
            expect(checker.bingbot_ip?('1.2.3.4')).to be false
          end
        end
      end
    end
  end

  describe '#applebot_ip?' do
    let(:checker) { described_class.new }

    context '有効なApplebotのIPアドレスの場合' do
      before do
        # 逆引きで正しいホスト名を返すようにモック
        allow(Resolv).to receive(:getname).with('17.58.100.1').and_return('applebot-17-58-100-1.applebot.apple.com')
        allow(Resolv).to receive(:getname).with('17.60.89.100').and_return('applebot-17-60-89-100.applebot.apple.com')
        
        # 正引きで元のIPアドレスを含むようにモック
        allow(Resolv).to receive(:getaddresses).with('applebot-17-58-100-1.applebot.apple.com').and_return(['17.58.100.1', '17.58.100.2'])
        allow(Resolv).to receive(:getaddresses).with('applebot-17-60-89-100.applebot.apple.com').and_return(['17.60.89.100'])
      end

      it 'trueを返すこと' do
        expect(checker.applebot_ip?('17.58.100.1')).to be true
        expect(checker.applebot_ip?('17.60.89.100')).to be true
      end
    end

    context 'applebot.apple.comで終わらないホスト名の場合' do
      before do
        allow(Resolv).to receive(:getname).with('17.58.100.1').and_return('fake-bot.example.com')
        allow(Resolv).to receive(:getaddresses).with('fake-bot.example.com').and_return(['17.58.100.1'])
      end

      it 'falseを返すこと' do
        expect(checker.applebot_ip?('17.58.100.1')).to be false
      end
    end

    context '正引きで元のIPアドレスが含まれない場合' do
      before do
        allow(Resolv).to receive(:getname).with('17.58.100.1').and_return('applebot-17-58-100-1.applebot.apple.com')
        allow(Resolv).to receive(:getaddresses).with('applebot-17-58-100-1.applebot.apple.com').and_return(['8.8.8.8', '9.9.9.9'])
      end

      it 'falseを返すこと' do
        expect(checker.applebot_ip?('17.58.100.1')).to be false
      end
    end

    context '逆引きでResolvErrorが発生した場合' do
      before do
        allow(Resolv).to receive(:getname).with('17.58.100.1').and_raise(Resolv::ResolvError.new('NXDOMAIN'))
      end

      it 'falseを返すこと' do
        expect(checker.applebot_ip?('17.58.100.1')).to be false
      end
    end

    context '逆引きでSocketErrorが発生した場合' do
      before do
        allow(Resolv).to receive(:getname).with('17.58.100.1').and_raise(SocketError.new('getaddrinfo: Name or service not known'))
      end

      it 'falseを返すこと' do
        expect(checker.applebot_ip?('17.58.100.1')).to be false
      end
    end

    context '正引きでResolvErrorが発生した場合' do
      before do
        allow(Resolv).to receive(:getname).with('17.58.100.1').and_return('applebot-17-58-100-1.applebot.apple.com')
        allow(Resolv).to receive(:getaddresses).with('applebot-17-58-100-1.applebot.apple.com').and_raise(Resolv::ResolvError.new('NXDOMAIN'))
      end

      it 'falseを返すこと' do
        expect(checker.applebot_ip?('17.58.100.1')).to be false
      end
    end

    context '正引きでSocketErrorが発生した場合' do
      before do
        allow(Resolv).to receive(:getname).with('17.58.100.1').and_return('applebot-17-58-100-1.applebot.apple.com')
        allow(Resolv).to receive(:getaddresses).with('applebot-17-58-100-1.applebot.apple.com').and_raise(SocketError.new('getaddrinfo: Name or service not known'))
      end

      it 'falseを返すこと' do
        expect(checker.applebot_ip?('17.58.100.1')).to be false
      end
    end

    context '複数のIPアドレスが正引きで返される場合' do
      before do
        allow(Resolv).to receive(:getname).with('17.58.100.1').and_return('applebot-17-58-100-1.applebot.apple.com')
        allow(Resolv).to receive(:getaddresses).with('applebot-17-58-100-1.applebot.apple.com').and_return(['8.8.8.8', '17.58.100.1', '1.1.1.1'])
      end

      it '元のIPアドレスが含まれていればtrueを返すこと' do
        expect(checker.applebot_ip?('17.58.100.1')).to be true
      end
    end

    context '空のIPアドレス配列が正引きで返される場合' do
      before do
        allow(Resolv).to receive(:getname).with('17.58.100.1').and_return('applebot-17-58-100-1.applebot.apple.com')
        allow(Resolv).to receive(:getaddresses).with('applebot-17-58-100-1.applebot.apple.com').and_return([])
      end

      it 'falseを返すこと' do
        expect(checker.applebot_ip?('17.58.100.1')).to be false
      end
    end

    context '異なるドメインで終わるホスト名の場合' do
      test_cases = [
        'applebot-17-58-100-1.apple.com',              # .apple.com
        'applebot-17-58-100-1.applebot.example.com',   # .applebot.example.com
        'applebot-17-58-100-1.applebot.apple.org',     # .applebot.apple.org
        'applebot-17-58-100-1.applebot.apple.com.evil.com', # .applebot.apple.com.evil.com
        'applebot.apple.com',                          # 直接 .applebot.apple.com
        'applebot-17-58-100-1.applebot.apple.com.',    # 末尾にドット
      ]

      test_cases.each do |hostname|
        context "ホスト名が '#{hostname}' の場合" do
          before do
            allow(Resolv).to receive(:getname).with('17.58.100.1').and_return(hostname)
            allow(Resolv).to receive(:getaddresses).with(hostname).and_return(['17.58.100.1'])
          end

          it 'falseを返すこと' do
            expect(checker.applebot_ip?('17.58.100.1')).to be false
          end
        end
      end
    end
  end
end