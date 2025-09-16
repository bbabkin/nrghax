import { exec } from 'child_process';
import { promisify } from 'util';
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { Client, TextChannel } from 'discord.js';

const execAsync = promisify(exec);

export class AutoUpdateService {
  private app: express.Application;
  private port: number;
  private webhookSecret: string;
  private client: Client;
  private updateChannelId?: string;

  constructor(client: Client) {
    this.app = express();
    this.port = parseInt(process.env.WEBHOOK_PORT || '3001');
    this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || '';
    this.client = client;
    this.updateChannelId = process.env.UPDATE_NOTIFICATION_CHANNEL_ID;

    this.setupWebhookEndpoint();
  }

  private setupWebhookEndpoint() {
    // Parse raw body for signature verification
    this.app.use(express.raw({ type: 'application/json' }));

    // GitHub webhook endpoint
    this.app.post('/webhook/github', async (req: Request, res: Response): Promise<void> => {
      try {
        // Verify GitHub signature
        if (!this.verifyGitHubSignature(req)) {
          logger.warn('Invalid GitHub webhook signature');
          res.status(401).send('Unauthorized');
          return;
        }

        const payload = JSON.parse(req.body.toString());

        // Check if it's a push to main/master branch
        if (payload.ref === 'refs/heads/main' || payload.ref === 'refs/heads/master') {
          logger.info('Received push to main branch, starting update...');

          // Send notification to Discord
          await this.notifyDiscord('🔄 Update detected! Starting auto-update process...');

          // Trigger update in background
          this.performUpdate(payload);

          res.status(200).send('Update initiated');
        } else {
          res.status(200).send('Not main branch, ignored');
        }
      } catch (error) {
        logger.error('Webhook error:', error);
        res.status(500).send('Internal error');
      }
    });

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // Manual update trigger (protected)
    this.app.post('/update/manual', async (req: Request, res: Response): Promise<void> => {
      const token = req.headers['x-update-token'];

      if (token !== process.env.MANUAL_UPDATE_TOKEN) {
        res.status(401).send('Unauthorized');
        return;
      }

      logger.info('Manual update triggered');
      await this.notifyDiscord('🔧 Manual update triggered by admin');
      this.performUpdate(null);

      res.status(200).send('Update initiated');
    });
  }

  private verifyGitHubSignature(req: express.Request): boolean {
    if (!this.webhookSecret) {
      // No secret configured, skip verification (not recommended for production)
      return true;
    }

    const signature = req.headers['x-hub-signature-256'] as string;
    if (!signature) return false;

    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const digest = 'sha256=' + hmac.update(req.body).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  }

  private async performUpdate(payload: any) {
    const startTime = Date.now();
    const steps = [];

    try {
      // Step 1: Git pull
      logger.info('Step 1: Pulling latest changes...');
      steps.push('✅ Git pull successful');
      const { stdout: gitOutput } = await execAsync('git pull origin main', {
        cwd: process.cwd()
      });
      logger.info('Git output:', gitOutput);

      // Check if there were actually changes
      if (gitOutput.includes('Already up to date')) {
        await this.notifyDiscord('✅ Already up to date! No restart needed.');
        return;
      }

      // Step 2: Install dependencies (only if package.json changed)
      if (payload?.commits?.some((c: any) =>
        c.modified?.includes('package.json') ||
        c.added?.includes('package.json')
      )) {
        logger.info('Step 2: Installing dependencies...');
        await execAsync('npm install --production', {
          cwd: process.cwd()
        });
        steps.push('✅ Dependencies updated');
      }

      // Step 3: Build TypeScript
      logger.info('Step 3: Building TypeScript...');
      await execAsync('npm run build', {
        cwd: process.cwd()
      });
      steps.push('✅ Build successful');

      // Step 4: Prepare summary
      const updateTime = ((Date.now() - startTime) / 1000).toFixed(1);
      const summary = this.createUpdateSummary(payload, steps, updateTime);

      // Step 5: Notify and restart
      await this.notifyDiscord(summary);

      // Give time for the message to send
      setTimeout(() => {
        logger.info('Restarting bot...');
        process.exit(0); // PM2 will restart the process
      }, 2000);

    } catch (error: any) {
      logger.error('Update failed:', error);
      await this.notifyDiscord(
        `❌ **Update Failed!**\n\`\`\`${error.message}\`\`\`\nManual intervention required.`
      );
    }
  }

  private createUpdateSummary(payload: any, steps: string[], updateTime: string): string {
    let summary = '✅ **Update Complete!**\n\n';

    if (payload) {
      summary += '**Changes:**\n';
      const commits = payload.commits?.slice(0, 5) || [];
      commits.forEach((commit: any) => {
        const message = commit.message.split('\n')[0]; // First line only
        summary += `• ${message} (by ${commit.author.name})\n`;
      });
      summary += '\n';
    }

    summary += '**Update Steps:**\n';
    steps.forEach(step => {
      summary += `${step}\n`;
    });

    summary += `\n⏱️ Update took ${updateTime}s\n`;
    summary += '🔄 Restarting bot now...';

    return summary;
  }

  private async notifyDiscord(message: string) {
    if (!this.updateChannelId) return;

    try {
      const channel = await this.client.channels.fetch(this.updateChannelId);
      if (channel && 'send' in channel) {
        await (channel as TextChannel).send(message);
      }
    } catch (error) {
      logger.error('Failed to send Discord notification:', error);
    }
  }

  public start() {
    this.app.listen(this.port, '0.0.0.0', () => {
      logger.info(`Auto-update webhook server listening on port ${this.port}`);
    });
  }

  public stop() {
    // Cleanup if needed
  }
}

// Slash command for checking update status
export function createUpdateCommand() {
  return {
    name: 'update',
    description: 'Bot update management',
    options: [
      {
        name: 'status',
        description: 'Check current version and update status',
        type: 1, // SUB_COMMAND
      },
      {
        name: 'check',
        description: 'Check for available updates',
        type: 1,
      },
      {
        name: 'trigger',
        description: 'Manually trigger an update (admin only)',
        type: 1,
      }
    ],
    async execute(interaction: any) {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'status':
          const uptimeHours = (process.uptime() / 3600).toFixed(1);
          await interaction.reply({
            embeds: [{
              title: '🤖 Bot Status',
              fields: [
                { name: 'Version', value: process.env.BOT_VERSION || 'v2.0.0', inline: true },
                { name: 'Uptime', value: `${uptimeHours} hours`, inline: true },
                { name: 'Auto-Update', value: '✅ Enabled', inline: true },
                { name: 'Last Restart', value: new Date(Date.now() - process.uptime() * 1000).toLocaleString(), inline: false }
              ],
              color: 0x00ff00,
              timestamp: new Date().toISOString()
            }]
          });
          break;

        case 'check':
          await interaction.deferReply();
          try {
            const { stdout } = await execAsync('git fetch && git status -uno');
            const behindMatch = stdout.match(/Your branch is behind .* by (\d+) commit/);

            if (behindMatch) {
              await interaction.editReply({
                embeds: [{
                  title: '📦 Updates Available!',
                  description: `${behindMatch[1]} commit(s) behind. Updates will be applied automatically on next push.`,
                  color: 0xffff00
                }]
              });
            } else {
              await interaction.editReply({
                embeds: [{
                  title: '✅ Up to Date',
                  description: 'Bot is running the latest version.',
                  color: 0x00ff00
                }]
              });
            }
          } catch (error) {
            await interaction.editReply('❌ Failed to check for updates');
          }
          break;

        case 'trigger':
          // Check if user is admin
          if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            await interaction.reply({ content: '❌ Admin permission required', ephemeral: true });
            return;
          }

          await interaction.reply('🔄 Triggering manual update...');

          // Trigger update via internal endpoint
          try {
            await fetch(`http://localhost:${process.env.WEBHOOK_PORT || 3001}/update/manual`, {
              method: 'POST',
              headers: {
                'x-update-token': process.env.MANUAL_UPDATE_TOKEN || ''
              }
            });
          } catch (error) {
            logger.error('Failed to trigger manual update:', error);
          }
          break;
      }
    }
  };
}