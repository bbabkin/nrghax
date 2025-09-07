# NRGhax Discord Bot

A life hacker friend that helps you optimize your energy through Discord! This bot bridges the NRGhax platform with Discord communities, providing energy optimization hacks, role synchronization, and community engagement features.

## Features

### Current Features
- **🚀 Energy Hack Browser**: Browse, search, and discover energy optimization hacks
- **🏓 Health Check**: Quick ping command to verify bot status
- **🔄 Role Synchronization**: Automatic sync between Discord roles and NRGhax profiles
- **📊 Paginated Results**: Clean, navigable hack listings with Discord embeds
- **🛡️ Error Handling**: Comprehensive error tracking with admin notifications
- **💾 Smart Caching**: Optimized performance with intelligent caching

### Bot Personality
The NRGhax bot speaks as your "life hacker friend" - encouraging, growth-focused, and casually intelligent. Example responses:
- "Hey! Here's that energy hack you wanted to level up with! 🚀"
- "I'm here and ready to help you optimize your energy! ⚡"

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Discord Bot Token ([Create one here](https://discord.com/developers/applications))
- Supabase project with profiles and hacks tables

### Installation

1. **Clone the repository**
```bash
cd nrgbot
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your Discord and Supabase credentials
```

4. **Build and run**
```bash
npm run build
npm run deploy-commands
npm start
```

## Commands

### User Commands
- `/ping` - Check if the bot is online and responsive
- `/hack list` - Browse all available energy hacks
- `/hack search <query>` - Search for specific hacks
- `/hack category <category>` - Browse hacks by category
- `/hack view <id>` - View detailed information about a specific hack

### Planned Commands
- `/profile` - View your NRGhax profile
- `/track <hack_id>` - Start tracking a hack
- `/progress` - View your hack progress
- `/leaderboard` - Community leaderboard

## Development

### Project Structure
```
nrgbot/
├── src/
│   ├── commands/       # Slash command implementations
│   ├── config/         # Configuration and constants
│   ├── database/       # Supabase integration
│   │   └── repositories/  # Repository pattern implementations
│   ├── handlers/       # Command and event handlers
│   ├── services/       # Business logic services
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── logs/               # Application logs
├── docker-compose.yml  # Docker configuration
└── SELF_HOSTING.md     # Detailed hosting guide
```

### Development Mode
```bash
npm run dev  # Run with hot reload
```

### Docker Development
```bash
docker-compose --profile dev up nrgbot-dev
```

## Deployment

### Using Docker (Recommended)
```bash
docker-compose up -d
```

### Using PM2
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name nrgbot
pm2 save
pm2 startup
```

### Self-Hosting
See [SELF_HOSTING.md](./SELF_HOSTING.md) for detailed instructions including Raspberry Pi 5 setup.

## Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Discord Library**: Discord.js v14
- **Database**: Supabase (PostgreSQL)
- **Logging**: Winston
- **Scheduling**: node-cron
- **Container**: Docker with Alpine Linux

### Design Patterns
- **Repository Pattern**: Database abstraction layer
- **Command Handler**: Modular command loading and execution
- **Service Layer**: Business logic separation
- **Error Service**: Centralized error handling with admin notifications

### Security Features
- Environment-based configuration
- Service role authentication for Supabase
- Rate limiting and cooldowns
- Input validation and sanitization
- Graceful error handling

## Configuration

Key environment variables:
- `DISCORD_TOKEN` - Bot authentication token
- `DISCORD_CLIENT_ID` - Application client ID
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role for database access
- `ADMIN_USER_IDS` - Comma-separated Discord IDs for error notifications

See [.env.example](./.env.example) for all configuration options.

## Monitoring

The bot includes comprehensive monitoring:
- Health checks for Discord connection, database, and memory
- Detailed logging to files and console
- Admin DM notifications for critical errors
- Performance metrics tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Troubleshooting

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Commands not showing | Run `npm run deploy-commands` |
| Bot offline | Check Discord token in `.env` |
| Database errors | Verify Supabase credentials |
| Role sync not working | Check bot permissions in Discord |

## Roadmap

- [ ] Web dashboard integration
- [ ] Achievement system
- [ ] Community challenges
- [ ] Webhook notifications
- [ ] Analytics dashboard
- [ ] Voice channel features
- [ ] Multi-language support

## License

Part of the NRGhax project. See main repository for license details.

## Support

For help and questions:
1. Check [SELF_HOSTING.md](./SELF_HOSTING.md) for detailed setup
2. Review logs in `logs/` directory
3. Open an issue on GitHub
4. Join our Discord community

---

Built with 💚 by the NRGhax team | [Website](https://nrghax.com) | [Discord](https://discord.gg/nrghax)