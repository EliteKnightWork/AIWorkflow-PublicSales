# Project Chat Agent

プロジェクトチャット機能を提供するFastAPIアプリケーションです。

## 機能

- プロジェクトチャット機能
- JWT認証（Auth0）
- チャット履歴管理
- 集中化された設定管理
- SQLAlchemy接続プールによる高パフォーマンスデータベース接続

## セットアップ

### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 2. 環境変数の設定

`env.example`ファイルをコピーして`.env`ファイルを作成し、実際の値を設定してください：

```bash
cp env.example .env
```

`.env`ファイルで以下の環境変数を設定してください：

```env
# Environment
ENVIRONMENT=development

# Database Configuration
DATABASE_HOST=localhost
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=your_db_name
DATABASE_PORT=3306

# Database Connection Pooling Configuration
DATABASE_USE_POOLING=true
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20
DATABASE_POOL_RECYCLE=3600
DATABASE_POOL_PRE_PING=true
DATABASE_POOL_TIMEOUT=30
DATABASE_ECHO_SQL=false

# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-auth0-audience
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Anthropic LLM Configuration
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MAX_TOKENS=8192
ANTHROPIC_TEMPERATURE=0.7

# CORS Configuration
CORS_ALLOW_ORIGINS=["*"]
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=["*"]
CORS_ALLOW_HEADERS=["*"]

# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=false
LOG_LEVEL=INFO
```

### 3. アプリケーションの起動

```bash
cd app
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 設定管理

このアプリケーションは`app/core/config.py`を使用して集中化された設定管理を提供しています。

### 設定クラス

- `DatabaseConfig`: データベース接続設定（接続プール設定を含む）
- `Auth0Config`: Auth0認証設定
- `LLMConfig`: LLM（Anthropic）設定
- `CORSConfig`: CORS設定
- `ServerConfig`: サーバー設定

### 設定の使用例

```python
from core.config import get_config, get_database_config

# 全体の設定を取得
config = get_config()

# 特定の設定セクションを取得
db_config = get_database_config()
print(f"Database host: {db_config.host}")
```

## JWT認証

このアプリケーションはAuth0を使用したJWT認証を実装しています。

### 認証フロー

1. クライアントはAuth0からJWTトークンを取得
2. APIリクエスト時に`Authorization: Bearer <token>`ヘッダーを送信
3. サーバーはJWTトークンを検証し、有効な場合のみリクエストを処理

### 認証が必要なエンドポイント

- `POST /projects/{project_id}/chat_stream` - プロジェクトチャット（ストリーミング）
- `GET /projects/{project_id}/chat_history` - チャット履歴取得

### 認証が不要なエンドポイント

- `GET /health` - ヘルスチェック

## API仕様

### プロジェクトチャット（ストリーミング）

```http
POST /projects/{uuid}/chat_stream
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "input_text": "ユーザーの入力テキスト"
}
```

### チャット履歴取得

```http
GET /projects/{uuid}/chat_history
Authorization: Bearer <jwt_token>
```

### ヘルスチェック

```http
GET /health
```

## データベース接続プール

このアプリケーションはSQLAlchemyを使用した接続プール機能を提供しています。

### 接続プールの利点

- **パフォーマンス向上**: 接続の再利用によりオーバーヘッドを削減
- **リソース効率**: 同時接続数の制御と最適化
- **信頼性**: 接続の検証と自動リサイクル
- **スケーラビリティ**: 高負荷時の安定したパフォーマンス

### 接続プール設定

```python
# 接続プールの設定例
DATABASE_USE_POOLING=true      # 接続プールを有効化
DATABASE_POOL_SIZE=10          # 常時保持する接続数
DATABASE_MAX_OVERFLOW=20       # 追加で作成可能な接続数
DATABASE_POOL_RECYCLE=3600     # 接続のリサイクル間隔（秒）
DATABASE_POOL_PRE_PING=true    # 接続使用前の検証
DATABASE_POOL_TIMEOUT=30       # 接続取得のタイムアウト（秒）
DATABASE_ECHO_SQL=false        # SQLクエリのログ出力
```

### 使用方法

```python
# ファクトリーパターンを使用（推奨）
from db.database_factory import get_database

db = get_database()  # 自動的に接続プールを使用
result = db.execute_query("SELECT * FROM users WHERE id = %s", (user_id,))

# 直接SQLAlchemyセッションを使用
from db.pooled_database import PooledDatabase

db = PooledDatabase()
with db.get_session() as session:
    result = session.execute("SELECT * FROM users WHERE id = :user_id", {"user_id": user_id})
```

## エラーハンドリング

- `401 Unauthorized`: 認証トークンが無効または欠落
- `500 Internal Server Error`: サーバー内部エラー

## セキュリティ考慮事項

### 認証・認可
- JWTトークンの有効期限はAuth0の設定に従います
- トークンブラックリスト機能により、無効化されたトークンは拒否されます
- JWKSキャッシュにTTL（1時間）が設定されており、定期的に更新されます

### CORS設定
- 本番環境では適切なCORS設定を行ってください
- `env.production.example`を参考に、許可するオリジンを制限してください
- ワイルドカード（`*`）の使用は避けてください

### 入力検証
- すべての入力はPydanticスキーマで検証されます
- SQLインジェクション、XSS攻撃を防ぐためのサニタイゼーションが実装されています
- UUID形式の厳密な検証が行われます

### ログ・監視
- 構造化ログにより、セキュリティイベントを追跡できます
- 機密情報はログに記録されません
- エラーIDにより、インシデントの追跡が可能です

### セキュリティヘッダー
- 以下のセキュリティヘッダーが自動的に追加されます：
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Content-Security-Policy`
  - `Referrer-Policy: strict-origin-when-cross-origin`

### 本番環境デプロイ
1. `env.production.example`をコピーして`.env.production`を作成
2. 実際の本番環境の値に置き換え
3. CORS設定で許可するオリジンを制限
4. ログレベルを`WARNING`以上に設定
5. セキュアなデータベース接続を使用