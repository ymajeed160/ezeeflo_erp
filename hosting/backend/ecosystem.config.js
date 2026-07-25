/**
 * PM2 Ecosystem File for ERP MT Suite Backend
 *
 * PM2 is a production process manager for Node.js apps.
 * It handles: auto-restart on crash, log management, clustering, zero-downtime reload.
 *
 * Commands:
 *   pm2 start ecosystem.config.js          # Start in production
 *   pm2 start ecosystem.config.js --env production
 *   pm2 status                             # View all processes
 *   pm2 logs ERP-Backend                   # View logs
 *   pm2 reload ecosystem.config.js         # Zero-downtime reload
 *   pm2 stop ERP-Backend                   # Stop
 *   pm2 delete ERP-Backend                 # Remove from PM2
 *
 * Install PM2: npm install -g pm2
 */

module.exports = {
  apps: [
    {
      name: 'ERP-Backend',
      script: '../../back-end/server.js',
      cwd: __dirname,
      node_args: '--max-old-space-size=4096',

      // ---- Environment ----
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // ---- Process Management ----
      instances: 1,                // Set to 'max' to use all CPU cores (cluster mode)
      exec_mode: 'fork',           // Use 'cluster' for multi-core
      max_restarts: 10,
      restart_delay: 3000,         // Wait 3s before restarting
      max_memory_restart: '1G',    // Auto-restart if memory exceeds 1GB
      kill_timeout: 5000,          // Wait 5s for graceful shutdown

      // ---- Logging ----
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      log_type: 'json',

      // ---- Watch (disabled in production) ----
      watch: false,

      // ---- Other ----
      autorestart: true,
      cron_restart: '0 3 * * *',   // Optional: restart daily at 3 AM
      shutdown_with_message: true,
    },
  ],
};
