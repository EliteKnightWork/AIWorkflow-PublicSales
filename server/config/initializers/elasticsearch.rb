Elasticsearch::Model.client = if Rails.env.local?
  Elasticsearch::Client.new(
    host: Settings.elasticsearch.host,
    port: Settings.elasticsearch.port,
    log: Rails.env.development?,
    retry_on_failure: 3
  )
else
  Elasticsearch::Client.new(
    cloud_id: ENV['ELASTICSEARCH_CLOUD_ID'],
    user: ENV['ELASTICSEARCH_USER'],
    password: ENV['ELASTICSEARCH_PASSWORD'],
    retry_on_failure: 5,
    request_timeout: 5 * 60,
  )
end

# NOTE: ElasticsearchのレスポンスをKaminariでページネーションするための設定
# https://github.com/elastic/elasticsearch-rails/tree/main/elasticsearch-model#pagination
Kaminari::Hooks.init if defined?(Kaminari::Hooks)
Elasticsearch::Model::Response::Response.include Elasticsearch::Model::Response::Pagination::Kaminari
