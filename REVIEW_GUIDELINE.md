# PRレビューガイドライン


## コメント記法（運用ルール）
- レビューコメントは以下のコメント種別を参考に必ず以下のいずれかで始めること  
  - `MUST:`
  - `SHOULD:`
  - `IMO:`
  - `NITS:`
  - `ASK:`
- コメントが複数ある場合も、1コメント = 1種別に分けること
- 具体的な修正提案は **Suggested changes** を活用すること  
  👉 [GitHub Docs: Applying a suggested change](https://docs.github.com/ja/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/incorporating-feedback-in-your-pull-request#applying-a-suggested-change)

----

## コメント種別
- **MUST**  
  致命的なバグ・セキュリティ問題・仕様逸脱など、修正が必須なもの

- **SHOULD**  
  保守性やパフォーマンス、コーディング規約に沿っていない実装など、強く修正を推奨するもの

- **IMO (In My Opinion)**  
  個人的な意見や好み、実装方針に関する提案

- **NITS**  
  Typoや不要なimportなど、細かくてすぐ直せるもの

- **ASK**  
  実装意図が分からない場合などの質問

---

## Approve基準
- `MUST` / `SHOULD` / `NITS` / `ASK` が1つでも残っている場合は **Approveせず、Request Changes** を選択する
- **MUST / SHOULD**  
  → その通り修正してほしい意図  
- **NITS**  
  → その場で対応してほしい（後回し禁止）  
- **ASK**  
  → 回答が出るまで Approve しない  

