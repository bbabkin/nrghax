# NRGHax Discord Bot Development Guidelines

This document provides bot-specific guidelines that complement the main CLAUDE.md file.

## 🤖 Bot Architecture Overview

The NRGHax bot is a **multi-platform bot** with Discord as the primary platform and Slack as secondary. It serves as a community engagement tool for discovering energy hacks, tracking progress, and gamification.

## 📁 Bot Project Structure

```
/bot/
├── src/
│   ├── index.ts                 # Entry point - DO NOT modify bot initialization
│   ├── commands/                # Slash commands (follow BaseCommand pattern)
│   ├── platforms/               # Platform implementations (discord/, slack/)
│   ├── services/               # Business logic services
│   ├── handlers/               # Event and command handlers
│   ├── database/               # Supabase integration
│   ├── core/                   # Cross-platform abstractions
│   └── config/                 # Configuration and constants
├── test/                       # Vitest tests (fix mocks before adding tests)
├── docs/                       # Bot-specific documentation
├── logs/                       # Log files (gitignored)
└── ecosystem.config.js         # PM2 configuration
```

## 🎯 Development Patterns

### Adding New Commands

**ALWAYS** extend BaseCommand and follow the existing pattern:

```typescript
// ✅ CORRECT - Uses BaseCommand pattern
export class YourCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('yourcommand')
    .setDescription('Description here');

  async execute(interaction: CommandInteraction): Promise<void> {
    // Check cooldowns
    if (await this.isOnCooldown(interaction.user.id)) {
      return interaction.reply({
        content: 'Please wait before using this command again.',
        ephemeral: true
      });
    }

    // Your logic here with proper error handling
    try {
      // Implementation
    } catch (error) {
      await this.errorService.handle(error, interaction);
    }
  }
}

// ❌ WRONG - Direct implementation without base class
export const yourCommand = {
  data: new SlashCommandBuilder(),
  execute: async (interaction) => { /* ... */ }
}
```

### Service Implementation

Services should be **singleton classes** with dependency injection:

```typescript
// ✅ CORRECT - Singleton service pattern
export class YourService {
  private static instance: YourService;

  private constructor(
    private supabase: SupabaseClient,
    private errorService: ErrorService
  ) {}

  static getInstance(): YourService {
    if (!this.instance) {
      this.instance = new YourService(
        getSupabaseClient(),
        ErrorService.getInstance()
      );
    }
    return this.instance;
  }

  async performAction(): Promise<void> {
    try {
      // Implementation
    } catch (error) {
      await this.errorService.handle(error, {
        context: 'YourService.performAction'
      });
    }
  }
}
```

### Error Handling

**NEVER** let errors crash the bot:

```typescript
// ✅ CORRECT - Comprehensive error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  await this.errorService.handle(error, {
    severity: ErrorSeverity.MEDIUM,
    context: 'CommandName',
    userId: interaction.user.id
  });

  // User-friendly message
  await interaction.reply({
    content: 'Something went wrong. Please try again.',
    ephemeral: true
  });
}

// ❌ WRONG - Unhandled errors
const result = await riskyOperation(); // Can crash bot
```

## 🔐 Security Requirements

1. **Environment Variables**
   - NEVER commit tokens or secrets
   - Use `.env.example` as template
   - All secrets in `.env` (gitignored)

2. **Input Validation**
   - Sanitize ALL user inputs
   - Validate command arguments
   - Check permissions before actions

3. **Rate Limiting**
   - Respect Discord API limits
   - Implement command cooldowns (3s default)
   - Use exponential backoff for retries

## 🧪 Testing Requirements

### Current Test Issues
**WARNING**: Test suite has mock configuration issues (56% failing). Fix mocks before adding new tests.

### Test Pattern
```typescript
// Use happy-dom environment for Discord.js
describe('YourCommand', () => {
  let command: YourCommand;
  let mockInteraction: any;

  beforeEach(() => {
    // Setup mocks
    mockInteraction = createMockInteraction();
    command = new YourCommand();
  });

  it('should execute successfully', async () => {
    await command.execute(mockInteraction);
    expect(mockInteraction.reply).toHaveBeenCalled();
  });
});
```

## 🚀 Deployment

### Local Development
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your tokens

# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run tests (currently broken - fix mocks first)
npm test
```

### Production Deployment (PM2)
```bash
# Build the bot
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs nrghax-bot

# Restart
pm2 restart nrghax-bot
```

## ⚠️ Critical Rules

1. **NEVER** modify `src/index.ts` bot initialization without understanding the full impact
2. **ALWAYS** use the ErrorService for error handling
3. **ALWAYS** implement cooldowns on commands
4. **ALWAYS** test commands in development before deploying
5. **NEVER** use synchronous blocking operations
6. **ALWAYS** clean up intervals/timeouts on shutdown
7. **FOLLOW** the existing patterns for consistency

## 📊 Performance Guidelines

### Caching Strategy
- Use in-memory cache for frequently accessed data
- Default TTL: 5 minutes (300 seconds)
- Implement graceful fallback to stale cache on errors

### Database Queries
- Use connection pooling (already configured)
- Batch operations where possible
- Index frequently queried columns
- Avoid N+1 query problems

### Memory Management
- PM2 restart at 500MB (configured)
- Monitor memory leaks with `pm2 monit`
- Clean up event listeners properly
- Lazy load large datasets

## 🎮 Gamification Features (In Progress)

When implementing gamification:
1. Store all persistent data in Supabase
2. Sync achievements/XP with web app via webhooks
3. Use Discord roles for tier rewards
4. Implement daily challenge system via cron
5. Cache leaderboards aggressively (1 hour TTL)

## 🔄 Integration Points

### Supabase Sync
- Profile roles sync every 30 minutes (configurable)
- Real-time updates via webhooks (planned)
- Maintain data consistency between platforms

### Web App Integration
- Webhook receiver on `/webhook/discord` (to implement)
- Share user progress and achievements
- Unified user experience across platforms

## 📝 Documentation Requirements

When adding features:
1. Update command descriptions in code
2. Add user-facing documentation in `/bot/docs/`
3. Update this CLAUDE.md for development patterns
4. Document environment variables in `.env.example`

## 🚫 Common Pitfalls to Avoid

1. **Don't forget to register new commands** in `commandHandler.ts`
2. **Don't use console.log** - Use Winston logger instead
3. **Don't hardcode guild IDs** - Use environment variables
4. **Don't skip error boundaries** - Wrap all async operations
5. **Don't ignore rate limits** - Check headers and back off
6. **Don't create memory leaks** - Clean up listeners and intervals

## 🎯 Success Criteria for Bot Features

Every bot feature must:
- ✅ Handle errors without crashing
- ✅ Respond within 3 seconds
- ✅ Include user-friendly error messages
- ✅ Log all operations for debugging
- ✅ Respect Discord API rate limits
- ✅ Work across both Discord and Slack (if applicable)
- ✅ Include unit tests (once mocks are fixed)
- ✅ Follow existing code patterns

## 🔧 Troubleshooting

### Bot not responding to commands?
1. Check PM2 status: `pm2 status`
2. View logs: `pm2 logs nrghax-bot --lines 100`
3. Verify token in `.env`
4. Check Discord API status

### Memory issues?
1. Monitor with: `pm2 monit`
2. Check for event listener leaks
3. Review caching strategy
4. Increase PM2 memory limit if needed

### Test failures?
1. Known issue: Mock configuration needs fixing
2. Run specific test: `npm test -- [filename]`
3. Check test environment setup in `vitest.config.ts`

Remember: The bot is a user-facing service. Prioritize stability, performance, and user experience over feature complexity.