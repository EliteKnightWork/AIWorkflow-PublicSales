/** @type {import('next').NextConfig} */
const nextConfig = {
  optimizeFonts: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'labid.jp'
      },
      {
        protocol: 'https',
        hostname: 'api.labid.jp'
      },
      {
        protocol: 'https',
        hostname: 'dev.labid.jp'
      },
      {
        protocol: 'https',
        hostname: 'dev-api.labid.jp'
      },
    ],
  },
  // 落札案件の旧URLを新URLにリダイレクトする
  async redirects() {
    return [
      {
        source: '/awardedProjects/:uuid',
        destination: '/projects/:uuid',
        permanent: true,
      },
    ]
  },
};

module.exports = nextConfig;
