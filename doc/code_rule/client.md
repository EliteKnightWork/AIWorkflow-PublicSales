# Frontend Code Conventions

This document defines the code conventions for the Labid frontend (new_client).

## 1. General Coding Style

### 1.1 Formatting
- **Indentation**: 2 spaces
- **Line Length**: Maximum 100 characters
- **Quotes**: 
  - JavaScript/TypeScript: Single quotes `'`
  - JSX attributes: Single quotes `'`
- **Trailing Commas**: ES5 style (comma after last element in objects and arrays)
- **Semicolons**: Omitted (following Biome configuration)

### 1.2 File Naming Conventions
- **Component Files**: PascalCase (e.g., `ProjectCard.tsx`)
- **Other Files**: camelCase (e.g., `dateUtils.ts`)
- **Style Files**: `styles.module.css`
- **Type Definition Files**: `types.ts` or `types/index.ts`

## 2. Directory Structure

### 2.1 Basic Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (content)/         # Protected routes (auth required)
│   ├── _actions/          # Server Actions
│   ├── _components/       # Page-specific components
│   └── api/               # API routes
├── api/                   # API client configuration
│   ├── generated/         # Auto-generated code (DO NOT EDIT)
│   └── lib/               # API helper functions
├── components/            # Reusable UI components
├── context/               # React Context
├── hooks/                 # Custom hooks
├── lib/                   # Utility libraries
├── styles/                # Shared styles
└── utils/                 # Helper functions
```

### 2.2 Component Placement
- **Reusable Components**: `src/components/`
- **Page-Specific Components**: `src/app/_components/` or route-specific directories
- **Container/Presentational Separation**: Apply to complex components

## 3. TypeScript Conventions

### 3.1 Type Definitions
- **Strict Mode**: Enabled (configured in `tsconfig.json`)
- **any Type**: Prohibited in principle (legacy code exempted)
- **Type Imports**: Use `import type`

```typescript
// Good
import type { Project, Pagination } from '@/api/generated/models';

// Avoid
import { Project, Pagination } from '@/api/generated/models';
```

### 3.2 Props Type Definition
```typescript
// Basic pattern
type Props = {
  title: string;
  count?: number;
  onSubmit: (value: string) => void;
};
```

### 3.3 Interface vs Type Alias
- **Props**: Use `type`
- **Data Models**: Use generated API types (do not create manually)

## 4. React/Next.js Patterns

### 4.1 Component Exports
```typescript
// Named export (recommended)
export function ProjectCard({ project }: Props) {
  return <div>...</div>;
}

// Default export (for specific cases like page components)
export default function HomePage() {
  return <div>...</div>;
}
```

### 4.2 Server/Client Components Selection Principles
Reference: [Next.js Basic Principles](https://zenn.dev/akfm/books/nextjs-basic-principle)

#### Prioritize Server Components when:
- Data fetching is required
- SEO is important
- Need to reduce initial load time
- Accessing server-only resources

```typescript
// Server Component (default)
import { getProjects } from '@/api/projects';

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectList projects={projects} />;
}
```

#### Use Client Components when:
- Browser APIs are needed (localStorage, geolocation, etc.)
- Interactive features are required (onClick, onChange, etc.)
- React state or effects are needed

```typescript
// Client Component
'use client';
import { useState } from 'react';

export function InteractiveSearch() {
  const [query, setQuery] = useState('');
  // Interactive logic
}
```

### 4.3 Data Fetching Colocation Principles

#### 1. Place data fetching close to components
```typescript
// ❌ Avoid - fetching all data in parent component
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

// ✅ Recommended - each component fetches its own data
export default function ProjectsPage() {
  return (
    <div>
      <ProjectList /> {/* calls getProjects() internally */}
      <UserList />    {/* calls getUsers() internally */}
      <SettingPanel /> {/* calls getSettings() internally */}
    </div>
  );
}
```

#### 2. Concurrent Data Fetching
```typescript
// ✅ Fetch data concurrently
export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  // Use Promise.all for concurrent processing
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

### 4.4 Enhanced Container/Presentational Pattern

#### Container First Approach
```typescript
// containers/project-list/index.tsx - entry point
export { ProjectListContainer as default } from './container';

// containers/project-list/container.tsx - logic handler
export async function ProjectListContainer() {
  const projects = await getProjects(); // Data fetching in Server Component
  
  return <ProjectListPresentation projects={projects} />;
}

// containers/project-list/presentation.tsx - display handler
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

### 4.5 Composition Pattern
```typescript
// ✅ Recommended - leverage composition pattern
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

// Usage example
<ProjectLayout
  sidebar={<ProjectSidebar />}
  toolbar={<ProjectToolbar />}
>
  <ProjectContent />
</ProjectLayout>
```

### 4.6 Suspense and Streaming
```typescript
// ✅ Leverage Suspense for streaming
export default function ProjectsPage() {
  return (
    <div>
      <h1>Project List</h1>
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

## 5. Styling

### 5.1 CSS Modules
- **File Name**: `styles.module.css`
- **Class Names**: camelCase

```typescript
import styles from './styles.module.css';

<div className={styles.projectCard}>
  <p className={styles.title}>...</p>
</div>
```

### 5.2 Radix UI
- Used as UI component library
- Apply custom styles with CSS Modules

```typescript
import { Box, Flex, Text } from '@radix-ui/themes';

<Flex direction='column' gap='4'>
  <Text>Content</Text>
</Flex>
```

## 6. State Management

### 6.1 Server State
- **React Query (TanStack Query)**: API data management
- **Auto-generated Hooks**: Use hooks generated by Orval

### 6.2 Client State
- **React Context**: Global state (auth, theme, etc.)
- **useState/useReducer**: Local state

## 7. API Integration and Data Fetching

### 7.1 API Client
- **Auto-generation**: Generated from OpenAPI spec via `yarn orval`
- **Location**: `src/api/generated/` (DO NOT EDIT)
- **Custom Instance**: `src/api/custom-axios-instance.ts`

### 7.2 Server Component Data Fetching Principles

#### 1. Request Memoization
```typescript
// ✅ Automatically cached within the same request
export async function getProject(id: string) {
  const response = await fetch(`/api/projects/${id}`);
  return response.json();
}

// Only one request is made even when called multiple times
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id); // First request
  
  return (
    <div>
      <ProjectHeader project={project} />
      <ProjectDetails projectId={params.id} /> {/* getProject() called again internally */}
    </div>
  );
}
```

#### 2. Avoiding N+1 Problems
```typescript
// ❌ Avoid - N+1 problem occurs
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
  const author = await getProjectAuthor(projectId); // N requests made
  return <div>{author.name}</div>;
}

// ✅ Recommended - batch fetch
export async function ProjectList() {
  const [projects, authors] = await Promise.all([
    getProjects(),
    getProjectAuthors() // Fetch all authors at once
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

#### 3. DataLoader Pattern Implementation
```typescript
// lib/dataloader.ts
import DataLoader from 'dataloader';

const projectLoader = new DataLoader(async (ids: readonly string[]) => {
  const projects = await getProjectsByIds(Array.from(ids));
  return ids.map(id => projects.find(p => p.id === id));
});

export const loadProject = (id: string) => projectLoader.load(id);
```

### 7.3 Client Component Data Fetching

#### React Query Pattern
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';

export function InteractiveProjectList() {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <ProjectList projects={projects} />;
}
```

### 7.4 Server Actions for Data Mutations
```typescript
// app/actions/project-actions.ts
'use server';

export async function createProject(formData: FormData) {
  const projectData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
  };
  
  // Validation
  if (!projectData.title) {
    throw new Error('Title is required');
  }
  
  // Create data
  const project = await createProjectApi(projectData);
  
  // Cache invalidation
  revalidatePath('/projects');
  
  return project;
}

// Usage in Client Component
'use client';
export function CreateProjectForm() {
  async function handleSubmit(formData: FormData) {
    try {
      await createProject(formData);
      // Success handling
    } catch (error) {
      // Error handling
    }
  }
  
  return (
    <form action={handleSubmit}>
      <input name="title" required />
      <textarea name="description" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### 7.5 Error Handling
```typescript
// Use custom hook
const { getApiErrorMessage } = useApiError();

try {
  // API call
} catch (error) {
  const { text, callback } = getApiErrorMessage(error);
  // Error handling
}

// Server Component error handling
export default async function ProjectPage({ params }: { params: { id: string } }) {
  try {
    const project = await getProject(params.id);
    return <ProjectDetail project={project} />;
  } catch (error) {
    // Delegate to error.tsx or not-found.tsx
    throw error;
  }
}
```

### 7.6 Caching Strategies

#### Static Rendering
```typescript
// Static rendering by default
export default async function StaticProjectList() {
  const projects = await getProjects();
  return <ProjectList projects={projects} />;
}
```

#### Dynamic Rendering
```typescript
// Automatically dynamic when using cookies or headers
import { cookies } from 'next/headers';

export default async function DynamicProjectList() {
  const cookieStore = cookies();
  const userPrefs = cookieStore.get('user-preferences');
  
  const projects = await getProjectsForUser(userPrefs?.value);
  return <ProjectList projects={projects} />;
}
```

#### Data Cache
```typescript
// fetch() is automatically cached
export async function getProjects() {
  const response = await fetch('/api/projects', {
    next: { revalidate: 3600 } // Refresh cache every hour
  });
  return response.json();
}

// Disable cache when needed
export async function getRealTimeData() {
  const response = await fetch('/api/real-time', {
    cache: 'no-store'
  });
  return response.json();
}
```

## 8. Best Practices

### 8.1 Import Order
Biome auto-organizes, but basic order:
1. React/Next.js
2. External libraries
3. Internal modules (absolute paths)
4. Relative paths
5. Styles

### 8.2 Conditional Rendering
```typescript
// Good
{isLoading && <LoadingSpinner />}
{!isLoading && projects.length > 0 && (
  <ProjectList projects={projects} />
)}

// Ternary operator also acceptable
{isLoading ? <LoadingSpinner /> : <ProjectList />}
```

### 8.3 Array Mapping
```typescript
{projects.map((project) => (
  <ProjectCard key={project.uuid} project={project} />
))}
```

### 8.4 Event Handler Naming
- Use `on` prefix: `onClick`, `onSubmit`, `onChange`
- In Props: `onSelectProject`, `onCloseSideBar`

### 8.5 Custom Hooks
- Use `use` prefix
- Place in `src/hooks/`

```typescript
export const useApiError = () => {
  // Hook logic
  return { getApiErrorMessage };
};
```

## 9. Quality Control

### 9.1 Linting & Formatting
```bash
yarn lint         # Run Biome linter
yarn format       # Format check
yarn check        # lint + format
yarn check:fix    # Auto-fix
```

### 9.2 Pre-commit Hooks
- Auto-executed by Lefthook
- `yarn check` always runs before commit

### 9.3 Build Check
```bash
yarn build        # Production build (includes type checking)
```

## 10. Guidelines

### 10.1 Patterns to Avoid
- Using `any` type
- Creating API type definitions manually
- Editing `src/api/generated/`
- Excessive inline styles
- Unnecessary `useEffect`

### 10.2 Recommended Patterns
- Use generated API types
- Leverage Radix UI components
- Style with CSS Modules
- Implement proper error boundaries
- Utilize Server Components (when possible)
- Data fetching colocation
- Leverage Request Memoization
- Use Suspense and streaming
- Adopt Container First approach

## 11. Next.js App Router Specific Best Practices

### 11.1 Maintaining Server Component Purity
```typescript
// ✅ Recommended - keep Server Components as pure functions
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  
  // Implement as pure function (no side effects)
  return <ProjectDetail project={project} />;
}

// ❌ Avoid - side effects in Server Components
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  
  // Avoid side effects (logging, global state changes, etc.)
  console.log('Project loaded:', project.id); // Should be avoided
  
  return <ProjectDetail project={project} />;
}
```

### 11.2 Performance Optimization

#### React.memo, useMemo, useCallback Usage Guidelines
```typescript
// ✅ Recommended - memoize expensive calculations
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

// ✅ Recommended - memoize callback functions (prevent unnecessary re-renders of child components)
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

### 11.3 Accessibility (a11y)
```typescript
// ✅ Recommended - use semantic HTML and ARIA attributes
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
          aria-label={`Select ${project.title}`}
        >
          Select
        </button>
      </footer>
    </article>
  );
}

// Focus management example
export function SearchInput({ onSearch }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Focus on page load
    inputRef.current?.focus();
  }, []);
  
  return (
    <div role="search">
      <label htmlFor="search-input">Project Search</label>
      <input
        ref={inputRef}
        id="search-input"
        type="search"
        placeholder="Enter keywords"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
}
```