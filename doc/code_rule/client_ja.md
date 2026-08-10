# フロントエンドコード規約

このドキュメントは、Labidフロントエンド（new_client）のコード規約を定義します。

## 1. 全般的なコーディングスタイル

### 1.1 フォーマット
- **インデント**: スペース2つ
- **行の長さ**: 最大100文字
- **クォート**: 
  - JavaScript/TypeScript: シングルクォート `'`
  - JSX属性: シングルクォート `'`
- **末尾カンマ**: ES5スタイル（オブジェクトと配列の最後の要素にカンマを付ける）
- **セミコロン**: 省略（Biomeの設定に従う）

### 1.2 ファイル命名規則
- **コンポーネントファイル**: キャメルケース（例: `ProjectCard.tsx`）
- **その他のファイル**: キャメルケース（例: `dateUtils.ts`）
- **スタイルファイル**: `styles.module.css`
- **型定義ファイル**: `types.ts` または `types/index.ts`

## 2. ディレクトリ構造

### 2.1 基本構造
```
src/
├── app/                    # Next.js App Router
│   ├── (content)/         # 認証が必要なルート
│   ├── _actions/          # Server Actions
│   ├── _components/       # ページ固有のコンポーネント
│   └── api/               # APIルート
├── api/                   # APIクライアント設定
│   ├── generated/         # 自動生成コード（編集禁止）
│   └── lib/               # APIヘルパー関数
├── components/            # 再利用可能なUIコンポーネント
├── context/               # React Context
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティライブラリ
├── styles/                # 共通スタイル
└── utils/                 # ヘルパー関数
```

### 2.2 コンポーネントの配置
- **再利用可能なコンポーネント**: `src/components/`
- **ページ固有のコンポーネント**: `src/app/_components/` またはルート固有のディレクトリ
- **Container/Presentational分離**: 複雑なコンポーネントには適用

## 3. TypeScript規約

### 3.1 型定義
- **Strict Mode**: 有効（`tsconfig.json`で設定済み）
- **any型**: 原則使用禁止（レガシーコードは例外）
- **型のインポート**: `import type` を使用

```typescript
// 良い例
import type { Project, Pagination } from '@/api/generated/models';

// 避ける例
import { Project, Pagination } from '@/api/generated/models';
```

### 3.2 Props型定義
```typescript
// 基本的なパターン
type Props = {
  title: string;
  count?: number;
  onSubmit: (value: string) => void;
};
```

### 3.3 インターフェース vs 型エイリアス
- **Props**: `type` を使用
- **データモデル**: API生成型を使用（手動で作成しない）

## 4. React/Next.jsパターン

### 4.1 コンポーネントのエクスポート
```typescript
// 名前付きエクスポート（推奨）
export function ProjectCard({ project }: Props) {
  return <div>...</div>;
}

// デフォルトエクスポート（ページコンポーネントなど特定の場合）
export default function HomePage() {
  return <div>...</div>;
}
```

### 4.2 Server/Client Componentsの選択原則
参考: [Next.js基本原則](https://zenn.dev/akfm/books/nextjs-basic-principle)

#### Server Componentを優先する場合
- データフェッチが必要な場合
- SEOが重要な場合
- 初期ロード時間を短縮したい場合
- サーバーサイドでのみ利用可能なリソースにアクセスする場合

```typescript
// Server Component（デフォルト）
import { getProjects } from '@/api/projects';

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectList projects={projects} />;
}
```

#### Client Componentを使用する場合
- ブラウザのAPIが必要な場合（localStorage、geolocation等）
- インタラクティブな機能が必要な場合（onClick、onChange等）
- Reactのstateやeffectが必要な場合

```typescript
// Client Component
'use client';
import { useState } from 'react';

export function InteractiveSearch() {
  const [query, setQuery] = useState('');
  // インタラクティブなロジック
}
```

### 4.3 データフェッチの配置原則（Colocation）

#### 1. データフェッチをコンポーネントに近い場所に配置
```typescript
// ❌ 避けるべきパターン - 親コンポーネントで全データを取得
export default async function ProjectsPage() {
  const projects = await getProjects();
  const users = await getUsers();
  const settings = await getSettings();
  
  return (
    <div>
      <ProjectList projects={projects} />
      <UserList users={users} />
      <SettingPanel settings={settings} />
    </div>
  );
}

// ✅ 推奨パターン - 各コンポーネントが必要なデータを取得
export default function ProjectsPage() {
  return (
    <div>
      <ProjectList /> {/* 内部でgetProjects()を呼び出し */}
      <UserList />    {/* 内部でgetUsers()を呼び出し */}
      <SettingPanel /> {/* 内部でgetSettings()を呼び出し */}
    </div>
  );
}
```

#### 2. 並行データフェッチ（Concurrent Data Fetching）
```typescript
// ✅ 並行してデータを取得
export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  // Promise.allを使用して並行処理
  const [project, comments, relatedProjects] = await Promise.all([
    getProject(params.id),
    getProjectComments(params.id),
    getRelatedProjects(params.id),
  ]);

  return (
    <div>
      <ProjectDetail project={project} />
      <CommentSection comments={comments} />
      <RelatedProjects projects={relatedProjects} />
    </div>
  );
}
```

### 4.4 Container/Presentationalパターンの進化版

#### Container Firstアプローチ
```typescript
// containers/project-list/index.tsx - エントリーポイント
export { ProjectListContainer as default } from './container';

// containers/project-list/container.tsx - ロジック担当
export async function ProjectListContainer() {
  const projects = await getProjects(); // Server Componentでデータ取得
  
  return <ProjectListPresentation projects={projects} />;
}

// containers/project-list/presentation.tsx - 表示担当
export function ProjectListPresentation({ projects }: Props) {
  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

### 4.5 コンポジションパターン
```typescript
// ✅ 推奨 - コンポジションパターンの活用
export function ProjectLayout({ 
  children,
  sidebar,
  toolbar 
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  toolbar: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <header>{toolbar}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}

// 使用例
<ProjectLayout
  sidebar={<ProjectSidebar />}
  toolbar={<ProjectToolbar />}
>
  <ProjectContent />
</ProjectLayout>
```

### 4.6 Suspenseとストリーミング
```typescript
// ✅ Suspenseを活用したストリーミング
export default function ProjectsPage() {
  return (
    <div>
      <h1>プロジェクト一覧</h1>
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList />
      </Suspense>
      <Suspense fallback={<RecommendationSkeleton />}>
        <RecommendationList />
      </Suspense>
    </div>
  );
}
```

## 5. スタイリング

### 5.1 CSS Modules
- **ファイル名**: `styles.module.css`
- **クラス名**: キャメルケース

```typescript
import styles from './styles.module.css';

<div className={styles.projectCard}>
  <p className={styles.title}>...</p>
</div>
```

### 5.2 Radix UI
- UIコンポーネントライブラリとして使用
- カスタムスタイルはCSS Modulesで適用

```typescript
import { Box, Flex, Text } from '@radix-ui/themes';

<Flex direction='column' gap='4'>
  <Text>コンテンツ</Text>
</Flex>
```

## 6. 状態管理

### 6.1 サーバー状態
- **React Query（TanStack Query）**: APIデータの管理
- **自動生成フック**: Orvalで生成されたフックを使用

### 6.2 クライアント状態
- **React Context**: グローバル状態（認証、テーマなど）
- **useState/useReducer**: ローカル状態

## 7. API統合とデータフェッチ

### 7.1 APIクライアント
- **自動生成**: `yarn orval`でOpenAPI仕様から生成
- **場所**: `src/api/generated/`（編集禁止）
- **カスタムインスタンス**: `src/api/custom-axios-instance.ts`

### 7.2 Server Componentでのデータフェッチ原則

#### 1. Request Memoization（リクエストメモ化）
```typescript
// ✅ 同一リクエスト内では自動でキャッシュされる
export async function getProject(id: string) {
  const response = await fetch(`/api/projects/${id}`);
  return response.json();
}

// 複数箇所で呼び出しても1回だけリクエストが実行される
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id); // 1回目のリクエスト
  
  return (
    <div>
      <ProjectHeader project={project} />
      <ProjectDetails projectId={params.id} /> {/* 内部でgetProject()を再度呼び出し */}
    </div>
  );
}
```

#### 2. N+1問題の回避
```typescript
// ❌ 避けるべきパターン - N+1問題が発生
export async function ProjectList() {
  const projects = await getProjects();
  
  return (
    <div>
      {projects.map(project => (
        <ProjectCardWithAuthor key={project.id} projectId={project.id} />
      ))}
    </div>
  );
}

export async function ProjectCardWithAuthor({ projectId }: { projectId: string }) {
  const author = await getProjectAuthor(projectId); // N回のリクエスト発生
  return <div>{author.name}</div>;
}

// ✅ 推奨パターン - 一括取得
export async function ProjectList() {
  const [projects, authors] = await Promise.all([
    getProjects(),
    getProjectAuthors() // 全著者を一括取得
  ]);
  
  return (
    <div>
      {projects.map(project => {
        const author = authors.find(a => a.id === project.authorId);
        return (
          <ProjectCard 
            key={project.id} 
            project={project} 
            author={author} 
          />
        );
      })}
    </div>
  );
}
```

#### 3. DataLoaderパターンの実装
```typescript
// lib/dataloader.ts
import DataLoader from 'dataloader';

const projectLoader = new DataLoader(async (ids: readonly string[]) => {
  const projects = await getProjectsByIds(Array.from(ids));
  return ids.map(id => projects.find(p => p.id === id));
});

export const loadProject = (id: string) => projectLoader.load(id);
```

### 7.3 Client Componentでのデータフェッチ

#### React Queryを活用したパターン
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';

export function InteractiveProjectList() {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <ProjectList projects={projects} />;
}
```

### 7.4 Server Actionsを活用したデータ変更
```typescript
// app/actions/project-actions.ts
'use server';

export async function createProject(formData: FormData) {
  const projectData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
  };
  
  // バリデーション
  if (!projectData.title) {
    throw new Error('タイトルは必須です');
  }
  
  // データ作成
  const project = await createProjectApi(projectData);
  
  // キャッシュの無効化
  revalidatePath('/projects');
  
  return project;
}

// Client Componentでの使用
'use client';
export function CreateProjectForm() {
  async function handleSubmit(formData: FormData) {
    try {
      await createProject(formData);
      // 成功処理
    } catch (error) {
      // エラー処理
    }
  }
  
  return (
    <form action={handleSubmit}>
      <input name="title" required />
      <textarea name="description" />
      <button type="submit">作成</button>
    </form>
  );
}
```

### 7.5 エラーハンドリング
```typescript
// カスタムフックを使用
const { getApiErrorMessage } = useApiError();

try {
  // API呼び出し
} catch (error) {
  const { text, callback } = getApiErrorMessage(error);
  // エラー処理
}

// Server Componentでのエラーハンドリング
export default async function ProjectPage({ params }: { params: { id: string } }) {
  try {
    const project = await getProject(params.id);
    return <ProjectDetail project={project} />;
  } catch (error) {
    // error.tsxやnot-found.tsxに委譲
    throw error;
  }
}
```

### 7.6 キャッシュ戦略

#### Static Rendering（静的レンダリング）
```typescript
// デフォルトで静的レンダリング
export default async function StaticProjectList() {
  const projects = await getProjects();
  return <ProjectList projects={projects} />;
}
```

#### Dynamic Rendering（動的レンダリング）
```typescript
// cookiesやheadersを使用すると自動的に動的レンダリング
import { cookies } from 'next/headers';

export default async function DynamicProjectList() {
  const cookieStore = cookies();
  const userPrefs = cookieStore.get('user-preferences');
  
  const projects = await getProjectsForUser(userPrefs?.value);
  return <ProjectList projects={projects} />;
}
```

#### Data Cache（データキャッシュ）
```typescript
// fetch()は自動的にキャッシュされる
export async function getProjects() {
  const response = await fetch('/api/projects', {
    next: { revalidate: 3600 } // 1時間でキャッシュを更新
  });
  return response.json();
}

// キャッシュを無効にする場合
export async function getRealTimeData() {
  const response = await fetch('/api/real-time', {
    cache: 'no-store'
  });
  return response.json();
}
```

## 8. ベストプラクティス

### 8.1 インポート順序
Biomeが自動整理するが、基本的な順序：
1. React/Next.js
2. 外部ライブラリ
3. 内部モジュール（絶対パス）
4. 相対パス
5. スタイル

### 8.2 条件付きレンダリング
```typescript
// 良い例
{isLoading && <LoadingSpinner />}
{!isLoading && projects.length > 0 && (
  <ProjectList projects={projects} />
)}

// 三項演算子も可
{isLoading ? <LoadingSpinner /> : <ProjectList />}
```

### 8.3 配列のマッピング
```typescript
{projects.map((project) => (
  <ProjectCard key={project.uuid} project={project} />
))}
```

### 8.4 イベントハンドラー命名
- `on`プレフィックスを使用: `onClick`, `onSubmit`, `onChange`
- Propsでは: `onSelectProject`, `onCloseSideBar`

### 8.5 カスタムフック
- `use`プレフィックスを使用
- `src/hooks/`に配置

```typescript
export const useApiError = () => {
  // フックのロジック
  return { getApiErrorMessage };
};
```

## 9. 品質管理

### 9.1 Linting & Formatting
```bash
yarn lint         # Biome linter実行
yarn format       # フォーマットチェック
yarn check        # lint + format
yarn check:fix    # 自動修正
```

### 9.2 Pre-commitフック
- Lefthookで自動実行
- コミット前に必ず`yarn check`が実行される

### 9.3 ビルドチェック
```bash
yarn build        # 本番ビルド（型チェック含む）
```

## 10. 注意事項

### 10.1 避けるべきパターン
- `any`型の使用
- 手動でのAPI型定義作成
- `src/api/generated/`の編集
- インラインスタイルの多用
- 不必要な`useEffect`

### 10.2 推奨パターン
- 生成されたAPI型の使用
- Radix UIコンポーネントの活用
- CSS Modulesでのスタイリング
- 適切なエラーバウンダリの実装
- Server Componentsの活用（可能な限り）
- データフェッチのコロケーション
- Request Memoizationの活用
- Suspenseとストリーミングの使用
- Container Firstアプローチの採用

## 11. Next.js App Router特有のベストプラクティス

### 11.1 Server Component純度の保持
```typescript
// ✅ 推奨 - Server Componentは純粋関数に保つ
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  
  // 純粋な関数として実装（副作用なし）
  return <ProjectDetail project={project} />;
}

// ❌ 避ける - Server Componentでの副作用
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  
  // 副作用は避ける（ログ出力、グローバル状態変更など）
  console.log('Project loaded:', project.id); // 避けるべき
  
  return <ProjectDetail project={project} />;
}
```

### 11.2 パフォーマンス最適化

#### React.memo、useMemo、useCallbackの使用指針
```typescript
// ✅ 推奨 - 重い計算のメモ化
const ExpensiveComponent = memo(function ExpensiveComponent({ 
  data 
}: { 
  data: ComplexData[] 
}) {
  const processedData = useMemo(() => {
    return data.map(item => heavyProcessing(item));
  }, [data]);

  return <div>{processedData}</div>;
});

// ✅ 推奨 - コールバック関数のメモ化（子コンポーネントへの不要な再レンダリング防止）
export function ProjectList({ projects }: { projects: Project[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);
  
  return (
    <div>
      {projects.map(project => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          onSelect={handleSelect}
          isSelected={selectedId === project.id}
        />
      ))}
    </div>
  );
}
```

### 11.3 アクセシビリティ（a11y）
```typescript
// ✅ 推奨 - セマンティックHTMLとARIA属性の使用
export function ProjectCard({ project, onSelect }: Props) {
  return (
    <article className={styles.card}>
      <header>
        <h3>{project.title}</h3>
      </header>
      <div className={styles.content}>
        <p>{project.description}</p>
      </div>
      <footer>
        <button 
          onClick={() => onSelect(project.id)}
          aria-label={`${project.title}を選択`}
        >
          選択
        </button>
      </footer>
    </article>
  );
}

// フォーカス管理の例
export function SearchInput({ onSearch }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // ページ読み込み時にフォーカス
    inputRef.current?.focus();
  }, []);
  
  return (
    <div role="search">
      <label htmlFor="search-input">プロジェクト検索</label>
      <input
        ref={inputRef}
        id="search-input"
        type="search"
        placeholder="キーワードを入力"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
}
```