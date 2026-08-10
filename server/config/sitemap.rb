if Rails.env.production?
  SitemapGenerator::Sitemap.adapter = SitemapGenerator::AwsSdkAdapter.new(Settings.aws.s3.bucket.sitemap,
    access_key_id: ENV.fetch('AWS_ACCESS_ID'),
    secret_access_key: ENV.fetch('AWS_ACCESS_KEY'),
    region: Settings.aws.region,
    acl: nil
  )
end

SitemapGenerator::Sitemap.compress = false
SitemapGenerator::Sitemap.default_host = "https://#{Settings.client_domain}"
SitemapGenerator::Sitemap.sitemaps_host = "https://#{Settings.client_domain}/"
SitemapGenerator::Sitemap.sitemaps_path = 'sitemaps/'

SitemapGenerator::Sitemap.create do
  group(sitemap_name: 'projects') do
    Project.visible.find_each do |project|
      add "/projects/#{project.uuid}", lastmod: project.updated_at
    end
  end
end
