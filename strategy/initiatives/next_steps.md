# NRGHAX Portal & Discord Implementation Roadmap

## Current State
### Portal (NextJS App)
-  User authentication (email/password + Google OAuth)
-  Password recovery flow
-  Supabase integration with basic user tables
-  Blank dashboard after login

### Discord Server
-  Server created: "Energy Labs"
-  Single channel: �-lab-entry
- � Channel description needs simplification

## Phase 1: Foundation 
*Establish core engagement loop and Discord-Portal connection*

### 1.1 Daily Power-Up System (Variable Reward Hook)
**PRD Prompt:**
"Build a daily power-up selection feature. Requirements:
- Modal or card UI on dashboard that presents 6 selectable options
- Each option links to a hack ID in database
- Hack content served from Supabase (video URL, text, duration)
- Track: user_id, hack_id, timestamp, feedback_score in 'practice_sessions' table
- After completion, show 3-button feedback UI (stores as 1/0/-1)
- Calculate and display streak from consecutive daily selections
- Add XP system: hack_category field maps to skill branches, accumulate points
- Recommendation algorithm: based on feedback scores and selection patterns
- Unlock system: new hacks appear after X uses of category"

### 1.2 Discord Integration Setup
**PRD Prompt:**
"Add Discord OAuth to existing auth system. Technical requirements:
- Add Discord OAuth strategy to NextAuth configuration
- Create discord_id column in users table (nullable, unique)
- Add 'Link Discord' button to dashboard settings
- Store Discord username and discriminator for display
- Show connection status badge component
- Set up separate Node.js project for Discord bot with TypeScript
- Configure discord.js with slash command framework
- Environment variables for bot token and guild IDs"

### 1.3 Discord Server Structure
**Action Items:**
- Simplify �-lab-entry description to: "Energy research lab. No gurus, just results. Drop your check-in below =G"
- Create channels:
  - =�-daily-labs (daily check-ins)
  - >�-live-experiments (hack testing)
  - =�-general-energy (open discussion)
  - =
-practice-rooms (voice channel)
  - =�-hack-library (pinned discoveries)

### 1.4 Basic Discord Bot
**PRD Prompt:**
"Create Discord bot with database sync. Infrastructure requirements:
- Node.js/TypeScript bot using discord.js v14+
- Slash commands: /checkin, /streak, /help
- Direct Supabase connection using same credentials as portal
- Command handlers in separate files for modularity
- Error handling with Discord embed responses
- Rate limiting per user (1 command per 5 seconds)
- Deploy on separate process/container from web app
- Webhook for portal->Discord notifications"

## Phase 2: First Energy Hack (Week 3-4)
*Introduce the Energy Ball as the gateway hack*

### 2.1 Gateway Hacks Module
**PRD Prompt:**
"Build hack learning system with progression. Infrastructure:
- 'hacks' table: id, name, description, content_url, duration, category, level, prerequisite_id
- 'user_hack_progress' table: user_id, hack_id, practice_count, unlocked_at, mastery_level
- Skill tree visualization component (React Flow or D3.js)
- Unlock logic: check prerequisites and practice counts
- Video player component with completion tracking
- Text-based guide renderer with markdown support
- Practice timer component with pause/resume
- Store practice sessions with duration and notes"

### 2.2 Practice Tracking
**PRD Prompt:**
"Implement practice session tracking system. Technical specs:
- 'practice_sessions' table: id, user_id, hack_id, started_at, ended_at, duration_seconds, notes
- Session state management in React context or Zustand
- Timer component with start/pause/stop controls
- Auto-save draft sessions to localStorage
- Weekly aggregation query for progress calculation
- Progress bar component with customizable goals
- Dashboard widget showing total minutes this week
- REST API endpoints for session CRUD operations"

### 2.3 Discord Practice Rooms
**Action Items:**
- Create voice channels: 
  - =4-practice-room-1
  - =5-practice-room-2  
  - =�-quiet-practice
- Bot announcement when someone joins: "@here Someone's practicing in Room 1! Join for group energy work"

### 2.4 Peer Validation System
**PRD Prompt:**
"Build peer validation infrastructure. Requirements:
- 'validations' table: id, session_id, validator_user_id, created_at
- Discord bot webhook integration for session sharing
- Bot creates embed with session details and reaction collector
- Sync reactions back to database via bot
- Badge system: check validation count triggers
- Achievement service to award badges automatically
- Dashboard component showing validation counts
- Prevent self-validation in backend logic"

## Phase 3: Social Proof & Gamification (Week 5-6)
*Build viral mechanics and achievement system*

### 3.1 Achievement System
**PRD Prompt:**
"Create achievement/badge infrastructure. Technical requirements:
- 'achievements' table: id, name, description, icon_url, criteria_json
- 'user_achievements' table: user_id, achievement_id, earned_at
- Achievement checker service (cron job or event-driven)
- Criteria evaluator supporting multiple condition types
- Badge display component grid for dashboard
- Discord bot role sync when achievements earned
- Notification system for new achievement unlocks
- Achievement progress tracking (e.g., 7/10 validations)"

### 3.2 Leaderboard & Challenges
**PRD Prompt:**
"Build leaderboard and challenges system. Infrastructure:
- 'challenges' table: id, name, description, start_date, end_date, criteria_json
- 'challenge_participants' table: challenge_id, user_id, completed_at
- Leaderboard aggregation queries (weekly/monthly)
- Privacy settings: visibility toggle per user
- Challenge engine evaluating completion criteria
- Leaderboard component with pagination
- Opt-in/opt-out UI in user settings
- Scheduled job for challenge rotation"

### 3.3 Discord Rich Presence
**PRD Prompt:**
"Implement Discord Rich Presence integration. Technical specs:
- Discord RPC client library integration
- WebSocket connection to Discord client
- Activity updates when practice starts/ends
- Dynamic status text with hack name and streak
- Settings toggle for Rich Presence enable/disable
- Join button configuration linking to portal
- Fallback for when Discord client not detected
- Rate limiting to prevent API spam"

### 3.4 Invitation System
**PRD Prompt:**
"Build referral tracking system. Infrastructure requirements:
- 'referrals' table: id, referrer_user_id, referred_user_id, invite_code, created_at
- Unique invite code generation (6-8 alphanumeric)
- Discord bot invite link generator with code parameter
- Webhook from bot when user joins with code
- 7-day activity checker for referral completion
- Badge awarding on completion trigger
- Referral count display component for profile
- Analytics dashboard for referral metrics"

## Phase 4: Learning Pathways (Week 7-8)
*Structured progression with multiple hacks*

### 4.1 Hack Tree
**PRD Prompt:**
"Create visual hack tree on dashboard. Start with Energy Ball, branching to: Energy Shield (unlocks after 7 days Energy Ball), Energy Flows (unlocks after Shield), Base State (unlocks after Flows). Each hack has same structure: intro, guide, practice tracking, peer validation."

### 4.2 Learning Paths
**PRD Prompt:**
"Implement three learning paths users choose after first week: 'Energy Awareness' (sensing focus), 'Protection' (shield focus), 'Flow Master' (manipulation focus). Each path highlights different hacks and challenges. Users can switch paths anytime. Add path badge to Discord role."

### 4.3 Progress Visualization  
**PRD Prompt:**
"Create progress page showing: hack mastery bars (based on practice count), total energy minutes, streak calendar heatmap, achievement gallery, peer validation given/received chart. Add sharing button that generates image for social media with watermark 'nrghax.com'."

### 4.4 Discord Study Groups
**Action Items:**
- Create path-specific channels:
  - =�-shield-studies
  - <
-flow-studies
  - =A-awareness-studies
- Weekly "Path Meetings" in voice for each track
- Bot creates threads for hack discussions

## Phase 5: Shield Teaching Priority (Week 9-10)
*Focus on the Double Torus Shield as liberation hack*

### 5.1 Shield Intensive Module
**PRD Prompt:**
"Build multi-day course infrastructure. Technical requirements:
- 'courses' table: id, name, description, total_days
- 'course_days' table: course_id, day_number, content_url, unlock_criteria
- 'user_course_progress' table: user_id, course_id, current_day, started_at
- Day-gating logic checking completion timestamps
- Progress tracker component with day indicators
- Content delivery system for mixed media (video/text/diagrams)
- Completion webhook to Discord for role assignment
- Certificate generation on course completion"

### 5.2 Shield Verification System
**PRD Prompt:**
"Add Shield verification process. After claiming shield completion, user must describe their experience in 3 questions: How it feels, When it activates, What changes they notice. Answers shared (anonymously optional) for peer review. Three peers marking as 'authentic' grants 'Verified Shield' status."

### 5.3 Protection Metrics
**PRD Prompt:**
"Add 'Protection Score' to dashboard calculating: days with active shield practice, consistency of practice, peer validations received. Not competitive, just personal progress. Add journal feature for users to note when shield activated automatically in daily life."

## Phase 6: Community Features (Week 11-12)
*Enable peer teaching and knowledge sharing*

### 6.1 Hack Innovation Lab
**PRD Prompt:**
"Create Innovation Lab where users with 30+ day streak can submit hack variations. Other users can test and rate effectiveness. Top-rated innovations get added to main library with creator credit. Add 'Innovator' badge and Discord role for accepted contributions."

### 6.2 Peer Teaching System
**PRD Prompt:**
"Enable peer teaching. Users with verified hack mastery can schedule 'teaching sessions' in Discord voice. Portal shows upcoming sessions. Attendees can leave feedback. After teaching 5 successful sessions, earn 'Guide' badge. No payment system - pure peer exchange."

### 6.3 Practice Buddy Matching
**PRD Prompt:**
"Create buddy matching system. Users can request practice partner based on timezone and experience level. Bot matches compatible users and creates private Discord channel for them. After practicing together 3 times, both get 'Team Energy' badge."

## Phase 7: Liberation Features (Week 13-14)
*Implement graduation and anti-dependency mechanisms*

### 7.1 Graduation Pathways
**PRD Prompt:**
"Implement graduation system infrastructure:
- 'graduation_criteria' table defining requirements
- Progress checker service evaluating all criteria
- Graduation application form component
- 7-day lockout mechanism after application
- Return survey for post-graduation experience
- Alumni status flag in user table
- Special alumni-only Discord channel access
- Graduation certificate PDF generator
- Success story submission system"

### 7.2 Export Your Knowledge
**PRD Prompt:**
"Build data export functionality. Technical requirements:
- Export service aggregating all user data
- PDF generation using React PDF or Puppeteer
- JSON export with full data structure
- Include: hacks learned, practice logs, achievements, notes
- Offline practice guide markdown file
- Zip file creation for bundle download
- Export request tracking and rate limiting
- GDPR-compliant data portability format"

### 7.3 Spin-off Support
**PRD Prompt:**
"Create 'Start Your Own Lab' toolkit. Graduates can access Discord server template, basic hack library, and community guidelines to create their own energy research groups. Add 'Laboratory Founder' badge for those who successfully launch spin-off communities."

## Phase 8: Advanced Features (Week 15-16)
*Enhance engagement and retention through rich features*

### 8.1 Energy Programming Module
**PRD Prompt:**
"Add Energy Programming section for 60+ day users. Teach conscious energy direction for personal goals. Include ethical guidelines, safety warnings, peer accountability system. Requires Shield mastery first. Add journaling for intention-setting and result tracking."

### 8.2 Group Practice Events
**PRD Prompt:**
"Implement synchronized group practice. Users can join scheduled sessions where everyone practices same hack simultaneously. Show live participant count. Add countdown timer, guided audio option, post-practice sharing. Award 'Collective Energy' badge for 5 group sessions."

### 8.3 Biometric Integration (Optional)
**PRD Prompt:**
"Add optional heart rate variability (HRV) integration via phone camera or wearables. Show HRV changes during practice. Store biometric data locally only, with option to share anonymized aggregates. Add 'Measured Progress' achievement for tracking 30 sessions with biometrics."

## Discord Bot Evolution Timeline

### Week 1-2: Basic Bot
- /checkin command
- /streak command
- Role assignment for streaks

### Week 3-4: Practice Bot
- Practice session announcements
- Validation reactions
- Hack unlock notifications

### Week 5-6: Social Bot
- Rich presence updates
- Challenge announcements
- Leaderboard updates

### Week 7-8: Learning Bot
- Path guidance
- Study group coordination
- Progress reports

### Week 9-10: Shield Bot
- Shield training reminders
- Verification process
- Protection score tracking

### Week 11+: Community Bot
- Teaching session scheduler
- Buddy matching
- Innovation lab voting
- Graduation ceremonies

## Success Metrics to Track

### Engagement
- Daily active users
- Average streak length
- Practice minutes per user
- Peer validations given

### Liberation
- Users reaching graduation
- Knowledge exports initiated
- Spin-off communities created
- Users practicing without portal

### Community Health
- Peer teaching sessions
- Innovation submissions
- Discord voice channel usage
- Support interactions

## Implementation Priorities

**Must Have (Phase 1-3):**
- Daily check-ins
- Energy Ball hack
- Discord bot basics
- Achievement system
- Social proof

**Should Have (Phase 4-6):**
- Learning paths
- Shield training
- Peer teaching
- Innovation lab

**Nice to Have (Phase 7-8):**
- Graduation system
- Knowledge export
- Biometric integration
- Advanced hacks

## Risk Mitigation

### Technical Risks
- Start simple, iterate based on usage
- Use Discord bot sharding early
- Cache heavily to reduce Supabase calls
- Progressive enhancement for features

### Community Risks
- Clear anti-guru messaging from day 1
- Peer moderation tools
- Transparent graduation goals
- Regular "liberation reminders"

### Growth Risks
- Organic growth over viral spikes
- Quality community over numbers
- Gradual feature rollout
- Community feedback loops

## Next Immediate Steps

1. **Clean up Discord:**
   - Simplify channel description
   - Create basic channel structure
   - Set community guidelines

2. **Portal MVP:**
   - Implement daily check-in
   - Add first achievement badge
   - Create Energy Ball module

3. **Basic Bot:**
   - Set up bot application
   - Implement /checkin command
   - Connect to Supabase

4. **Community Seeding:**
   - Find 10 beta testers
   - Daily engagement for first week
   - Gather feedback for iteration

## The North Star

Every feature should answer YES to:
- Does it teach energy sovereignty?
- Does it encourage peer learning over guru dependency?
- Does it celebrate graduation over retention?
- Does it work without the platform?

**Success = Users who no longer need us**

## Key Refinements from Discussion

### The Hook: Variable Reward Power-Ups
- Not passive check-ins but active daily power-ups
- Users select what they need, get different hack each time
- Builds natural progression and understanding of their needs

### Gateway Hacks That Actually Work
- **Eye Massage**: Instant relief, stealth hack for screen workers
- **Pain Unwind**: Visual/imagination based, works immediately
- **Warm Liquid**: Proven relaxation that primes energy sensing

### The Positioning: "RPG Magic That's Real"
- Frame as learning actual abilities/skills
- Practical, defiant of orthodox science
- Not wellness mysticism but reality cheat codes
- "For people too smart for self-help, too practical for spirituality"

### Early Adopter Profile
- Open-minded but not gullible
- Psychology interest but know its limits
- Challenging childhood → early maturity + retained wonder
- Natural philosophers who test everything

### Discord-First Until Critical Mass
- Test hacks with small group before full portal build
- Community validation more important than platform initially
- Bot development can validate what works