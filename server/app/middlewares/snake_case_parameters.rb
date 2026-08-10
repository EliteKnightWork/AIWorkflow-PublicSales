# 参考: https://mnishiguchi-2019.netlify.app/2017/11/29/rails-hash-camelize-and-underscore-keys/
# A middleware that underscores the keys of any incoming (to the rails server) params
# NOTE: Railsではスネークケースで扱いたいため、リクエストパラメータとクエリパラメータのキーをスネークケースに変換する
# 例: リクエストパラメータ
# { 'userId': 1, 'userName': 'hoge' }
# ↓
# { 'user_id': 1, 'user_name': 'hoge' }
#
# 例: クエリパラメータ
# /v1/users?userId=1&userName=hoge
# ↓
# /v1/users?user_id=1&user_name=hoge
class SnakeCaseParameters
  def initialize(app)
    @app = app
  end

  def call(env)
    request = ActionDispatch::Request.new(env)
    request.request_parameters.deep_transform_keys!(&:underscore)
    request.query_parameters.deep_transform_keys!(&:underscore)

    @app.call(env)
  end
end
