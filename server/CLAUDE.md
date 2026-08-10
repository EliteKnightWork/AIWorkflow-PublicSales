# CLAUDE.md - Backend API

This file provides guidance for working with the **Backend API** component of Labid.

**Parent documentation:** See [`../CLAUDE.md`](../CLAUDE.md) for project overview, communication guidelines, and cross-component workflows.

## Component Overview

This is the **Rails 8.0 Backend API** for Labid, providing RESTful API services with MySQL database, Elasticsearch search, and AI integrations. The backend serves both the main frontend application and the admin panel.

## Development Commands

### Database Operations
```bash
# Database management (using Makefile shortcuts)
docker compose exec app make db-create
docker compose exec app make db-migrate   # Applies both dev and test schemas
docker compose exec app make db-seed
docker compose exec app make db-setup     # Full reset: drop, create, migrate, seed

# Schema management (Ridgepole - NOT Rails migrations)
docker compose exec app bundle exec rake ridgepole:apply
docker compose exec app bundle exec rake ridgepole:apply RAILS_ENV=test
```

### Search Operations
```bash
# Elasticsearch index management
docker compose exec app make es-reset     # Reset all indices
docker compose exec app rails elasticsearch:update_index:project
docker compose exec app rails elasticsearch:update_index:awarded_project
```

### Testing
```bash
# Test environment setup (run once)
RAILS_ENV=test docker compose run --rm app rails db:create
RAILS_ENV=test docker compose run --rm app bundle exec rake ridgepole:apply
RAILS_ENV=test docker compose run --rm app rails elasticsearch:update_index:project
RAILS_ENV=test docker compose run --rm app rails elasticsearch:update_index:awarded_project

# Run tests
docker compose exec app bash
RAILS_ENV=test bundle exec rspec
RAILS_ENV=test bundle exec rspec spec/path/to/specific_spec.rb

# Test coverage (generates report in server/coverage/)
RAILS_ENV=test docker compose exec app bundle exec rspec
```

### Code Quality
```bash
# Linting and auto-fixing
docker compose exec app bundle exec rubocop
docker compose exec app bundle exec rubocop -a  # Auto-fix

# Security checks
docker compose exec app bundle exec brakeman
```

### Development & Debugging
```bash
# Rails console
docker compose exec app rails console

# View logs
docker compose logs -f app

# Background job monitoring
docker compose exec app bundle exec sidekiq

# Database console
docker compose exec db mysql -u root -p
```

## Backend Architecture

### Core Technologies
- **Rails 8.0** with Ruby 3.3.1
- **MySQL** database with Ridgepole for schema management (no Rails migrations)
- **Elasticsearch** with Japanese text analyzers for full-text search
- **Sidekiq** for background job processing
- **Auth0** JWT authentication via `JsonWebToken` library

### API Structure
- **Versioning**: `/api/v1/` for public APIs, `/api/v1/admin/` for admin APIs
- **OpenAPI Spec**: Defined in `openapi.yml`, validated via Committee gem
- **Serialization**: ActiveModelSerializers for consistent JSON responses
- **Authentication**: Auth0 JWT tokens with role-based access control

### Database & Schema
- **Schema Definition**: `db/Schemafile` (not Rails migrations)
- **Migration Command**: `bundle exec rake ridgepole:apply`
- **Test Environment**: Separate schema application required for RAILS_ENV=test

### Search & Indexing
- **Full-text Search**: Elasticsearch with Japanese morphological analysis
- **Index Management**: Separate indices for projects and awarded projects
- **Reindexing**: Manual reindex required after schema changes affecting search fields

### Background Processing
- **Job Queue**: Sidekiq with Redis backend
- **AI Processing**: OpenAI/Azure OpenAI integration for embeddings and text generation
- **File Processing**: S3/MinIO integration for document handling

### External Integrations
- **File Storage**: AWS S3 (production) / MinIO (local development)
- **Email**: SendGrid for transactional emails
- **Notifications**: Slack and Chatwork integrations
- **Monitoring**: Sentry for error tracking
- **Messaging**: AWS SQS for async communication

## Development Guidelines

### Code Organization
- **Controllers**: Follow patterns in `app/controllers/v1/` and `app/controllers/v1/admin/`
- **Services**: Complex business logic in `app/services/` directory
- **Models**: Use concerns in `app/models/concerns/` for shared functionality
- **Decorators**: Presentation logic in `app/decorators/` directory
- **Serializers**: JSON response formatting in `app/serializers/v1/`

### API Development Standards
- **OpenAPI Compliance**: All API responses must match `openapi.yml` spec exactly
- **Committee Validation**: Automatic request/response validation in tests
- **Versioning**: Use `/api/v1/` namespace for all public endpoints
- **Admin Endpoints**: Use `/api/v1/admin/` namespace with proper authentication
- **Error Handling**: Consistent error response format across all endpoints

### Database Patterns
- **Schema Management**: Use Ridgepole, never create Rails migrations
- **Model Concerns**: Leverage `*_searchable.rb` concerns for Elasticsearch integration
- **Transactions**: Complex multi-table operations in `app/models/transactions/`
- **Factories**: FactoryBot patterns for consistent test data generation

### Testing Practices
- **RSpec**: Comprehensive test coverage with FactoryBot fixtures
- **Request Specs**: API endpoint testing in `spec/requests/`
- **Model Specs**: Unit tests for business logic in `spec/models/`
- **Service Specs**: Testing complex operations in `spec/services/`
- **SimpleCov**: Maintain test coverage reports in `coverage/`

### Code Quality Standards
- **RuboCop**: Always run `bundle exec rubocop` before committing
- **Security**: Use `bundle exec brakeman` for security analysis
- **Performance**: Monitor N+1 queries and optimize database access
- **Documentation**: Update OpenAPI spec for all API changes

## Environment Variables

Required environment variables for backend (see `.env.sample`):

### Authentication & API
- `AUTH0_DOMAIN` - Auth0 tenant domain
- `AUTH0_AUDIENCE` - API audience identifier
- `AUTH0_BACKEND_CLIENT_ID` - Backend service client ID
- `AUTH0_BACKEND_CLIENT_SECRET` - Backend service client secret

### Database & Search
- `DATABASE_HOST=db` - MySQL host (Docker service name)
- `DATABASE_USERNAME` - MySQL username
- `DATABASE_PASSWORD` - MySQL password
- `ELASTICSEARCH_HOST` - Elasticsearch endpoint URL

### AI Services
- `OPENAI_API_KEY` - OpenAI API key (alternative to Azure)
- `AZURE_OPENAI_API_KEY` - Azure OpenAI API key
- `AZURE_OPENAI_API_VERSION` - Azure API version
- `AZURE_OPENAI_API_BASE` - Azure OpenAI endpoint

### File Storage
- `AWS_ACCESS_ID` - AWS access key ID (or MinIO for local)
- `AWS_ACCESS_KEY` - AWS secret access key (or MinIO for local)
- `AWS_REGION` - AWS region
- `AWS_BUCKET` - S3 bucket name

### Development & Seeding
- `DEV_USER_EMAIL` - Email for development user creation
- `RAILS_MASTER_KEY` - Rails credentials master key

## Backend Workflows

### Adding a New API Endpoint
1. **Update OpenAPI Spec**: Add endpoint definition to `openapi.yml`
2. **Create Controller**: Add controller in `app/controllers/v1/` (or `v1/admin/` for admin)
3. **Add Routes**: Update `config/routes.rb` with new route
4. **Create Serializer**: Add serializer in `app/serializers/v1/` if needed
5. **Write Tests**: Add RSpec tests in `spec/requests/`
6. **Run Tests**: Verify Committee validates request/response against OpenAPI spec
7. **Update Client**: Inform frontend team to regenerate API client

### Database Schema Changes
1. **Edit Schema**: Modify `db/Schemafile` (never use Rails migrations)
2. **Apply Changes**: Run `bundle exec rake ridgepole:apply`
3. **Test Environment**: Apply to test with `RAILS_ENV=test bundle exec rake ridgepole:apply`
4. **Update Models**: Modify model files, factories, and specs
5. **Reindex Search**: If search fields changed, run:
   ```bash
   docker compose exec app rails elasticsearch:update_index:project
   docker compose exec app rails elasticsearch:update_index:awarded_project
   ```

### Adding Background Jobs
1. **Create Job Class**: Add job in `app/jobs/`
2. **Define Queue**: Configure queue in `config/schedule.rb` if needed
3. **Add Tests**: Write RSpec tests in `spec/jobs/`
4. **Monitor**: Use Sidekiq web UI for job monitoring

### Search Index Management
1. **Update Searchable Concerns**: Modify `*_searchable.rb` files
2. **Update Index Settings**: Modify Elasticsearch mappings if needed
3. **Reindex Data**: Run reindex commands for affected models
4. **Test Search**: Verify search functionality works correctly

### Quality Assurance Workflow
```bash
# Before committing any backend changes
docker compose exec app bundle exec rubocop -a
RAILS_ENV=test docker compose exec app bundle exec rspec
docker compose exec app bundle exec brakeman
```

## Debugging & Development Tools

### Application Debugging
```bash
# View Rails logs
docker compose logs -f app

# Rails console for interactive debugging
docker compose exec app rails console

# Background job monitoring
docker compose exec app bundle exec sidekiq
# Or visit Sidekiq web UI (if configured)
```

### Database & Search Debugging
```bash
# Database console
docker compose exec db mysql -u root -p

# Elasticsearch queries
curl http://localhost:9200/_cat/indices
curl http://localhost:9200/projects/_search

# Check index health
curl http://localhost:9200/_cluster/health
```

### Testing & Coverage
```bash
# Test coverage report
RAILS_ENV=test docker compose exec app bundle exec rspec
# View coverage report: open server/coverage/index.html

# Run specific test files
RAILS_ENV=test docker compose exec app bundle exec rspec spec/models/project_spec.rb
```

### Performance Monitoring
- **Logs**: Monitor `log/development.log` for slow queries
- **Memory**: Use `rails console` with memory_profiler gem
- **N+1 Queries**: Enable bullet gem in development
- **Background Jobs**: Monitor Sidekiq queue sizes and processing times

## Backend Code Patterns

### Controller Organization
- **Public API**: `app/controllers/v1/` - User-facing endpoints
- **Admin API**: `app/controllers/v1/admin/` - Administrative endpoints  
- **Nested Resources**: `app/controllers/v1/bid_pipelines/tasks_controller.rb`
- **Settings**: `app/controllers/v1/settings/` - Configuration endpoints

### Model Architecture
- **Base Models**: Standard Rails models in `app/models/`
- **Concerns**: Shared behavior in `app/models/concerns/`
- **Search Functionality**: `*_searchable.rb` concerns for Elasticsearch
- **Complex Operations**: `app/models/transactions/` for multi-step operations

### Service Layer
- **Business Logic**: Complex operations in `app/services/`
- **External APIs**: Third-party integrations in `app/services/external/`
- **AI Processing**: OpenAI/Azure integrations in `app/services/ai/`

### Testing Patterns
- **Factories**: FactoryBot definitions in `spec/factories/`
- **Request Specs**: API testing in `spec/requests/`
- **Model Specs**: Unit tests in `spec/models/`
- **Service Specs**: Business logic tests in `spec/services/`