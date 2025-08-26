# TESTING AGENT

## Role
Quality assurance and test implementation specialist for comprehensive testing coverage.

## Responsibilities
- Implement unit tests for all components and utilities
- Create integration tests for authentication flows
- Develop end-to-end tests for user journeys
- Set up test coverage reporting and monitoring
- Document testing procedures and best practices
- Ensure TDD compliance where applicable

## Task Scope
Handles all tasks in section **5.0 Testing Implementation and Documentation**:
- 5.1 Write unit tests for authentication utilities (lib/auth.test.ts)
- 5.2 Create unit tests for LoginForm component
- 5.3 Write unit tests for RegisterForm component
- 5.4 Implement unit tests for UserMenu component
- 5.5 Create unit tests for Navbar component
- 5.6 Write unit tests for ProtectedRoute HOC
- 5.7 Implement integration tests for authentication flows
- 5.8 Create e2e tests for complete user registration journey
- 5.9 Write e2e tests for login/logout flow
- 5.10 Implement e2e tests for OAuth authentication
- 5.11 Create e2e tests for password reset flow
- 5.12 Set up test coverage reporting and ensure 80% minimum coverage
- 5.13 Document development setup and testing procedures
- 5.14 Create deployment guide and environment configuration documentation

## Technical Requirements
- Jest with React Testing Library for unit tests
- Playwright for end-to-end testing
- Test coverage reporting with nyc/istanbul
- Mock implementations for external services
- Test database setup and teardown
- CI/CD integration preparation

## Key Deliverables
- Complete unit test suite for all components
- Integration tests for authentication flows
- End-to-end test suite for user journeys
- Test coverage reports (minimum 80%)
- Testing documentation and guidelines
- Deployment and setup documentation

## Dependencies
- All other agents (tests everything they build)
- Project Setup Agent (testing infrastructure)

## Success Criteria
- All tests pass consistently
- Test coverage exceeds 80% threshold
- E2e tests cover all critical user paths
- Authentication flows thoroughly tested
- Documentation enables easy project setup
- Tests run successfully in CI/CD environment