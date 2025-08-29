# PRD Prompt Template for NRGHAX Discord Bot

## 🎯 How to Use This Template

Copy the prompt below and fill in the [BRACKETED] sections with your specific feature requirements. This template is designed to generate PRDs that align with the liberation philosophy while providing clear technical specifications.

---

## 📝 The Prompt Template

```
Create a Product Requirements Document (PRD) for the NRGHAX Discord Bot feature: [FEATURE NAME]

## Context
We're building a Discord bot for a bio-energy learning platform that intentionally celebrates user graduation and independence. The bot should help users learn energy sovereignty techniques, validate their practice with peers, and ultimately become independent of the platform.

## Feature Request
[DESCRIBE THE FEATURE IN 2-3 SENTENCES]

## User Story
As a [USER TYPE], I want to [ACTION] so that [BENEFIT/OUTCOME].

## Liberation Alignment
This feature supports liberation by:
- [HOW IT TEACHES INDEPENDENCE]
- [HOW IT WORKS WITHOUT THE PLATFORM]
- [HOW IT CELEBRATES PROGRESS TOWARD GRADUATION]

## Technical Requirements

### Discord Integration
- Command structure: [e.g., /command subcommand [required] [optional]]
- Event listeners needed: [e.g., messageCreate, voiceStateUpdate]
- Permissions required: [e.g., SEND_MESSAGES, MANAGE_ROLES]
- Rate limiting: [e.g., 1 use per 5 seconds per user]

### Database Schema
```sql
-- [DESCRIBE NEW TABLES OR MODIFICATIONS]
-- Example:
table_name (
  id uuid primary key,
  user_id uuid references users(id),
  created_at timestamp,
  [OTHER FIELDS]
)
```

### API Endpoints (if portal integration needed)
- GET/POST/PUT/DELETE /api/[endpoint]
- Request/Response format
- Authentication requirements

### Business Logic
1. [STEP BY STEP LOGIC FLOW]
2. [VALIDATION RULES]
3. [ERROR HANDLING]
4. [SUCCESS CRITERIA]

## User Experience

### Command Flow
1. User types: [COMMAND]
2. Bot responds with: [RESPONSE TYPE - embed, message, reaction]
3. User provides: [INPUT IF NEEDED]
4. Bot processes and: [FINAL ACTION]

### Success Messages
- [EXAMPLE SUCCESS MESSAGE THAT CELEBRATES PROGRESS]
- Should emphasize skill learned, not platform engagement

### Error Handling
- [COMMON ERROR SCENARIOS]
- User-friendly error messages
- Graceful fallbacks

## Privacy & Data Considerations
- What data is collected: [LIST]
- How long it's stored: [RETENTION POLICY]
- User control options: [DELETE, EXPORT, VISIBILITY]
- GDPR compliance: [CONSIDERATIONS]

## Metrics to Track
Liberation-focused metrics:
- [METRIC 1 - e.g., Skills mastered]
- [METRIC 2 - e.g., Peer validations given]
- [METRIC 3 - e.g., Progress toward graduation]

NOT tracking:
- Engagement time
- Message count
- Addiction metrics

## Implementation Phases
Phase 1 (MVP):
- [CORE FUNCTIONALITY]

Phase 2 (Enhancement):
- [ADDITIONAL FEATURES]

Phase 3 (Polish):
- [OPTIMIZATIONS]

## Dependencies
- Required services: [e.g., Supabase, Redis]
- Required packages: [e.g., discord.js, date-fns]
- External APIs: [IF ANY]

## Testing Requirements
- Unit tests for: [BUSINESS LOGIC]
- Integration tests for: [DATABASE OPERATIONS]
- Discord mock tests for: [COMMAND HANDLERS]
- User acceptance criteria: [WHAT DEFINES SUCCESS]

## Rollout Strategy
- Feature flag: [YES/NO]
- Beta testing group: [SIZE AND SELECTION CRITERIA]
- Gradual rollout: [PERCENTAGE OR CRITERIA]
- Rollback plan: [HOW TO DISABLE IF ISSUES]

## Future Considerations
- How this enables graduation: [EXPLANATION]
- Offline alternatives: [HOW USER COULD DO THIS WITHOUT DISCORD]
- Peer learning opportunities: [HOW USERS TEACH EACH OTHER]

## Additional Notes
[ANY OTHER SPECIFIC REQUIREMENTS OR CONSTRAINTS]
```

---

## 📋 Example Filled Prompts

### Example 1: Daily Check-in System

```
Create a Product Requirements Document (PRD) for the NRGHAX Discord Bot feature: Daily Practice Check-in System

## Context
We're building a Discord bot for a bio-energy learning platform that intentionally celebrates user graduation and independence. The bot should help users learn energy sovereignty techniques, validate their practice with peers, and ultimately become independent of the platform.

## Feature Request
Implement a daily check-in system where users can record their practice sessions, select which bio-energy technique they practiced, and build streaks that unlock new techniques rather than creating platform dependency.

## User Story
As a practitioner, I want to check in my daily practice so that I can track my progress toward mastery and unlock new techniques to learn.

## Liberation Alignment
This feature supports liberation by:
- Teaching consistent practice habits that work anywhere
- Unlocking new skills rather than platform rewards
- Celebrating milestones toward independence, not engagement

[Continue with technical details...]
```

### Example 2: Peer Validation System

```
Create a Product Requirements Document (PRD) for the NRGHAX Discord Bot feature: Peer Practice Validation

## Context
We're building a Discord bot for a bio-energy learning platform that intentionally celebrates user graduation and independence. The bot should help users learn energy sovereignty techniques, validate their practice with peers, and ultimately become independent of the platform.

## Feature Request
Create a peer validation system where practitioners can validate each other's practice sessions through Discord reactions, building trust and community wisdom without creating guru dynamics.

## User Story
As a practitioner, I want to validate my peer's practice experience so that we can support each other's growth without needing external authority.

## Liberation Alignment
This feature supports liberation by:
- Distributing validation power horizontally among peers
- Teaching discernment through peer review
- Building community trust without platform intermediation

[Continue with technical details...]
```

### Example 3: Graduation System

```
Create a Product Requirements Document (PRD) for the NRGHAX Discord Bot feature: Graduation Celebration System

## Context
We're building a Discord bot for a bio-energy learning platform that intentionally celebrates user graduation and independence. The bot should help users learn energy sovereignty techniques, validate their practice with peers, and ultimately become independent of the platform.

## Feature Request
Implement a graduation system that recognizes when users have mastered core techniques and celebrates their independence with a ceremony, alumni role, and data export.

## User Story
As a practitioner who has mastered the techniques, I want to graduate from the platform so that I can celebrate my independence and help others achieve the same.

## Liberation Alignment
This feature supports liberation by:
- Celebrating users who no longer need the platform
- Providing complete data export for independent practice
- Creating alumni who inspire others to graduate

[Continue with technical details...]
```

---

## 🚀 Tips for Using This Template

### DO:
- Emphasize how features enable independence
- Include peer validation mechanisms
- Design for eventual user graduation
- Make features work offline when possible
- Celebrate progress toward sovereignty

### DON'T:
- Create retention mechanisms
- Build platform-exclusive features
- Implement dark patterns
- Track engagement metrics primarily
- Punish users for leaving

### Remember:
Every feature should pass the North Star test:
1. Does it teach energy sovereignty?
2. Does it encourage peer learning?
3. Does it celebrate graduation?
4. Does it work without the platform?

## 🎯 Success Metrics

Good PRDs will specify metrics like:
- Skills mastered
- Peer validations exchanged
- Graduation eligibility progress
- Knowledge shared between users
- Independent practice sessions

Bad PRDs focus on:
- Time in Discord
- Messages sent
- Daily active users
- Retention rates
- Platform dependency

---

Use this template to maintain philosophical alignment while building practical features that serve the liberation mission.