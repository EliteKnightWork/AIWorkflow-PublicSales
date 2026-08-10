# CLAUDE.md - Frontend Client

This file provides guidance for working with the **Frontend Client** component of Labid.

**Parent documentation:** See [`../CLAUDE.md`](../CLAUDE.md) for project overview, communication guidelines, and cross-component workflows.

## Code Conventions

**🚨 MANDATORY: Before implementing any frontend code, always review and follow the coding conventions defined in [`../doc/code_rule/client.md`](../doc/code_rule/client.md).**

This includes:
- TypeScript patterns and best practices
- React/Next.js component patterns (Server/Client Components, data fetching, etc.)
- Styling guidelines (CSS Modules + Radix UI)
- State management patterns
- API integration best practices
- Performance optimization guidelines
- Accessibility standards

## Component Overview

This is the main frontend client for **Labid**, built with **Next.js 14**, **App Router**, **React 19 RC**, and **TypeScript**. It provides the primary user interface for browsing and managing public bidding information.

**Integration**: This frontend consumes the Rails backend API and integrates with Auth0 for authentication.

## Key Commands

### Development
```bash
yarn dev          # Start development server on http://localhost:8080
yarn build        # Build for production
yarn start        # Start production server
```

### Code Quality
```bash
yarn lint         # Run Biome linter
yarn lint:fix     # Auto-fix linting issues
yarn format       # Check code formatting
yarn format:fix   # Auto-fix formatting
yarn check        # Run both lint and format checks
yarn check:fix    # Auto-fix both lint and format issues
```

### API Client Generation
```bash
yarn orval        # Generate API client from OpenAPI spec (../openapi.yml)
```

## Architecture Overview

### Frontend Stack
- **Next.js 14** with App Router and Server Components
- **React 19 RC** with TypeScript (strict mode)
- **Styling**: CSS Modules with Radix UI components
- **State Management**: React Query (TanStack Query) for server state
- **Authentication**: Auth0 integration via @auth0/nextjs-auth0
- **API Client**: Auto-generated using Orval from OpenAPI spec
- **Code Quality**: Biome for linting and formatting

### Key Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@auth0/nextjs-auth0**: Authentication with Auth0
- **@radix-ui/**: UI component library (dialogs, checkboxes, themes, etc.)
- **@dnd-kit/**: Drag-and-drop functionality for bid pipeline management
- **dayjs**: Date manipulation
- **framer-motion**: Animations
- **axios**: HTTP client (configured in custom-axios-instance.ts)

### Project Structure
```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (content)/         # Protected content routes (requires auth)
│   ├── _actions/          # Server actions
│   ├── _components/       # Page-specific components
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── api/                   # API client configuration
│   ├── generated/         # Auto-generated API client (DO NOT EDIT)
│   ├── custom-axios-instance.ts
│   └── axiosClientProvider.ts
├── components/            # Reusable UI components
├── context/               # React contexts for global state
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── styles/                # Shared CSS
└── utils/                 # Helper functions
```

## Development Guidelines

**Note:** Detailed coding patterns, component organization, styling guidelines, and best practices are documented in the [Frontend Code Conventions](../doc/code_rule/client.md). Always refer to that document for implementation details.

### Quick Reference
- **Authentication**: Auth0 integration via `@auth0/nextjs-auth0` with middleware protection
- **API Client**: Auto-generated via Orval from OpenAPI spec (regenerate with `yarn orval`)
- **State Management**: React Query for server state, React Context for global client state
- **Styling**: CSS Modules + Radix UI components
- **Code Quality**: Biome for linting/formatting (run `yarn check` before commits)

## Environment Variables

Required environment variables (see `.env.sample`):

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000  # Backend API URL
NEXT_PUBLIC_CLIENT_BASE_URL=http://localhost:8080

# Auth0 Configuration
AUTH0_SECRET=                    # Auth0 secret key
APP_BASE_URL=                  # Application base URL
AUTH0_DOMAIN=           # Auth0 domain
AUTH0_CLIENT_ID=                 # Auth0 client ID
AUTH0_CLIENT_SECRET=             # Auth0 client secret  
AUTH0_AUDIENCE=                  # Auth0 API audience
AUTH0_SESSION_AUTO_SAVE=         # Session auto-save setting

# Feature Flags
NEXT_PUBLIC_MAINTENANCE_MODE=false  # Enable maintenance mode
ADMIN_IPS=                          # Comma-separated IPs allowed during maintenance
```

## Common Workflows

**Note:** Detailed implementation patterns are in the [Frontend Code Conventions](../doc/code_rule/client.md).

### Adding New API Endpoints
1. Update `../openapi.yml` with new endpoint specification
2. Run `yarn orval` to regenerate API client
3. Use generated hooks following React Query patterns
4. Handle errors using established error handling patterns

### Creating New Components
1. Follow directory structure guidelines in code conventions
2. Use established TypeScript patterns and naming conventions
3. Apply CSS Modules + Radix UI styling patterns
4. Follow component export patterns (named vs default exports)

### Working with Authentication
- **Protected Pages**: Place under `src/app/(content)/` directory
- **Auth Integration**: Use Auth0 patterns documented in conventions
- **Route Protection**: Via `src/middleware.ts` configuration

## Build and Deployment

### Local Development
- Development server runs on port 8080 (configured in package.json)
- Hot reloading enabled for rapid development
- TypeScript checking in development mode

### Production Build
- Built using Next.js optimizations
- Static assets optimized automatically
- Docker build available via Dockerfile
- Deployment configuration in `ecs-task-definition/`

## Code Quality and Git Hooks

### Pre-commit Checks
- **Lefthook**: Git hooks configured for pre-commit checks
- **Biome**: Automatic linting and formatting
- **TypeScript**: Type checking during build

### Best Practices
**Refer to [Frontend Code Conventions](../doc/code_rule/client.md) for comprehensive best practices. Key points:**
- Always run `yarn check` before committing
- Use generated API types exclusively
- Follow established patterns for components, styling, and state management
- Implement proper error boundaries and accessibility standards

## Integration with Backend

### API Communication
- **Base URL**: Configured via `NEXT_PUBLIC_API_BASE_URL`
- **Authentication**: Automatic token handling via Auth0 middleware
- **CORS**: Credentials included in requests
- **Error Handling**: Centralized via custom hooks and React Query

### OpenAPI Integration
- **Spec Location**: `../openapi.yml` in parent directory
- **Code Generation**: Automatic via Orval configuration
- **Type Safety**: Full TypeScript coverage for API calls
- **Validation**: Request/response validation handled by backend