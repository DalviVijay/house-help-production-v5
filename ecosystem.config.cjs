// PM2 Production Ecosystem Config
// Usage: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "house-help-api",
      script: "./apps/backend/dist/server.js",
      instances: "max",
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      max_memory_restart: "512M",
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
      kill_timeout: 5000,
    },
  ],
};
