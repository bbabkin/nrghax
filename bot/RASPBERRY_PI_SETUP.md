# 🤖 NRGHax Discord Bot - Raspberry Pi Setup Guide

## Prerequisites

- Raspberry Pi 3B+ or newer (2GB+ RAM recommended)
- Raspberry Pi OS (64-bit recommended for better performance)
- Internet connection
- Discord Bot Token
- Supabase credentials

## Quick Setup

1. **Clone the repository to your Raspberry Pi:**
```bash
git clone https://github.com/yourusername/nrghax.git
cd nrghax/bot
```

2. **Run the deployment script:**
```bash
./deploy-to-pi.sh
```

3. **Configure environment variables:**
```bash
cp .env.example .env
nano .env
```

Add your credentials:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

4. **Start the bot:**
```bash
pm2 start ecosystem.config.js
pm2 save
```

5. **Enable auto-start on boot:**
```bash
sudo systemctl enable nrghax-bot
sudo systemctl start nrghax-bot
```

## Performance Optimization

### Memory Management
The bot is configured to use a maximum of 200MB RAM. If your Pi has limited memory:
- Edit `ecosystem.config.js` and adjust `max_memory_restart`
- Monitor with `pm2 monit`

### CPU Optimization
- The bot runs in single-instance mode to minimize CPU usage
- TypeScript is pre-compiled to JavaScript for better performance

### Storage
- Logs are rotated automatically to prevent disk space issues
- Located in `./logs` directory

## Monitoring

### View Logs
```bash
pm2 logs nrghax-bot
```

### Real-time Monitoring
```bash
pm2 monit
```

### System Status
```bash
sudo systemctl status nrghax-bot
```

### Resource Usage
```bash
htop
# or
pm2 status
```

## Troubleshooting

### Bot Won't Start
1. Check logs: `pm2 logs nrghax-bot --lines 50`
2. Verify .env file: `cat .env`
3. Test connection: `node check-bot-connection.js`

### High Memory Usage
1. Restart bot: `pm2 restart nrghax-bot`
2. Check for memory leaks: `pm2 describe nrghax-bot`
3. Reduce cache settings in .env

### Bot Crashes Frequently
1. Check error logs: `tail -f logs/pm2-error.log`
2. Increase restart delay in ecosystem.config.js
3. Check network connectivity

### Permission Issues
```bash
# Fix permissions
chmod -R 755 .
chmod 600 .env
```

## Updating the Bot

1. **Pull latest changes:**
```bash
git pull origin main
```

2. **Install new dependencies:**
```bash
npm install --production
```

3. **Rebuild:**
```bash
npm run build
```

4. **Restart:**
```bash
pm2 restart nrghax-bot
```

## Backup Strategy

### Manual Backup
```bash
# Backup configuration
cp .env .env.backup
cp ecosystem.config.js ecosystem.config.backup
```

### Automated Backup (cron)
Add to crontab (`crontab -e`):
```bash
# Daily backup at 2 AM
0 2 * * * cp /home/pi/nrghax/bot/.env /home/pi/backups/env-$(date +\%Y\%m\%d).backup
```

## Security Recommendations

1. **Use a dedicated user** for running the bot (not root)
2. **Enable firewall** and only allow necessary ports
3. **Keep system updated:**
```bash
sudo apt update && sudo apt upgrade -y
```
4. **Use strong passwords** for SSH access
5. **Consider SSH key authentication** instead of passwords
6. **Regular security updates:**
```bash
# Auto-update security packages
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

## Hardware Recommendations

### Cooling
- Use heatsinks for 24/7 operation
- Consider a fan for heavy workloads

### Power Supply
- Use official Raspberry Pi power supply (5V 3A)
- Consider UPS for critical deployments

### Storage
- Use high-quality SD card (Class 10/A1)
- Consider SSD via USB for better reliability

## Network Configuration

### Static IP (Optional)
Edit `/etc/dhcpcd.conf`:
```conf
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

### Port Forwarding
If using webhooks, forward port 3001 (or your configured webhook port) to your Pi's IP address.

## Maintenance

### Weekly
- Check logs for errors
- Monitor resource usage

### Monthly
- Update dependencies: `npm update`
- Clean old logs: `pm2 flush`
- System updates: `sudo apt update && sudo apt upgrade`

### Quarterly
- Full system backup
- SD card health check
- Review security settings

## Support

For issues specific to Raspberry Pi deployment:
1. Check this guide first
2. Review logs carefully
3. Test on development machine if possible
4. Create an issue with Pi model, OS version, and error logs

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Raspberry Pi Documentation](https://www.raspberrypi.org/documentation/)
- [Discord.js Guide](https://discordjs.guide/)
- [Node.js on Raspberry Pi](https://nodejs.org/en/docs/guides/)