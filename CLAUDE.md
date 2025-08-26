# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Supabase Authentication Starter App** built with Next.js, TypeScript, Tailwind CSS, and shadCN UI. The project serves as a foundational template for modern web applications requiring secure authentication with both email/password and OAuth (Google) support.

## Project Architecture

### Tech Stack
- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS, shadCN UI
- **Authentication**: NextAuth.js v5 with Supabase adapter
- **Database**: Supabase (PostgreSQL) with local development setup
- **Testing**: Jest + React Testing Library (unit), Playwright (e2e)
- **Development**: Docker for containerized development environment
- **Deployment**: Containerized with Docker

### Key Features
- Email/password authentication with verification
- Google OAuth integration
- Password reset functionality
- Protected routes and session management
- Responsive design with accessibility compliance
- Comprehensive test coverage (80% minimum)
- TDD development approach

## Specialized Agent System

This project uses a coordinated team of specialized agents, each handling specific aspects of development:

### Core Agents

#### @agent-project-organizer
- **Role**: Project coordination and task management
- **Responsibilities**: Optimize task sequencing, monitor progress, manage dependencies, ensure quality standards
- **Use when**: Need to coordinate multiple agents, optimize workflow, or manage project timeline

#### @agent-project-setup-specialist  
- **Role**: Infrastructure and project initialization
- **Responsibilities**: Next.js setup, TypeScript config, Docker, testing frameworks, shadCN UI
- **Tasks**: 1.1-1.9 (Project Setup and Infrastructure)
- **Use when**: Starting new projects or configuring development environment

#### @agent-supabase-integration
- **Role**: Database and backend services specialist
- **Responsibilities**: Local Supabase setup, database schema, OAuth providers, migrations
- **Tasks**: 2.1-2.9 (Supabase Integration and Database Configuration)
- **Use when**: Setting up authentication backend or database operations

#### Authentication System Agent (see `agents/authentication-system-agent.md`)
- **Role**: Security and authentication logic specialist
- **Responsibilities**: NextAuth.js configuration, security features, session management
- **Tasks**: 3.1-3.11 (Authentication System Implementation)
- **Use when**: Implementing authentication flows or security features

#### @agent-ui-component-developer
- **Role**: Frontend component and user interface specialist  
- **Responsibilities**: React components, responsive design, forms, navigation, accessibility
- **Tasks**: 4.1-4.14 (User Interface and Components Development)
- **Use when**: Building UI components, forms, or frontend features

#### @agent-testing-specialist
- **Role**: Quality assurance and test implementation
- **Responsibilities**: Unit tests, integration tests, e2e tests, coverage reporting
- **Tasks**: 5.1-5.14 (Testing Implementation and Documentation)
- **Use when**: Implementing tests or ensuring quality standards

## Agent Coordination Strategy

The agents work together following this optimized execution order:
1. **Foundation Phase**: Project Setup Specialist (infrastructure)
2. **Backend Phase**: Supabase Integration (database & auth setup)  
3. **Security Phase**: Authentication System Agent (NextAuth & security)
4. **Frontend Phase**: UI Component Developer (can run parallel with phase 3)
5. **Validation Phase**: Testing Specialist (runs continuously with TDD)

**Key Principle**: Each agent builds upon the previous agents' work, creating a cohesive system greater than its individual parts.

## Development Commands

```bash
# Development environment
docker-compose up              # Start full development environment
npm run dev                   # Start Next.js development server
npm run build                 # Build production application

# Testing
npm test                      # Run unit tests with Jest
npm run test:watch           # Run tests in watch mode  
npm run test:e2e             # Run Playwright e2e tests
npm run test:coverage        # Generate test coverage report

# Database
npx supabase start           # Start local Supabase instance
npx supabase db reset        # Reset database with fresh migrations
npx supabase gen types       # Generate TypeScript types

# Code Quality
npm run lint                 # Run ESLint
npm run type-check          # Run TypeScript compiler check
```

## Project Structure

```
├── app/                     # Next.js App Router pages
├── components/              # Reusable UI components
│   ├── ui/                 # shadCN UI components
│   └── *.tsx               # Feature components with tests
├── lib/                    # Utility libraries
│   ├── supabase.ts        # Supabase client configuration
│   └── auth.ts            # NextAuth.js configuration
├── agents/                 # Agent documentation and configs
├── tasks/                  # PRD and task management
├── tests/                  # End-to-end tests
├── supabase/              # Database migrations and config
└── docker-compose.yml     # Development environment
```

## Task Management

- **PRD**: See `tasks/prd-supabase-auth-starter.md` for complete requirements
- **Tasks**: See `tasks/tasks-prd-supabase-auth-starter.md` for detailed implementation tasks  
- **Progress**: Use @agent-project-organizer to coordinate and track progress across all agents

## Development Workflow

1. **Planning**: Use @agent-project-organizer to optimize task sequence
2. **Implementation**: Invoke appropriate specialized agents based on task category
3. **Integration**: Ensure agents coordinate at defined integration points
4. **Testing**: @agent-testing-specialist validates all implementations
5. **Quality Gates**: Each phase requires sign-off before proceeding to next

## Important Notes

- Follow TDD principles throughout development
- Maintain 80% minimum test coverage  
- All authentication must comply with OWASP security guidelines
- Ensure WCAG 2.1 accessibility compliance
- Use TypeScript strict mode with proper typing
- Container-first development approach with Docker