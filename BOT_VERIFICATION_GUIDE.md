# Bot Connection Verification Guide

## 🔍 How to Verify Your Bot is Connected Correctly

### 1. **Check Bot Connection Status**
Run the verification script:
```bash
cd bot && node check-bot-connection.js
```

This will show you:
- ✅ Environment variables status
- ✅ Supabase connection (currently working - 6 hacks found!)
- ⚠️ Discord connection (needs real token)

### 2. **Verify in Discord Developer Portal**
1. Go to https://discord.com/developers/applications
2. Select your bot application
3. Go to "Bot" section
4. Check that you see "Bot is online" indicator

### 3. **Check Bot is in Your Server**
1. In Discord, look for your bot in the member list
2. It should show with a green dot (online) when running
3. If offline (gray dot), the bot isn't running

### 4. **Test Commands in Discord**
Type these commands in your Discord server:
- `/hack list` - Should show all 6 hacks
- `/hack search query:energy` - Should find matching hacks
- `/profile view` - Should show your profile

### 5. **Monitor Bot Logs**
When running the bot, watch for:
```bash
cd bot && npm start

# You should see:
# ✅ "Bot is ready!"
# ✅ "Logged in as YourBot#1234"
# ✅ "Connected to X guild(s)"
# ✅ "Commands deployed successfully"
```

### 6. **Common Issues & Solutions**

#### Bot Shows Offline in Discord
- **Issue**: Token is invalid or bot isn't running
- **Fix**:
  ```bash
  # 1. Update token in bot/.env
  DISCORD_TOKEN=your_actual_token_here

  # 2. Restart bot
  cd bot && npm start
  ```

#### Commands Don't Appear in Discord
- **Issue**: Commands not deployed
- **Fix**:
  ```bash
  cd bot && npm run deploy-commands
  ```

#### Bot Can't Fetch Hacks
- **Issue**: Supabase connection failed
- **Fix**:
  ```bash
  # Check Supabase is running
  npx supabase status

  # If not, start it
  npx supabase start
  ```

### 7. **Quick Health Check Commands**

```bash
# Check if bot process is running
ps aux | grep "node.*bot"

# Check Supabase status
npx supabase status

# Test database connection
node test-bot-hacks.js

# Full connection test
cd bot && node check-bot-connection.js
```

### 8. **Current Status**
Based on our test:
- ✅ **Supabase**: Connected (6 hacks available)
- ✅ **Database**: Working correctly
- ✅ **Bot Code**: Fixed and ready
- ⚠️ **Discord**: Needs real token

### 9. **What Your Bot Will Show**
When `/hack list` is used, it will display:
1. Morning Energy Boost
2. Grounding Meditation
3. Energy Shield Technique
4. Third Eye Activation
5. Chakra Balancing
6. Breathwork for Energy

### 10. **Final Verification Steps**
1. Add your real Discord token to `bot/.env`
2. Run `cd bot && npm start`
3. In Discord, type `/hack list`
4. You should see all 6 hacks!

---

## 📊 Expected Output When Everything Works

```
Bot Connection Checker:
✅ DISCORD_TOKEN: [Your token preview]
✅ SUPABASE_URL: http://127.0.0.1:54321
✅ SUPABASE_SERVICE_ROLE_KEY: [Key preview]
✅ Supabase connected: 6 hacks found
✅ Bot connected to Discord!
   Bot Username: YourBot#1234
   Connected to 1 server(s)
```

## 🚨 Red Flags That Something's Wrong
- Bot shows offline in Discord
- Commands return "Application did not respond"
- No hacks shown when using `/hack list`
- Error messages in bot console
- Supabase connection errors