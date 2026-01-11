// PM2 Configuration for Production Deployment
// Supports clustering for multi-core CPU utilization
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'pawmate-api',
    script: './server.js',
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1, // Use all CPU cores in production
    exec_mode: 'cluster', // Enable cluster mode
    watch: process.env.NODE_ENV === 'development',
    ignore_watch: ['node_modules', 'uploads', '*.log'],
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Performance & Resource Limits
    max_memory_restart: '500M', // Restart if memory exceeds 500MB
    min_uptime: '10s', // Consider app stable after 10s
    max_restarts: 10, // Max restarts within window
    restart_delay: 4000, // Wait 4s before restart
    
    // Advanced PM2 features
    kill_timeout: 5000, // Wait 5s for graceful shutdown
    listen_timeout: 3000, // Wait 3s for app to listen
    shutdown_with_message: true,
    
    // Health check (optional - uncomment if you add health endpoint)
    // health_check_url: 'http://localhost:5000/health',
    // health_check_grace_period: 3000,
    
    // Environment variables
    env_file: './.env',
    
    // Source map support for better error tracking
    source_map_support: true,
    
    // Auto restart on file changes (dev only)
    watch_delay: 1000,
    
    // Advanced cluster settings
    instance_var: 'INSTANCE_ID',
    
    // Node.js optimizations
    node_args: [
      '--max-old-space-size=512', // Limit heap size to 512MB per instance
      '--optimize-for-size', // Optimize for memory usage
      '--gc-interval=100' // Garbage collection interval
    ]
  }]
};

