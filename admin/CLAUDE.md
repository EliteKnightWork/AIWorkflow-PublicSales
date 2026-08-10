# CLAUDE.md - Admin Panel

This file provides guidance for working with the **Admin Panel** component of Labid.

**Parent documentation:** See [`../CLAUDE.md`](../CLAUDE.md) for project overview, communication guidelines, and cross-component workflows.

## Component Overview

This is the admin panel for Labid, built using **Refine framework** with **React 18**, **Material-UI**, and **TypeScript**. It provides administrative operations for managing projects, companies, users, and proposals.

**Integration**: This admin panel consumes the Rails backend API admin endpoints (`/api/v1/admin/`) with API key authentication.

## Key Commands

### Development
```bash
# Install dependencies
yarn install

# Start development server (runs on http://localhost:8081)
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Format code with Prettier
yarn format
```

### Refine CLI
```bash
# Use Refine CLI tools
yarn refine
```

## Architecture Overview

### Core Technologies
- **React 18** with TypeScript
- **Refine Framework** - Admin panel framework with built-in CRUD operations
- **Material-UI (MUI)** - Component library and design system
- **Vite** - Build tool and development server
- **React Router v6** - Client-side routing

### Project Structure
- **Pages**: CRUD operations for each resource type in `src/pages/`
  - Projects: `src/pages/projects/` (list, create, edit, delete)
  - Companies: `src/pages/companies/`
  - Users: `src/pages/users/`
  - Hidden Projects: `src/pages/hidden_projects/`
  - Proposals: `src/pages/proposals/`
- **Data Providers**: Custom API integration in `src/providers/`
- **Models**: TypeScript interfaces in `src/models/`
- **Components**: Shared UI components in `src/components/`

### Data Provider Architecture
The app uses multiple custom data providers that extend Refine's simple-rest provider:
- `projectDataProvider` - Main projects with search, filtering, and CRUD
- `companiesDataProvider` - Company management
- `usersDataProvider` - User administration  
- `hiddenProjectDataProvider` - Hidden projects list
- `proposalsDataProvider` - Proposals management

Each provider connects to specific API endpoints under `/v1/admin/` routes.

### Authentication & API
- Uses admin API key authentication via `VITE_ADMIN_API_KEY` header
- Connects to backend API via `VITE_API_URL` environment variable
- Admin operations require `x-labid-admin-key` header

## Development Guidelines

### Component Patterns
- Follow Refine conventions for CRUD operations using `<List>`, `<Create>`, `<Edit>` components
- Use Material-UI DataGrid for table displays with custom column definitions
- Implement custom filtering and sorting through data provider query parameters
- Use React Hook Form for form handling

### Data Provider Customization
- Override `getList`, `getOne`, `create`, `update`, `deleteOne` methods as needed
- Handle FormData for file uploads (projects with attachments/screenshots)
- Implement custom search parameters and filtering logic
- Use proper error handling and validation

### File Upload Handling
Projects support file attachments and screenshots through FormData:
- Attachments: Multiple file upload for project documents
- Screenshots: Image files with source URL metadata
- Form data creation handled in `createProjectFormData` utility

### TypeScript Usage
- Strict TypeScript configuration enabled
- Define interfaces in `src/models/` for all data types
- Use proper typing for Refine hooks and components
- Avoid `any` types and use proper generic types

### Styling Approach
- Use Material-UI components and theming system
- Color mode context provider for theme switching
- Custom styling through MUI's sx props and styled components
- Responsive design with MUI's breakpoint system

## Environment Variables

Required environment variables (see `.env.sample`):
- `VITE_API_URL` - Backend API base URL (e.g., `http://localhost:3000`)
- `VITE_ADMIN_API_KEY` - Admin authentication key

## Common Workflows

### Adding a New Resource
1. Create model interface in `src/models/`
2. Create data provider in `src/providers/`
3. Add resource configuration to App.tsx resources array
4. Create pages in `src/pages/[resource]/` (list, create, edit, delete)
5. Add routes in App.tsx Routes section

### Customizing Data Operations
1. Extend the data provider in `src/providers/`
2. Override specific methods (getList, create, update, etc.)
3. Handle custom API parameters and response formats
4. Implement proper error handling and validation

### Adding Custom Filtering
1. Add filter UI components to list page
2. Update data provider `getList` method to handle new filter parameters
3. Map frontend filter values to backend API query parameters
4. Test filtering functionality with various combinations

## Build and Deployment

### Docker Build
The project includes a multi-stage Dockerfile:
- Uses Refine's Node.js base image
- Builds static assets with Vite
- Serves with nginx with Basic Authentication
- Configured for production with nginx user permissions

### Production Configuration
- nginx configuration in `nginx.conf`
- Basic authentication setup through Docker build args
- ECS task definitions in `ecs-task-definition/`
- Static file serving optimized for production

## Development Tools

### Code Quality
- Prettier for code formatting (`yarn format`)
- TypeScript strict mode for type checking
- ESLint configuration for code linting

### Debugging
- Vite dev server with hot reload
- React DevTools integration
- Refine DevTools panel for debugging data operations
- Browser console logging for data provider operations