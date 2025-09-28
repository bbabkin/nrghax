# GitHub Webhook & Auto-Update Setup

## 🔐 Your Secret Tokens

Save these securely - they've been generated for your bot:

### GitHub Webhook Secret
```
8ffc99f7c1f6a1823f30a952b8f7f940e4f360370d4fcb2a5f4779e1dea11c01
```

### Manual Update Token
```
a4f2f638e421585a1143eb678e2893347e49bc6290fc0a1f3689c00b483add26
```

## 🔧 GitHub Webhook Configuration

### 1. Go to Your Repository Settings
Navigate to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/hooks`

### 2. Add Webhook
Click "Add webhook" and configure:

- **Payload URL**: `http://YOUR_SERVER_IP:3001/webhook/github`
- **Content type**: `application/json`
- **Secret**: `8ffc99f7c1f6a1823f30a952b8f7f940e4f360370d4fcb2a5f4779e1dea11c01`
- **Which events?**: Select "Just the push event"
- **Active**: ✅ Check this box

### 3. Save Webhook
Click "Add webhook" to save.

## 📦 Database Setup Required

Your production Supabase is connected but missing required database functions. You need to run migrations:

### Missing Functions:
- `sync_discord_role_as_tag` - Required for role synchronization

### To Fix:
1. Check `/supabase/migrations/` folder for SQL migration files
2. Run these migrations on your production Supabase:
   - Go to Supabase Dashboard → SQL Editor
   - Copy and run each migration file in order

## 🚀 Current Status

✅ **Working:**
- Bot connected to Discord (NRGHAX#3788)
- Production Supabase credentials configured
- Admin user ID set (1367587873380892762)
- Update notification channel set (1416899153966927952)
- Monitoring system active
- Health checks running

⚠️ **Needs Attention:**
- Database migrations need to be run
- Bot needs "Manage Roles" permission in Discord server
- Port 3001 needs to be open for webhook (if using auto-update)

## 🔄 Manual Update Endpoint

You can trigger updates manually using:

```bash
curl -X POST http://YOUR_SERVER_IP:3001/update/manual \
  -H "x-update-token: a4f2f638e421585a1143eb678e2893347e49bc6290fc0a1f3689c00b483add26"
```

## 📊 Monitoring Commands

```bash
# View real-time dashboard
./bot-monitor.sh

# Check status
./bot-monitor.sh status

# View logs
./bot-monitor.sh logs

# Restart bot
./bot-monitor.sh restart
```

## 🔒 Security Notes

- Never commit `.env.production` to git
- Keep webhook secret and update token private
- Rotate tokens periodically for security
- Use HTTPS in production if possible

## 📝 Next Steps

1. Run database migrations on production Supabase
2. Configure GitHub webhook with the secret above
3. Ensure bot has proper Discord permissions
4. Open port 3001 if using auto-update feature
5. Consider setting up PM2 for process management: `./setup-pm2.sh`