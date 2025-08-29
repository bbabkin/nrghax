# NRGHAX Bot Command Reference

## 📚 Command Categories

### Core Commands
Essential commands for daily practice and progress tracking.

### Practice Commands
Tools for managing practice sessions and techniques.

### Social Commands
Peer interaction, validation, and community features.

### Advanced Commands
Graduation, teaching, and liberation-focused features.

---

## 🎯 Core Commands

### `/checkin`
Record your daily practice and maintain your streak.

**Usage:** `/checkin [hack] [duration] [notes]`

**Parameters:**
- `hack` (optional): The technique you practiced (defaults to last used)
- `duration` (optional): Practice time in minutes (defaults to prompt)
- `notes` (optional): Any observations or experiences

**Example:**
```
/checkin energy-ball 15 "Felt the warmth spreading through my palms"
```

**Response:**
```
✨ Practice recorded! 
Technique: Energy Ball
Duration: 15 minutes
Streak: 7 days 🔥
Progress: 3 more days until Shield unlock!
```

---

### `/streak`
View your current practice streak and progress.

**Usage:** `/streak [user]`

**Parameters:**
- `user` (optional): Check another user's streak (if public)

**Example:**
```
/streak
/streak @friend
```

**Response:**
```
🔥 Your Current Streak: 14 days
📊 Total Practice: 247 minutes
🎯 Next Milestone: 21 days (Shield Mastery)
✨ Techniques Mastered: 3/7
```

---

### `/profile`
View comprehensive practice statistics and achievements.

**Usage:** `/profile [section]`

**Parameters:**
- `section` (optional): focus area (stats/achievements/progress)

**Example:**
```
/profile
/profile achievements
```

---

### `/help`
Get help with bot commands and features.

**Usage:** `/help [command]`

**Parameters:**
- `command` (optional): Specific command to learn about

**Example:**
```
/help
/help practice
```

---

## 🧘 Practice Commands

### `/practice start`
Begin a timed practice session.

**Usage:** `/practice start [hack] [goal_minutes]`

**Parameters:**
- `hack` (required): Technique to practice
- `goal_minutes` (optional): Target duration

**Example:**
```
/practice start shield 20
```

**Response:**
```
🟢 Practice session started!
Technique: Double Torus Shield
Goal: 20 minutes
Reply 'stop' when complete or 'pause' to take a break.
```

---

### `/practice end`
Complete your current practice session.

**Usage:** `/practice end [notes]`

**Parameters:**
- `notes` (optional): Session observations

**Example:**
```
/practice end "Shield felt stronger today, automatic activation twice"
```

---

### `/practice pause`
Pause your current session (maintains state).

**Usage:** `/practice pause`

---

### `/practice resume`
Resume a paused practice session.

**Usage:** `/practice resume`

---

### `/journal`
Add reflections to your practice journal.

**Usage:** `/journal [entry]`

**Parameters:**
- `entry` (required): Your journal text

**Example:**
```
/journal "Shield activated automatically during stressful meeting today"
```

---

### `/techniques`
List available techniques and your progress.

**Usage:** `/techniques [filter]`

**Parameters:**
- `filter` (optional): all/unlocked/locked/mastered

**Example:**
```
/techniques unlocked
```

**Response:**
```
🔓 Unlocked Techniques:
1. ✅ Energy Ball (Mastered - 50+ sessions)
2. 🔵 Double Torus Shield (Learning - 12 sessions)
3. 🔵 Energy Flows (Learning - 7 sessions)

🔒 Locked Techniques:
4. Base State (Unlocks after Shield mastery)
5. Energy Programming (Requires 60-day streak)
```

---

## 👥 Social Commands

### `/validate`
Validate a peer's practice session.

**Usage:** `/validate @user [message]`

**Parameters:**
- `user` (required): Person to validate
- `message` (optional): Supportive message

**Example:**
```
/validate @practitioner "Great energy work! I could feel it too"
```

---

### `/buddy request`
Find a practice partner based on compatibility.

**Usage:** `/buddy request [timezone] [experience]`

**Parameters:**
- `timezone` (optional): Your timezone
- `experience` (optional): beginner/intermediate/advanced

**Example:**
```
/buddy request EST intermediate
```

---

### `/challenge join`
Participate in community challenges.

**Usage:** `/challenge join [name]`

**Parameters:**
- `name` (required): Challenge to join

**Example:**
```
/challenge join 7-day-shield
```

---

### `/challenge list`
View active community challenges.

**Usage:** `/challenge list`

---

### `/invite`
Generate a referral code for friends.

**Usage:** `/invite [message]`

**Parameters:**
- `message` (optional): Custom invitation message

**Example:**
```
/invite "Join me in learning real energy techniques"
```

**Response:**
```
🎫 Your invite code: NRGHX-A7B2C
Link: discord.gg/energylabs?ref=NRGHX-A7B2C

When someone joins and practices for 7 days, 
you both earn the "Energy Friends" achievement!
```

---

## 🎓 Advanced Commands

### `/graduate apply`
Apply for graduation when you've mastered core techniques.

**Usage:** `/graduate apply`

**Requirements:**
- 30+ day streak
- Shield mastery verified
- 3+ techniques mastered
- 10+ peer validations given

**Response:**
```
🎓 Checking graduation criteria...
✅ Streak: 45 days
✅ Shield: Verified by 3 peers
✅ Techniques: 4 mastered
✅ Community: 15 validations given

🎉 CONGRATULATIONS! You're eligible for graduation!
Your ceremony will be held at the next community gathering.
You'll receive the Alumni role and celebration!
```

---

### `/graduate check`
Check your progress toward graduation.

**Usage:** `/graduate check`

---

### `/teach schedule`
Offer to teach a technique to peers.

**Usage:** `/teach schedule [technique] [datetime] [description]`

**Parameters:**
- `technique` (required): What you'll teach
- `datetime` (required): When (EDT/PST/UTC)
- `description` (optional): Session details

**Example:**
```
/teach schedule shield "Saturday 3pm EST" "Beginners welcome!"
```

---

### `/teach list`
View upcoming peer teaching sessions.

**Usage:** `/teach list`

---

### `/export data`
Export all your practice data.

**Usage:** `/export data [format]`

**Parameters:**
- `format` (optional): json/pdf/csv (default: json)

**Example:**
```
/export data pdf
```

**Response:**
```
📦 Preparing your data export...
✅ Complete! Your practice history, achievements, and notes
have been compiled.

📎 Download: [Secure link - expires in 24h]

Your data includes:
- All practice sessions
- Achievement history
- Journal entries
- Peer validations
- Progress metrics

Take this anywhere - these techniques work without Discord!
```

---

### `/shield verify`
Submit your shield mastery for peer verification.

**Usage:** `/shield verify`

**Process:**
1. Answer 3 questions about your shield experience
2. Responses shared anonymously for peer review
3. 3 peer validations = Verified Shield status

---

### `/spinoff create`
Get resources to start your own practice community.

**Usage:** `/spinoff create [name]`

**Parameters:**
- `name` (required): Your community name

**Response:**
```
🚀 Liberation Kit Generated!

Resources for "{name}":
- Discord server template
- Basic technique guides
- Community guidelines
- Anti-guru principles
- Graduation framework

Remember: Success is when your members 
also graduate and become sovereign!

Download: [Kit link]
```

---

## 🤖 Bot Behaviors

### Automatic Responses

**Practice Room Entry:**
When someone joins a voice practice room:
```
🔊 @here Someone's practicing in Room 1! 
Join for group energy work and peer support.
```

**Milestone Achievements:**
```
🎉 @user just hit a 7-day streak! 
The Shield technique is now unlocked! 
Remember: consistency builds sovereignty.
```

**Graduation Announcements:**
```
🎓 CELEBRATION TIME! 
@user has graduated from NRGHAX!
They've mastered the core techniques and 
achieved energy sovereignty!

"Success = Users who no longer need us" ✨
```

---

## 🔒 Privacy Commands

### `/privacy settings`
Manage your data visibility.

**Usage:** `/privacy settings [option] [value]`

**Options:**
- `streak_visibility`: public/friends/private
- `profile_visibility`: public/friends/private
- `practice_sharing`: on/off
- `anonymous_mode`: on/off

---

### `/privacy delete`
Request complete data deletion.

**Usage:** `/privacy delete confirm`

**Warning:** This permanently removes all your data.

---

## 📊 Moderation Commands
(Admin/Moderator only)

### `/mod timeout`
Temporarily restrict a user (liberation-focused).

**Usage:** `/mod timeout @user [duration] [reason]`

**Note:** Timeouts should help users refocus on practice, not punish.

---

### `/mod liberation`
Suggest a user consider graduation.

**Usage:** `/mod liberation @user`

**Use when:** Someone seems ready for independence but hasn't applied.

---

## 🎮 Quick Start Guide

### Day 1: First Steps
1. `/checkin` - Record your first practice
2. `/techniques` - See available techniques
3. `/help` - Learn the commands

### Week 1: Building Habits
1. Daily `/checkin` to build streak
2. `/practice start` for timed sessions
3. `/validate` peers to build community

### Month 1: Mastery Path
1. `/buddy request` for practice partner
2. `/challenge join` for motivation
3. `/journal` for tracking insights

### Graduation Ready:
1. `/graduate check` - See your progress
2. `/shield verify` - Verify mastery
3. `/graduate apply` - Claim independence
4. `/export data` - Take your journey with you

---

## 💡 Command Philosophy

Every command is designed to:
- **Teach** skills that work anywhere
- **Connect** peers horizontally
- **Celebrate** progress toward independence
- **Respect** user autonomy and privacy

No commands should:
- Create platform dependency
- Establish hierarchies
- Punish disengagement
- Hide information

---

## 🆘 Support

If you need help:
- Use `/help [command]` for any command
- Ask in #general-energy channel
- Request a practice buddy for guidance
- Remember: Peers are teachers, not gurus

---

**Remember:** The goal is your independence. Every command serves that mission. 🎯