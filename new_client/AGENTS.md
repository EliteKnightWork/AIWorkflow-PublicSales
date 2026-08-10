# フロントエンドコード規約

> **適用範囲**
> 本規約は**新規のクライアントコード**作成時のみ適用され、既存のコードに対する修正や変更時には適用されません。

---

## 1. ディレクトリ構成とレイヤ責務

```
src/
  app/        # ページ単位（page/layout/route/error/loading）
  shared/     # 単一機能の基本コンポーネント（Button, TextField, DatePicker...）
  entities/   # ドメイン要素を持たない複雑なコンポーネント（ListTable...）
  features/   # ドメイン要素を持つ機能コンポーネント（CompanyInformationForm...）
  widgets/    # ドメイン要素を持つ複合コンポーネント（CompanyInformation...）
```

* **レイヤの責務**
- `shared`
  - 単一の機能を持つ、最も基本的なコンポーネント（例: Button, TextField, DatePicker, WithLabel）。
  - デザインシステム、基盤 UI、ユーティリティ。ドメイン知識は持たない。
- `entities`
  - ドメイン要素を持たず、`shared` コンポーネントより複雑なコンポーネント（例: ListTable）。
  - `shared` コンポーネントを組み合わせて構成されるが、特定のドメインに依存しない汎用的な UI パターン。
  - データ取得は行わない。
- `features`
  - ドメイン要素を持ち、状態やバリデーション、クエリなどの機能を提供するコンポーネント（例: CompanyInformationForm）。
  - ユースケースの実装（query/mutation、状態管理、バリデーション、API 連携）。必要に応じて Provider/Controller を公開。
- `widgets`
  - ドメイン要素を持ったコンポーネント（`features` や `entities`）によって構成される複合コンポーネント（例: CompanyInformation）。
  - 画面セクションの組み立て。複数の `features` や `entities` を統合し、より大きな機能単位を提供。
- `app`
  - ページ単位の組み立てと境界。ルート単位の実装。
  - ロジックは最小にし、下位レイヤ（`widgets` / `features` / `entities`）を組み合わせる。

* **依存方向（下記のみ許可）**

  * `shared` → 依存なし（`shared` 内相互利用は可）
  * `entities` → `shared`
  * `features` → `entities`, `shared`
  * `widgets` → `features`, `entities`, `shared`
  * `app` → すべて（※他レイヤから `app` へ依存不可）

* **同レイヤ間依存**

  * 既定: **NG**（スライス間の横断依存は避ける）
  * 例外: **同一スライス配下**での内部依存はOK（内部実装として扱う）

* **App Router 前提**

  * `pages/` は設けない
  * ルートは `app/` から **widgets / features / entities** を組み合わせる

### スライスの推奨構成（各レイヤの `<slice>/` 直下）

```
<layer>/<slice>/
  index.tsx           # Public API（エントリ）
  *.tsx               # メイン実装
  hooks.ts            # 内部フック （必要に応じて）
  controller.ts       # Provider / Facade / Controller（必要に応じて）
  types.ts            # 型
  *.module.css        # スタイル（CSS Modules）
  *.stories.tsx       # Story（pages配下は対象外）
  *.test.tsx          # テスト
```

### Public API / import 規約

* **各スライス直下**に `index.ts(x)` を置き、**外部は必ず Public API 経由**で import
* **深い相対 import は禁止**。パスエイリアス（例: `@/shared/...`, `@/features/...`）を使用

---

## 2. コーディングスタイル

### 2.1 フォーマット（Biome 準拠）

* **インデント**: スペース2
* **クォート**: JS/TS/JSX ともに**シングルクォート `'`**
* **末尾カンマ**: ES5 スタイル（配列/オブジェクトの最後に付与）
* **セミコロン**: **省略しない**

### 2.2 命名

* **コンポーネント/その他ファイル**: キャメルケース（例: `ProjectCard.tsx`, `dateUtils.ts`）
* **スタイル**: `*.module.css`
* **型定義**: `types.ts` または `types/index.ts`

---

## 3. TypeScript 規約

* `tsconfig` は **strict** を有効
* `any` は**原則禁止**（レガシー例外は最小限・TODO明記）
* 型の import は `import type` を使用
* **Props** は `type` で定義
* API のデータモデルは **生成型（OpenAPI → orval 等）を使用**。手動作成しない

```ts
// 良い例
import type { Project, Pagination } from '@/api/generated/models';
```

---

## 4. React / Next.js パターン

### 4.1 エクスポート指針

* ライブラリ化しやすい **名前付きエクスポート推奨**
* ページコンポーネントは `default export` 可

### 4.2 Server / Client Components 原則

* **Server Component を優先**（SEO/初期ロード/サーバ資源アクセス）
* ブラウザ API・インタラクション・`useState/useEffect` が必要な場合のみ **Client**

```ts
// Server（デフォルト）
export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectList projects={projects} />;
}

// Client（必要時のみ）
'use client';
export function InteractiveSearch() { /* ... */ }
```

### 4.3 データフェッチのコロケーション

* **必要なコンポーネントの近くで**取得
* 並行取得は `Promise.all` を活用
* **N+1** を避け、**一括取得**や **Loader** パターンを検討

### 4.4 Container First

* `features/<slice>/controller.ts` などで **取得/組立て（Container）**
* `component.tsx` は表示に**専念**（Presentation）

### 4.5 Suspense / ストリーミング

* セクション単位で `Suspense` を分割し、**段階的表示**を推奨

### 4.6 Server Component 純度

* **副作用禁止**（ログ/グローバル状態変更等は Client 側か server actions へ）

---

## 5. スタイリング

* **CSS Modules** を既定（ファイル名: `styles.module.css`、クラス: キャメルケース）
* 既存の UI ライブラリは **Radix UI** を使用可

  * 見た目の調整は **CSS Modules** で行う
* **レイアウトコンポーネント**として **Radix UI Themes** の `Box`, `Flex`, `Text` を使用する

  * `Box`: `<div>` の代替としてコンテナ要素に使用
  * `Flex`: フレックスレイアウトが必要な場合に使用（`justify`, `align`, `direction` などの props を活用）
  * `Text`: テキスト表示用に使用（見出しやラベルなど）
  * これらのコンポーネントにも `className` を適用し、CSS Modules でスタイルを調整可能
* デザインシステム/トークン/アイコン等は **`shared/`** に集約

---

## 6. 状態管理

* **サーバー状態**: TanStack Query（React Query）を使用

  * OpenAPI → **orval 生成フック**を優先利用
* **クライアント状態**: `useState`/`useReducer`。グローバルは **React Context**（認証・テーマ等）
* `features` レイヤに **Provider/Controller** を配置可能

---

## 7. API 統合・データ取得/変更

* OpenAPI から自動生成（例: `yarn orval`）→ `src/api/generated/`（**編集禁止**）
* 変更系は **Server Actions** を活用（`'use server'`）

  * 成功時の再検証: `revalidatePath()` 等
* **リクエストメモ化**（同一リクエスト内は自動キャッシュ）
* **キャッシュ戦略**

  * 静的/動的レンダリングの切替意図を明示
  * `fetch()` の `next.revalidate` / `cache: 'no-store'` を適切に設定

---

## 8. エラーハンドリング

* 例外は **上位の `error.tsx` / `not-found.tsx`** に委譲可能
* クライアント側は **カスタムフック**（例: `useApiError()`）で文面/ハンドラを一元管理

---

## 9. ベストプラクティス

### 9.1 インポート順序（Biome が基本自動）

1. React/Next.js
2. 外部ライブラリ
3. 内部（絶対パスエイリアス）
4. 相対パス
5. スタイル

### 9.2 条件付きレンダリング / 配列のキー

* 三項演算子/短絡評価を適切に使用
* `.map()` の `key` は **安定ID**（インデックスは不可）

### 9.3 イベント/フック命名

* `on*` / `use*` プレフィックスを徹底（例: `onSelectProject`, `useApiError`）

### 9.4 パフォーマンス

* `React.memo` / `useMemo` / `useCallback` を**必要十分**に
* 不要な `useEffect` を避ける（データ取得は Server/Query へ）

---

## 10. 品質管理（旧より補完）

### 10.1 スクリプト

```bash
yarn lint         # Biome linter
yarn format       # フォーマットチェック
yarn check        # lint + format
yarn check:fix    # 自動修正
yarn build        # 本番ビルド（型チェック含む）
```

### 10.2 フック

* **Lefthook** で pre-commit に `yarn check` を実行

---

## 11. 禁止・推奨リスト（要点）

### 11.1 避けるべき

* `any` 乱用 / 手動 API 型の作成
* `src/api/generated/` の編集
* **深い相対 import**
* インラインスタイルの多用
* 同レイヤ異スライスへの依存
* 不必要な `useEffect` / `console.log`（Server Component）

### 11.2 推奨

* **App Router 準拠**のレイヤアーキテクチャ（`shared → entities → features → widgets → app`）
* **Public API** を介した import と **エイリアス**利用
* **Server Components** の最大活用、**データコロケーション**
* **Suspense/ストリーミング**・**Request Memoization**
* **Radix UI + CSS Modules**、`shared/` へのデザイン資産集約
* **orval 生成フック** + **TanStack Query** によるデータ管理

---

## 12. Storybook 規約

### 12.1 基本方針

- **`shared` と `entities` レイヤのコンポーネントは、stories ファイルと `play` によるテストの実装を必須とする**。
- **コンポーネントは汎用的・再利用可能**に実装する（特定ユースケースのロジックは持たせない）。
- **スタイルのバリエーションは props で切替**できるようにする（例: `appearance`/`uiSize`/`tone` 等）。
- **CSS Modules** を採用し、テスト容易性のため **`data-*` 属性**で見た目の状態を付与する（例: `data-appearance`, `data-ui-size`, `data-full-width`）。
- Story は **CSF (Component Story Format)** を使用、`@storybook/nextjs-vite` の型を利用する。
- すべての Story に **`play` を追加し、必要に応じてテスト**（機能/UI/状態/アクセシビリティ）を実施する。

### 12.2 配置・命名・構成

- Story は **コンポーネントの横に配置**する（`src/stories` はテンプレート用。新規は各レイヤ配下）。
- 構成は下記 4 ファイルを基本とする。

```
<layer>/<slice>/<ComponentName>/
  ├─ <ComponentName>.tsx          # 実装（汎用/再利用可能、default export）
  ├─ <ComponentName>.stories.tsx  # Story + play（相互作用テスト）
  ├─ <componentName>.module.css   # CSS Modules（小文字始まりのキャメルケース）
  └─ index.tsx                    # Public API（型とコンポーネントを再エクスポート）
```

- Story の `title` はレイヤに合わせる: 例）`Shared/Button`, `Entities/MenuItem`, `Features/…`。
- `tags: ['autodocs']` を付与し、自動ドキュメント生成を有効化。
- コンポーネントは **`default export`** を使用し、`index.tsx` で再エクスポートする。
- 型は `export type` でエクスポートし、`index.tsx` で再エクスポートする。

### 12.3 スタイルと props 設計

- 代表的な見た目を **プリセット prop** として提供する。
  - 例）`variant: 'primary' | 'secondary' | 'tertiary' | 'default'`
  - 例）`size: 'xl' | 'large' | 'medium' | 'small'`
- Props の定義は **`ComponentProps` を `Omit` して拡張**するパターンを使用。
- 各プロパティには **JSDoc コメント**で説明を付与する。
- **レイアウト構築**には **Radix UI Themes** の `Box`, `Flex`, `Text` を使用する。

  - ネイティブの `<div>`, `<span>` の代わりに `Box` を使用
  - フレックスレイアウトが必要な場合は `Flex` を使用（`justify`, `align`, `direction` などの props を活用）
  - テキスト表示には `Text` を使用
  - これらのコンポーネントにも `className` を適用し、CSS Modules でスタイルを調整
- クラス合成は関数化して**一箇所で管理**（`variantClass`, `sizeClass` など）。
- CSS Modules のクラス名は **キャメルケース**を使用（例: `variantPrimary`, `sizeLarge`）。
- テスト容易性のため、必要に応じて **見た目/状態を `data-*` 属性で付与**（例: `data-variant`, `data-size`, `data-active`, `aria-busy`）。

### 12.4 `play` によるテスト指針

- すべての Story に `play` を用意し、該当する観点をテストする。
- `play` 関数は `async` で実装し、`userEvent` を使用してインタラクションをテストする。
- Story で状態管理が必要な場合は `render` 関数内で `useState` を使用する。

#### テスト観点と実装パターン

- **要素の存在確認**
  - `within(canvasElement).findByRole()`, `findByPlaceholderText()`, `findByText()`, `getByRole()` など
- **イベント発火確認**
  - `@storybook/test` の `fn()` と `expect(args.onClick).toHaveBeenCalledTimes(1)` を使用
  - 機能: `onClick`, `onChange` などや条件分岐の結果確認
- **状態確認**
  - `toHaveValue()`, `toBeDisabled()`, `toBeVisible()`, `toHaveTextContent()` など
  - `useState`/`useEffect` による変化（`aria-pressed` などの状態属性）を確認
- **インタラクション**
  - `userEvent.click()`, `userEvent.type()`, `userEvent.clear()` など
