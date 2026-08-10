## ディレクトリの構成
```
server/
├── app/                 # メインのコード
│   ├── controllers/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   └── v2/
│   │   └── application_controller.rb
│   ├── models/
│   ├── services/
│   ├── serializers/
│   ├── workers/
│   ├── mailers/
│   └── views/
│
├── config/              # 設定関連
│   ├── initializers/
│   ├── environments/
│   ├── locales/
│   ├── database.yml
│   ├── routes.rb
│   └── application.rb
│
├── coverage/            # SimpleCovカバレッジレポート
│
├── db/                  # データベース関連
│   ├── schemas/
│   └── seeds/
│
├── docker/              # Docker関連
│   ├── app/
│   │   └── Dockerfile
│   ├── db/
│   │   └── Dockerfile
│   └── elasticsearch/
│       └── Dockerfile
│
├── lib/                 # rake task, 切り分けモジュール関連
│   ├── tasks/
│   └── utils/
│
├── scripts/             # 運用スクリプト
│   ├── deploy/
│   │   ├── production/
│   │   └── staging/
│   ├── ecs_exec.sh
│   └── setup.sh
│
├── spec/                # テスト関連
│   ├── controllers/
│   ├── models/
│   ├── services/
│   ├── workers/
│   ├── factories/
│   ├── support/
│   └── spec_helper.rb
│
├── .env
├── .env.sample
├── .gitignore
├── .rspec
├── .rubocop.yml
├── .ruby-version
├── Dockerfile
├── Gemfile
├── Gemfile.lock
├── README.md
├── Rakefile
├── config.ru
└── docker-compose.yml
```

## カラムの暗号化

機密情報・個人情報はActive Record Encryptionを使用して暗号化しています。
`rails db:encryption:init`で生成した値を環境変数に設定してください。
- コマンド実行例
```
$ rails db:encryption:init

active_record_encryption:
  primary_key: <生成された値>
  deterministic_key: <生成された値>
  key_derivation_salt: <生成された値>
```

- 必要な環境変数
```
ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY=
ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY=
ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT=
```
