# Product Requirements Document: Discord Bot Foundation

## Introduction/Overview

The NrgHax Discord bot serves as a critical bridge between the NRGhax web platform and the Discord community, acting as an essential sidekick for users on their bioenergy journey. This foundation phase establishes the core infrastructure, basic command handling, and initial Supabase integration to enable seamless synchronization between Discord and the web platform.

## Goals

1. Establish a robust, scalable Discord bot infrastructure using TypeScript and Discord.js v14
2. Create bidirectional sync between Discord roles and NRGhax user profiles
3. Implement basic hack display functionality accessible in both DMs and server channels
4. Set up comprehensive error handling with admin notifications
5. Ensure the bot embodies the "life hacker friend" personality from UX.md

## User Stories

1. **As a Discord user**, I want to view NRGhax through the bot so that I can learn techniques without leaving Discord.
2. **As a community member**, I want my Discord roles to sync with my NRGhax profile so that my progress is recognized across platforms.
3. **As an NRGhax user**, I want my web achievements to reflect in Discord so that the community sees my progression.
4. **As a server admin**, I want to receive error notifications via DM so that I can quickly address bot issues.
5. **As any user**, I want to interact with the bot in both DMs and channels so that I can choose my preferred interaction method.

## Functional Requirements

### Core Infrastructure
1. The system must initialize a TypeScript project with Discord.js v14 in the `/nrgbot` folder
2. The system must implement a modular slash command handler supporting both global and guild commands
3. The system must support command execution in both DMs and server channels
4. The system must include a `/ping` command that responds with latency information
5. The system must use environment variables for all sensitive configuration

### Database Integration
6. The system must establish connection to Supabase using the service role key
7. The system must sync Discord user IDs with the existing profiles/users table
8. The system must read from the existing hacks table to display hack information
9. The system must implement a repository pattern for all database operations
10. The system must handle database connection failures gracefully

### Hack Display Feature
11. The system must implement a `/hack` command to display available energy hacks.
12. The system must show hack details including name, description, and requirements
13. The system must paginate results when displaying multiple hacks
14. The system must use Discord embeds with consistent branding for hack display

### Role Synchronization
15. The system must detect role changes in Discord and update the user's NRGhax profile
16. The system must check NRGhax profiles periodically and update Discord roles accordingly
17. The system must handle role sync conflicts with a clear resolution strategy
18. The system must log all role synchronization events for debugging

### Error Handling & Monitoring
19. The system must DM designated admins when critical errors occur
20. The system must log all errors with timestamps and context
21. The system must implement retry logic for failed database operations
22. The system must provide health check endpoints for monitoring

### Development Environment
23. The system must include a docker-compose.yml for local development
24. The system must provide a .env.example with all required environment variables
25. The system must include TypeScript configuration optimized for Discord bot development

## Non-Goals (Out of Scope)

- User onboarding flows or tutorials
- Quest systems or gamification features beyond hack display
- Complex user interaction features (reactions, buttons, modals)
- Voice channel functionality
- Advanced moderation features
- Payment or premium tier handling
- Multi-language support
- Webhook integrations with external services
- Custom emoji or sticker management
- Analytics or metrics dashboards

## Design Considerations

### Bot Personality
- Responses should embody a "life hacker friend" tone: encouraging, growth-focused, using casual, easy to understand and follow. yet intelligent language
- Example responses:
  - "Hel! Here's that energy hack you wanted to level up with! 🚀"
  - "Connection hiccup, but we're back online! Let's get those gains!"
  - "Your roles just synced! Your experience has become more personalized."

### Visual Design
- Use consistent embed colors matching the NRGhax brand
- Include footer text crediting "NRGhax × Discord"
- Use clear, readable formatting for hack descriptions
- Implement progress bars or visual indicators where applicable

## Technical Considerations

### Architecture
- Use a modular architecture with separate services for commands, database, and Discord operations
- Implement dependency injection for better testability
- Use TypeScript interfaces for all data models
- Follow Discord.js best practices for performance (caching, rate limit handling)

### Deployment (Self Host)
- Implement a self-hosting solution and provide a detailed documentation on how to run it on a computer (raspberry pi 5)

### Database Schema Requirements
- Expects existing `profiles` or `users` table with fields for discord_id and discord_roles
- Expects existing `hacks` table with standard fields (id, name, description, requirements, etc.)
- May need migration to add Discord-specific fields if not present

### Security
- Never log or expose Supabase service role key
- Implement rate limiting for command usage
- Validate all user inputs before database operations
- Use parameterized queries to prevent SQL injection

## Success Metrics

1. **Availability**: Bot maintains 99% uptime during first week of operation
2. **Performance**: Commands respond within 500ms under normal load
3. **Integration Success**: 100% of role changes sync successfully between platforms
4. **Error Rate**: Less than 1% command failure rate
5. **User Adoption**: 50+ unique users interact with bot in first week
6. **Development Velocity**: Foundation complete and tested within 3 days

## Open Questions

1. Should the bot have different hack display formats for DMs vs channels? same for now
2. What specific Discord roles need to sync with NRGhax profiles? the ones assigned after the questionaire Completion
3. How often should the role synchronization run (real-time vs periodic)? how realistic is realtime
4. Which admin users should receive error notifications via DM? The ones with a role @admin
5. Should there be a staging/development bot separate from production? same is ok
6. What is the preferred AWS service for deployment (EC2, ECS, Lambda)? self-hosting
7. Are there rate limits we should implement for hack queries? sure, use best judgment
8. Should hack information be cached, and if so, for how long? Use best judgment
9. What should happen if a user has roles in Discord that don't exist in NRGhax? Ignored.
10. Do we need audit logging for all bot actions, or just role syncs? Use best judgment.