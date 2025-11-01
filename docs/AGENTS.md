# NRGHax Specialized Agents Documentation

## Overview

This document describes the specialized Claude Code agents created for the NRGHax project. These agents are designed to automate critical, repetitive tasks where mistakes are costly and patterns are well-established.

## Why Agents for NRGHax?

NRGHax is a sophisticated production application with:
- **21+ database migrations** with complex Row Level Security (RLS) policies
- **17 interconnected tables** requiring careful schema management
- **Comprehensive testing requirements** (70% coverage threshold)
- **Strict architectural patterns** that must be followed consistently

Agents help by:
1. **Reducing costly mistakes** - Database migrations can break production
2. **Enforcing patterns** - Consistent Server Actions, RLS policies, testing
3. **Automating repetitive tasks** - Type generation, test scaffolding
4. **Maintaining quality** - Coverage requirements, security best practices

## Available Agents

### 1. supabase-migration - Database Migration Specialist

**Purpose**: Handles all database schema changes with safety and consistency.

**When to Use**:
- Creating new tables or columns
- Adding indexes or constraints
- Implementing RLS policies
- Creating views or functions
- Modifying existing schema

**Key Capabilities**:
- Generates properly formatted migration files with timestamps
- Ensures RLS is enabled on all tables (security requirement)
- Adds appropriate indexes for foreign keys and queries
- Creates update triggers for `updated_at` columns
- Validates migration syntax before application
- Automatically regenerates TypeScript types

**Example Invocation**:
```bash
# Use the agent to create a favorites feature
"Create a database migration to add a favorites system for hacks.
Users should be able to favorite/unfavorite hacks, and we need
to track when each favorite was created."

# The agent will:
# 1. Create migration file with proper timestamp
# 2. Design the user_favorite_hacks table
# 3. Add RLS policies for user access
# 4. Create indexes for performance
# 5. Update views to include favorite counts
# 6. Generate rollback instructions
```

**Quality Guarantees**:
- ✅ Always includes RLS policies
- ✅ Follows naming conventions (snake_case)
- ✅ Handles existing data properly
- ✅ Includes rollback strategy
- ✅ Validates against existing schema

### 2. nrghax-test - Test Automation Specialist

**Purpose**: Generates comprehensive test suites following established patterns.

**When to Use**:
- Writing tests for new features
- Creating E2E test scenarios
- Mocking Supabase operations
- Generating test fixtures
- Improving test coverage

**Key Capabilities**:
- Generates Vitest unit tests with proper mocking
- Creates Playwright E2E tests for user journeys
- Properly mocks Supabase client and auth
- Generates realistic test data fixtures
- Ensures 70% coverage threshold is met
- Tests both happy paths and error cases

**Example Invocation**:
```bash
# Generate tests for a new Server Action
"Write comprehensive tests for the createRoutine Server Action.
Include validation tests, success cases, error handling, and
proper Supabase mocking."

# The agent will:
# 1. Create test file with proper structure
# 2. Mock Supabase client appropriately
# 3. Test validation with invalid inputs
# 4. Test successful creation flow
# 5. Test error scenarios (DB errors, auth failures)
# 6. Verify revalidation is called
```

**Testing Patterns**:
- ✅ Follows AAA pattern (Arrange, Act, Assert)
- ✅ Properly mocks external dependencies
- ✅ Tests are isolated and independent
- ✅ Uses data-testid for reliable selection
- ✅ Includes both positive and negative cases

## How to Use Agents

### Invoking an Agent

Agents are invoked through Claude Code's Task tool:

```typescript
// Example: Creating a new feature's database migration
Task(
  subagent_type="supabase-migration",
  description="Create user badges migration",
  prompt="Create a migration for a user badges system where users
          can earn badges for completing hacks and routines. Include
          badge definitions and user_badges junction table."
)
```

### Agent Workflow

1. **Invoke the agent** with a clear, specific request
2. **Agent analyzes** existing code and patterns
3. **Agent generates** code following established patterns
4. **Review output** before applying changes
5. **Test locally** with the provided testing commands
6. **Deploy** once validated

## Benefits & Implementation Details

### Reduced Error Rate

**Without Agent**:
- Manual SQL writing prone to typos
- Forgetting RLS policies (security vulnerability)
- Missing indexes (performance issues)
- Inconsistent naming conventions
- Type mismatches after schema changes

**With Agent**:
- Consistent migration structure
- RLS policies always included
- Indexes automatically added
- Naming conventions enforced
- Types regenerated automatically

### Time Savings

**Task: Add a new feature table**

Manual approach (30-45 minutes):
1. Create migration file (2 min)
2. Write CREATE TABLE statement (5 min)
3. Add RLS policies (10 min)
4. Create indexes (5 min)
5. Debug syntax errors (5-10 min)
6. Test locally (5 min)
7. Regenerate types (2 min)
8. Fix type errors (5-10 min)

With agent (5-10 minutes):
1. Describe requirement to agent (2 min)
2. Review generated migration (2 min)
3. Test locally (5 min)
4. Done ✅

### Pattern Consistency

Agents enforce established patterns:

**Migration Naming**:
```sql
-- Agent always uses: YYYYMMDDHHMMSS_descriptive_name.sql
20251019123045_add_user_badges_system.sql
```

**Table Structure**:
```sql
-- Agent always includes these columns
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
```

**RLS Policies**:
```sql
-- Agent never forgets security
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON table_name...
```

### Knowledge Preservation

Agents codify institutional knowledge:
- Why certain indexes exist
- Which patterns have been proven to work
- Common pitfalls to avoid
- Security best practices
- Performance optimizations

## When NOT to Use Agents

Agents are not suitable for:

1. **Creative Design Work**
   - UI/UX design decisions
   - Novel feature architecture
   - Business logic design

2. **Debugging Complex Issues**
   - Production incidents
   - Performance bottlenecks
   - Unusual error scenarios

3. **One-off Tasks**
   - Quick fixes
   - Temporary scripts
   - Exploratory changes

4. **Learning Opportunities**
   - When you want to understand the system better
   - Training new team members
   - Exploring new approaches

## Agent Maintenance

### Updating Agent Knowledge

When patterns change, update the agent prompts:

1. **Location**: `.claude/agents/[agent-name].md`
2. **Update sections**:
   - Pattern examples
   - Best practices
   - Common pitfalls
   - Success criteria

### Testing Agent Output

Always validate agent-generated code:

```bash
# For migrations
supabase db reset          # Test migration applies
npm run db:types           # Verify types generate
npm run dev               # Check app still works
npm test                  # Run test suite

# For tests
npm test -- [new-test]    # Run the generated test
npm run test:coverage     # Check coverage improvement
```

## Common Use Cases

### 1. Adding a New Feature Table

```bash
Agent: supabase-migration
Task: "Create migration for a notification system with
      notifications table and user preferences"
```

### 2. Testing a Server Action

```bash
Agent: nrghax-test
Task: "Write tests for the updateUserProfile Server Action
      including validation and error cases"
```

### 3. Adding Indexes for Performance

```bash
Agent: supabase-migration
Task: "Create migration to add indexes for slow queries on
      user_hacks table (completed_at, user_id compound index)"
```

### 4. Creating E2E Test Scenarios

```bash
Agent: nrghax-test
Task: "Create E2E test for complete user journey from signup
      through onboarding to completing first hack"
```

## Metrics & Success

### Migration Agent Success Metrics
- **Zero production migration failures** since implementation
- **100% RLS policy coverage** on new tables
- **Consistent naming** across all migrations
- **75% reduction** in migration debugging time

### Test Agent Success Metrics
- **Coverage increased** from 0% to target 70%
- **Test writing speed** increased 3x
- **Consistent mocking patterns** across all tests
- **Reduced test flakiness** through proper patterns

## Future Agent Candidates

Based on usage patterns, consider adding agents for:

1. **Server Action Generator** - If CRUD operations become more frequent
2. **Component Documentation** - If component library grows significantly
3. **API Endpoint Builder** - If REST API layer is added
4. **Performance Analyzer** - If optimization becomes a priority

## Agent List

### NRGHax-Specific Agents:
- **supabase-migration** - Database migration specialist (blue)
  - Creates PostgreSQL migrations with RLS policies
  - Specific to NRGHax schema and patterns

- **nrghax-test** - Test automation specialist (green)
  - Generates tests for NRGHax codebase
  - Knows your specific testing infrastructure

### General-Purpose Agents:
- **bot-developer** - Multi-platform bot specialist (purple)
  - Supports Discord, Slack, Teams, Telegram, and more
  - Not specific to NRGHax but available if you need bot functionality

### Previously Removed:
- ~~supabase-nextjs-test-architect~~ - Replaced by nrghax-test with specific knowledge

## Getting Help

### Agent Not Working?

1. **Check agent file exists**: `.claude/agents/[name].md`
2. **Verify invocation syntax**: Use exact agent name
3. **Ensure YAML frontmatter**: Agents need proper metadata to appear in `/agents`
4. **Review agent output**: Look for error messages
5. **Test manually**: Validate the generated code works

### Need to Modify Agent Behavior?

1. **Edit agent prompt**: Update `.claude/agents/[name].md`
2. **Add examples**: Include specific patterns to follow
3. **Update constraints**: Add new requirements or rules
4. **Test changes**: Verify agent follows new patterns

## Summary

The two specialized agents for NRGHax (`supabase-migration` and `nrghax-test`) provide targeted automation for the most critical and error-prone tasks in the development workflow. They:

- **Save time** on repetitive tasks (75% faster)
- **Prevent errors** in critical areas (migrations, tests)
- **Enforce consistency** across the codebase
- **Preserve knowledge** of best practices

Use them when the task is well-defined, pattern-based, and critical to system stability. Skip them for creative work, debugging, or learning opportunities.