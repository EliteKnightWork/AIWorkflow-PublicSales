# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Guidelines

**All conversations with users should be conducted in Japanese**, while maintaining CLAUDE.md documentation in English for consistency.

**This CLAUDE.md should be updated as needed** throughout development to reflect changes in project structure, workflows, and best practices.

## Project Overview

Labid is an AI-powered public bidding search service with three main components:
- **Backend API** (Rails 8.0) - RESTful API server with MySQL, Elasticsearch, and AI integrations
- **Frontend** (Next.js 14) - Main user interface with App Router, React 19 RC, TypeScript
- **Admin Panel** (React 18 + Refine) - Administrative interface using Material-UI

**Component-specific documentation:**
- Backend details: See [`server/CLAUDE.md`](./server/CLAUDE.md)
- Frontend details: See [`new_client/CLAUDE.md`](./new_client/CLAUDE.md)
- Admin panel details: See [`admin/CLAUDE.md`](./admin/CLAUDE.md)

## Coding Workflow

**This workflow applies specifically to coding tasks. For non-coding tasks (research, documentation, analysis), use appropriate methods as needed.**

When implementing code changes, follow this structured approach:

1. **Investigation**: Research related files, dependencies, and existing patterns
2. **Planning**: Carefully plan the approach and implementation strategy
3. **Code Convention Review**: Review component-specific conventions (see component CLAUDE.md files)
4. **Implementation**: Code according to the planned approach and established conventions
5. **Verification**: Confirm that the implementation meets the intended requirements and follows coding standards

## Quick Start Commands

### Start All Services
```bash
# Start all services (from project root)
docker compose up -d
```

### Component-Specific Development
```bash
# Backend development (see server/CLAUDE.md for details)
docker compose exec app rails console
docker compose exec app make db-setup

# Frontend development (see new_client/CLAUDE.md for details)  
cd new_client && yarn dev

# Admin panel development (see admin/CLAUDE.md for details)
cd admin && yarn dev
```

### Quality Checks (Pre-commit)
```bash
# Backend
docker compose exec app bundle exec rubocop
RAILS_ENV=test docker compose exec app bundle exec rspec

# Frontend
cd new_client && yarn check && yarn build

# Admin
cd admin && yarn format && yarn build
```

## Architecture Overview

### System Components
- **Backend API** (Rails 8.0): RESTful API with MySQL, Elasticsearch, Auth0 JWT authentication
- **Frontend** (Next.js 14): User interface with App Router, React 19 RC, TypeScript
- **Admin Panel** (React 18 + Refine): Administrative interface with Material-UI

### Key Integrations
- **Auth0**: User authentication and JWT management
- **Elasticsearch**: Full-text search with Japanese analyzers  
- **OpenAI/Azure OpenAI**: AI features including embeddings and text generation
- **AWS S3/MinIO**: File storage (MinIO for local development)
- **External APIs**: SendGrid, Slack, Chatwork, AWS SQS, Sentry

**For detailed architecture information, see component-specific CLAUDE.md files.**

## Development Guidelines

### General Principles
- **Follow existing patterns**: Mimic code style, naming conventions, and architectural patterns
- **Reuse common functions/components**: Leverage existing utilities and extend when needed
- **Maintain OpenAPI spec compliance**: All API changes must update `openapi.yml`
- **Run quality checks before commits**: Use linting, formatting, and testing tools
- **Adhere to coding conventions**: Follow component-specific coding standards (see component CLAUDE.md files)

### Cross-Component Integration
- **API Changes**: Update OpenAPI spec → regenerate frontend client → test integration
- **Authentication**: Auth0 JWT tokens used across all components
- **Data Flow**: Backend API → Frontend/Admin via generated clients

**For component-specific guidelines, see:**
- Backend: [`server/CLAUDE.md`](./server/CLAUDE.md)
- Frontend: [`new_client/CLAUDE.md`](./new_client/CLAUDE.md) (includes mandatory code conventions)
- Admin: [`admin/CLAUDE.md`](./admin/CLAUDE.md)

## Environment Variables

### Shared Configuration
- **Auth0**: Domain, client IDs, audience (used across all components)
- **API URLs**: Backend API endpoint configuration
- **AI Services**: OpenAI/Azure OpenAI API keys for AI features

**For complete environment variable lists, see component-specific CLAUDE.md files.**

## Common Workflows

### Cross-Component API Development
1. **Update API spec**: Modify `openapi.yml` with new endpoint
2. **Backend implementation**: Create controller, routes, tests (see `server/CLAUDE.md`)
3. **Frontend integration**: Run `yarn orval` in `new_client/` to regenerate client
4. **Admin integration**: Update data providers if needed (see `admin/CLAUDE.md`)
5. **Validation**: Verify Committee validates request/response against spec

### Full System Setup
1. **Environment**: Copy `.env.sample` files in each component directory
2. **Services**: Run `docker compose up -d` from project root
3. **Database**: Run `docker compose exec app make db-setup`
4. **Frontend**: Run `cd new_client && yarn install && yarn dev`
5. **Admin**: Run `cd admin && yarn install && yarn dev`

**For component-specific workflows, see respective CLAUDE.md files.**

## Development Services

### Local URLs
- **Backend API**: `http://localhost:3000`
- **Frontend**: `http://localhost:8080`  
- **Admin Panel**: `http://localhost:8081`
- **API Documentation**: `http://localhost:8082` (after `docker compose up swagger-ui`)
- **Elasticsearch**: `http://localhost:9200`

### Key Development Commands
```bash
# View logs
docker compose logs -f app

# Access Rails console  
docker compose exec app rails console

# Database access
docker compose exec db mysql -u root -p
```

**For detailed debugging and patterns, see component-specific CLAUDE.md files.**