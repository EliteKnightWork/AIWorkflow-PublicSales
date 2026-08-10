# 提案書作成用のLambdaアプリ

- LabidのバックエンドからSQS経由でリクエストを受ける想定のLambda関数です。

### ローカル環境の構築

0. .envに値を設定

1. labidリポジトリのルートディレクトリにあるdocker-compose.ymlにて、localstackのコメントを外し、docker起動する

```
docker compose up -d
```

2. 必要なライブラリをインストールする

```
yarn install
```

3. ローカル環境のlocalstackにlambda関数をデプロイ

```
yarn deploy:local
```

4. アプリ画面から提案書作成機能を実行

### クラウド環境へのデプロイ

- 環境に応じて以下コマンドでデプロイ完了

```
yarn deploy:dev
yarn deploy:prod
```