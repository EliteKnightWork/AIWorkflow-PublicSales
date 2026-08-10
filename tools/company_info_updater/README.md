# このディレクトリの説明
[スプレッドシート](https://docs.google.com/spreadsheets/d/1lBYK_wgt1pV4K5SyqG-fIwGFuuIp5vz9Oen1wPkQg0w/edit?gid=1620309503#gid=1620309503)のE列を参照してgemeniで会社情報を収集して、スプシに書き込むプログラム

## 1. 事前準備

- Node.js 18 以上（ローカル動作確認用）
- Google Cloud プロジェクトと Cloud Run 利用権限
- サービスアカウント（`roles/spreadsheets` を含む API へアクセス可能なもの）
- 以下の API キー / ID
  - `GEMINI_API_KEY`
  - `GOOGLE_API_KEY`
  - `SEARCH_ENGINE_ID`

## 2. ローカル動作確認

1. 依存パッケージをインストールします。
   ```bash
   npm install
   ```

2. サービスアカウント JSON をダウンロードし、パスを `GOOGLE_APPLICATION_CREDENTIALS` に設定します。
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   ```

3. `.env` を作成して API キーとスプレッドシート情報を定義します（例）。
   ```bash
   cat <<'ENV' > .env
   GEMINI_API_KEY=xxxxxxxxxxxxxxxxxxxx
   GOOGLE_API_KEY=yyyyyyyyyyyyyyyyyyyy
   SEARCH_ENGINE_ID=zzzzzzzzzzzzzzzzz
   SPREADSHEET_ID=your-spreadsheet-id
   SHEET_NAME=調査対象シート名
   # 必要に応じて START_ROW や BATCH_SIZE も上書き可能
   ENV
   ```

4. CLI を実行します。`--sheet` や `--limit` などは必要に応じて指定してください。
   ```bash
   npm run enrich -- --sheet=調査対象シート名 --spreadsheet-id=your-spreadsheet-id
   ```

   - `--limit=10` を付けると先頭から 10 件のみ処理します。
   - `--dry-run` を付けるとスプレッドシートの書き込みを抑止します（ログも記録しません）。

## 3. Docker イメージのビルドと Cloud Run Job デプロイ

1. Artifact Registry などにプッシュするイメージをビルドします。
   ```bash
   gcloud builds submit --tag asia-northeast1-docker.pkg.dev/PROJECT_ID/REPO/enrich-companies
   ```

2. Cloud Run Job を作成します。環境変数と引数でスプレッドシート情報を渡します。
   ```bash
   gcloud run jobs create enrich-companies \
     --image=asia-northeast1-docker.pkg.dev/PROJECT_ID/REPO/enrich-companies \
     --region=asia-northeast1 \
     --service-account=SERVICE_ACCOUNT_EMAIL \
     --set-env-vars=GEMINI_API_KEY=xxx,GOOGLE_API_KEY=yyy,SEARCH_ENGINE_ID=zzz,SPREADSHEET_ID=your-spreadsheet-id,SHEET_NAME=調査対象シート名 \
     --args=--sheet=調査対象シート名 \
     --args=--spreadsheet-id=your-spreadsheet-id
   ```

   - Cloud Run Job 作成後、`gcloud beta run jobs execute enrich-companies --region=asia-northeast1` で起動できます。
   - 追加で `--set-env-vars=START_ROW=2,BATCH_SIZE=8` など、Apps Script 時代の定数も上書き可能です。

3. 既存の Job を更新する場合は `gcloud run jobs update` を利用します。

## 4. ファイル構成

- `src/enrich.js` : Node.js 版のメインスクリプト
- `Dockerfile` : Cloud Run Jobs 用コンテナイメージ定義
- `.env` : ローカル検証時に読み込む環境変数（Git 管理外）

## 5. 注意点

- ログは CLI の標準出力に書き出されます（スプレッドシートへは記録しません）。
- `GEMINI_API_KEY` が設定されていない場合、Gemini 呼び出しはスキップされ CSE フォールバックのみで処理します。
- `GOOGLE_API_KEY` / `SEARCH_ENGINE_ID` が未設定の場合は CSE による URL 補完が機能しません。
