# Discord Bot Development Path

## Overview
This document outlines the incremental development path for the NrgHax Discord bot, providing specific PRD prompts that can be given to the discord-bot-developer agent to build the bot step by step.

## Development Philosophy
- **Incremental Building**: Each phase builds on the previous
- **Integration First**: Ensure Discord-Website sync from the start
- **User Experience Focus**: Follow the life hacker friend personality
- **Test as You Go**: Each phase should be fully tested before moving on

## Project Structure
```
nrghax/
├── src/app/              # Existing Next.js app
├── supabase/             # Existing database
├── nrgbot/          # New Discord bot (this project)
│   ├── src/
│   ├── tests/
│   └── package.json
└── shared/               # Shared types and utilities
```

## Phase 1: Foundation & Setup (Days 1-3)

### PRD Prompt 1.1 - Project Initialization
```
Create a Discord bot project in the nrgbot/ folder using TypeScript and Discord.js v14. 

Requirements:
1. Set up the project structure with proper TypeScript configuration
2. Create a .env.example with all needed environment variables
3. Implement basic bot initialization with slash command handler
4. Add a simple /ping command to verify bot is working
5. Include docker-compose.yml for local development
6. Use the bot personality from UX.md: life hacker friend, growth-focused, casual gaming language

Tech stack:
- Discord.js v14
- TypeScript
- Supabase client
- Node.js 18+

Folder structure should follow best practices for scalability.
```

### PRD Prompt 1.2 - Supabase Integration
```
Integrate the Discord bot with our existing Supabase database.

Requirements:
1. Set up Supabase client with service role key (for bot operations)
2. Create database schema migrations for Discord-specific tables:
   - Add discord_id, discord_username to profiles table
   - Create user_practices table for logging
   - Create xp_transactions table
3. Implement a /register command that links Discord account to Supabase user
4. Add middleware to check if user is registered before other commands
5. Create repository pattern for database operations

The bot should say things like "Let's link your accounts and start tracking those energy gains!" when registering.
```

## Phase 2: Core Gamification (Days 4-7)

### PRD Prompt 2.1 - Practice Logging System
```
Implement the /practice command for logging bioenergy practices.

Requirements:
1. Create /practice command with these options:
   - practice_type: Select menu (Energy Ball, Meditation, Aura Work, Shield, etc.)
   - duration: Number input (5-120 minutes)
   - notes: Optional text input
2. Calculate XP based on:
   - Base XP per practice type
   - Duration multiplier
   - Streak bonus (if practicing daily)
3. Show confirmation embed with:
   - XP earned
   - Total XP
   - Progress to next level
   - Motivational message ("Nice grind! You're 45 XP from leveling up!")
4. Store practice in database with timestamp
5. Sync with website via Supabase realtime

Bot personality: "Energy ball for 20 mins? That's some solid practice! +50 XP 🔥"
```

### PRD Prompt 2.2 - Level & Progress System
```
Implement /level and /streak commands to show user progress.

Requirements:
1. /level command shows:
   - Current level and title (Energy Novice, Apprentice, etc.)
   - XP progress bar (visual using Discord embeds)
   - Total XP and XP needed for next level
   - Unlocked abilities/hacks
   - Recent achievements
2. /streak command shows:
   - Current streak days
   - Longest streak
   - Streak freeze status
   - Next milestone reward
3. Implement level calculation (exponential curve, levels 1-60)
4. Add streak tracking with daily reset at midnight UTC
5. Include streak freeze mechanic (1 free per week)

Bot responses: "Level 12 Energy Apprentice! Your power level is over... well, 12! 📈"
```

## Phase 3: Daily Engagement (Days 8-11)

### PRD Prompt 3.1 - Quest System
```
Create the daily quest system with /quest command.

Requirements:
1. /quest command shows today's quests:
   - Main quest (practice specific technique)
   - Side quest (social interaction)
   - Bonus quest (challenge variant)
2. Quest structure:
   - Title, description, XP reward
   - Progress tracking (0/1 or 0/X)
   - Accept/Complete buttons
3. Daily quest rotation:
   - 3 new quests every day at midnight UTC
   - Quests chosen from pool based on user level
   - Different quests for different paths (Energy/Focus/Protection)
4. Quest completion:
   - Validate completion criteria
   - Award XP and special rewards
   - Show celebration embed
5. Store quest templates and user_quests in database

Bot personality: "Daily quests are live! Time to stack those gains 💪"
```

### PRD Prompt 3.2 - Scheduled Jobs & Notifications
```
Implement automated daily systems and notifications.

Requirements:
1. Set up cron jobs for:
   - Daily quest assignment (midnight UTC)
   - Streak checking and reset
   - Weekly challenge rotation
   - Power Hour random scheduling
2. DM notifications for:
   - Daily quest available (optional)
   - Streak about to break (23 hours since last practice)
   - Level up celebration
   - Achievement unlocked
3. Channel announcements for:
   - User level ups (configurable channel)
   - Breakthrough moments (user triggered)
   - Power Hour start
4. Implement notification preferences (users can opt in/out)
5. Use Discord embeds with consistent branding

Message style: "Yo! Your streak is at risk! Quick 5-minute practice to keep it alive?"
```

## Phase 4: Social Features (Days 12-15)

### PRD Prompt 4.1 - Partner System
```
Implement /partner command for accountability buddy matching.

Requirements:
1. /partner command with subcommands:
   - find: Match with compatible partner
   - status: View current partnership
   - end: End partnership
2. Matching algorithm based on:
   - Timezone compatibility
   - Practice preferences
   - Experience level
   - Active times
3. Partner features:
   - Shared progress dashboard
   - Partner practice notifications
   - Bonus XP for synchronized practices
   - Partner achievements
4. Partner chat features:
   - Quick reactions for encouragement
   - Practice together reminders
5. Store partnerships in database with status tracking

Bot message: "Found you a practice buddy! You and @User both dig evening sessions 🤝"
```

### PRD Prompt 4.2 - Leaderboards & Competition
```
Create /leaderboard and /challenge commands for competitive features.

Requirements:
1. /leaderboard command with filters:
   - Global, server, friends
   - Weekly, monthly, all-time
   - By XP, streak, or specific practice
2. Paginated embed display (10 per page)
3. /challenge command for community challenges:
   - View active challenges
   - Join challenge
   - Submit completion
   - Vote on others' submissions
4. Challenge types:
   - Speed runs (fastest to complete X)
   - Endurance (longest single practice)
   - Consistency (7-day perfect streak)
5. Rewards for top performers:
   - Special roles
   - Bonus XP
   - Exclusive hack unlocks

Bot personality: "The weekly leaderboard is spicy! You're 3 practices away from top 10 🏆"
```

## Phase 5: Advanced Content (Days 16-20)

### PRD Prompt 5.1 - Hack System
```
Implement /hack command for advanced technique unlocks.

Requirements:
1. /hack command with:
   - Browse: See all available hacks by category
   - View: Detailed info about specific hack
   - Unlock: Spend XP to unlock hack
   - Use: Activate unlocked hack
2. Hack categories:
   - Energy manipulation
   - Perception enhancement
   - Protection techniques
   - Social/telepathy
3. Hack details embed:
   - Name, description, requirements
   - XP cost or unlock criteria
   - Detailed instructions
   - Tips from community
   - Success rate stats
4. Progressive unlock system:
   - Some hacks require level
   - Others require specific achievements
   - Premium hacks need special currency
5. Track hack usage and success rates

Bot style: "Remote Viewing hack? That's some next-level stuff! Requires Level 25 and 500 Perception XP"
```

### PRD Prompt 5.2 - Achievement System
```
Create comprehensive achievement tracking and display.

Requirements:
1. Achievement categories:
   - Progress (levels, XP milestones)
   - Consistency (streaks, daily practices)
   - Social (helping others, partnerships)
   - Mastery (specific technique expertise)
   - Special (event participation, discoveries)
2. /achievements command:
   - View earned achievements
   - Browse all available
   - Progress towards next achievements
   - Showcase favorite achievements
3. Achievement notifications:
   - Auto-detect when earned
   - Celebration embed in channel
   - DM with details
   - Website sync
4. Achievement rewards:
   - XP bonuses
   - Special roles
   - Hack unlocks
   - Profile badges
5. Rare/secret achievements for special discoveries

Bot celebration: "ACHIEVEMENT UNLOCKED: Energy Master! You've practiced every technique! 🎯"
```

## Phase 6: Website Integration (Days 21-25)

### PRD Prompt 6.1 - Bidirectional Sync
```
Implement full website-Discord synchronization.

Requirements:
1. Real-time sync via Supabase:
   - Practice logs appear on both platforms
   - XP/level updates instantly
   - Achievement unlocks
   - Quest completions
2. Webhook endpoints:
   - Website → Discord notifications
   - Discord → Website activity feed
3. OAuth2 flow:
   - Login to website via Discord
   - Auto-link accounts
   - Permission management
4. Shared data consistency:
   - Single source of truth for user stats
   - Conflict resolution for simultaneous updates
   - Transaction logging for debugging
5. Cross-platform features:
   - Start practice on Discord, complete on website
   - View Discord stats on website dashboard
   - Website comments appear in Discord

Integration points from UX.md 60/40 split maintained.
```

### PRD Prompt 6.2 - Admin Dashboard
```
Create admin commands for bot management.

Requirements:
1. Admin-only slash commands:
   - /admin stats: Bot usage statistics
   - /admin user: View/modify user data
   - /admin quest: Manage quest pool
   - /admin announce: Server-wide announcements
2. Moderation features:
   - Reset user progress
   - Grant XP/achievements
   - Ban/timeout from bot features
   - View audit logs
3. Content management:
   - Add/edit hacks
   - Create custom quests
   - Modify XP rates
   - A/B test features
4. Monitoring dashboard:
   - Command usage metrics
   - Error rates
   - User engagement stats
   - Performance metrics
5. Backup and restore functionality

Only accessible to users with admin role.
```

## Phase 7: Polish & Optimization (Days 26-30)

### PRD Prompt 7.1 - Performance & Scaling
```
Optimize bot for production scale.

Requirements:
1. Implement caching layer:
   - Redis for frequently accessed data
   - In-memory cache for user sessions
   - Command cooldowns
2. Database optimization:
   - Connection pooling
   - Query optimization
   - Indexed fields
   - Batch operations
3. Rate limiting:
   - Per-user command limits
   - API rate limit handling
   - Graceful degradation
4. Error handling:
   - Comprehensive error logging
   - User-friendly error messages
   - Automatic recovery
   - Alert system for critical errors
5. Horizontal scaling preparation:
   - Stateless design
   - Sharding support
   - Load balancer ready

Maintain <200ms response time for all commands.
```

### PRD Prompt 7.2 - Testing & Documentation
```
Create comprehensive testing suite and documentation.

Requirements:
1. Testing coverage:
   - Unit tests for all services (>80% coverage)
   - Integration tests for Discord-Supabase flow
   - End-to-end tests for critical paths
   - Load testing for 1000+ concurrent users
2. Documentation:
   - README with setup instructions
   - API documentation for webhooks
   - User guide for all commands
   - Troubleshooting guide
   - Contributing guidelines
3. CI/CD pipeline:
   - Automated testing on PR
   - Staging environment deployment
   - Production deployment workflow
   - Rollback procedures
4. Monitoring setup:
   - Error tracking (Sentry)
   - Performance monitoring
   - Uptime monitoring
   - Usage analytics
5. Backup strategy:
   - Database backups
   - Configuration backups
   - Disaster recovery plan

Documentation should match the casual, helpful tone of the bot.
```

## Testing Strategy for Each Phase

### Phase Testing Checklist
Before moving to the next phase, ensure:
- [ ] All commands work as expected
- [ ] Database operations are successful
- [ ] Error cases are handled gracefully
- [ ] Bot personality is consistent
- [ ] Performance is acceptable (<500ms response)
- [ ] Integration with website works (if applicable)
- [ ] User feedback is positive

## Questions for Clarification

Before starting development, please clarify:

1. **Hosting**: Where will the bot be hosted? (VPS, cloud, serverless?)
2. **User Scale**: Expected number of users in first month?
3. **Premium Features**: Any paid tier considerations?
4. **Moderation**: How strict should content moderation be?
5. **Languages**: English only or multi-language support?
6. **Mobile**: Special considerations for mobile Discord users?
7. **Events**: Should the bot handle voice channel events?

## Success Metrics

Track these KPIs throughout development:
- User registration rate
- Daily active users
- Average session length
- Command usage frequency
- User retention (7-day, 30-day)
- Practice completion rate
- Social interaction rate
- Website ↔ Discord cross-usage

## Notes

- Each PRD prompt can be given independently to the discord-bot-developer agent
- Prompts are designed to be specific enough for implementation but flexible for optimization
- The personality and tone from UX.md should be maintained throughout
- Integration with the existing Next.js/Supabase setup is critical
- The 60/40 Discord/Website split should guide feature priorities