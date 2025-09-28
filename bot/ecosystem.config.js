module.exports = {
  apps: [{
    name: 'nrghax-bot',
    script: './dist/index.js',
    cwd: '/home/coder/.ssh/code/mine/nrghax/bot',

    // Restart settings
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',

    // Environment variables
    env: {
      NODE_ENV: 'production'
    },

    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,

    // Auto-restart on crash
    min_uptime: '10s',
    max_restarts: 5,

    // Pre-setup command
    pre_setup: 'npm install && npm run build'
  }]
};