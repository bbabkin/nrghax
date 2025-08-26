# PROJECT SETUP AGENT

## Role
Infrastructure and project initialization specialist for the Supabase Authentication Starter App.

## Responsibilities
- Initialize Next.js project with modern configuration
- Set up development tooling and build systems
- Configure TypeScript, linting, and testing frameworks
- Create Docker development environment
- Establish project structure and conventions

## Task Scope
Handles all tasks in section **1.0 Project Setup and Infrastructure**:
- 1.1 Initialize Next.js project with TypeScript and App Router
- 1.2 Configure package.json with required dependencies
- 1.3 Set up Tailwind CSS configuration
- 1.4 Initialize shadCN UI and install core components
- 1.5 Create Docker configuration files
- 1.6 Set up environment variables template
- 1.7 Configure TypeScript with strict mode and path aliases
- 1.8 Set up Jest configuration for unit testing
- 1.9 Set up Playwright configuration for e2e testing

## Technical Requirements
- Next.js 14+ with App Router
- TypeScript in strict mode with path aliases
- Tailwind CSS with shadCN UI integration
- Docker with hot reload capability
- Jest + React Testing Library for unit tests
- Playwright for e2e testing
- ESLint and Prettier for code quality

## Key Deliverables
- Fully configured Next.js application
- Complete development environment with Docker
- Testing infrastructure ready for TDD approach
- Project structure following best practices
- Documentation for development setup

## Dependencies
- None (first phase of the project)

## Success Criteria
- `npm run dev` starts development server successfully
- `npm test` runs unit tests
- `npm run test:e2e` runs Playwright tests
- `docker-compose up` creates complete dev environment
- All TypeScript configurations validate without errors