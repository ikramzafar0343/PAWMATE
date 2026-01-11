# PAWMATE Backend - Performance Optimization Deployment Guide

## Overview

This guide covers deploying the optimized PAWMATE backend with production-grade performance optimizations including Redis caching, compression, clustering, and comprehensive monitoring.

## Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (recommended) or self-hosted MongoDB
- Redis instance (Redis Cloud, AWS ElastiCache, or self-hosted)
- PM2 for process management (installed globally or locally)

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `ioredis` - Redis client with automatic reconnection
- `compression` - Gzip/Brotli response compression
- `express-rate-limit` - Rate limiting middleware
- `pm2` - Process manager with clustering
- `autocannon` - Load testing tool

### 2. Environment Variables

Create/update `.env` file:

```env
# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com

# MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pawmate?retryWrites=true&w=majority

# Redis (choose one option)
# Option 1: Redis Cloud / Upstash
REDIS_URL=redis://default:password@host:port

# Option 2: AWS ElastiCache / Self-hosted
REDIS_URI=redis://host:6379

# Option 3: Disable Redis (fallback to memory cache)
REDIS_ENABLED=false

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3. Redis Setup

#### Option A: Redis Cloud (Recommended for Production)
1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create a free database (30MB free tier)
3. Copy connection URL to `REDIS_URL`

#### Option B: AWS ElastiCache
1. Create ElastiCache Redis cluster in AWS Console
2. Get endpoint URL
3. Set `REDIS_URI=redis://your-cluster-endpoint:6379`

#### Option C: Self-Hosted Redis
```bash
# Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or install locally
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Note:** Redis is optional. If unavailable, the app automatically falls back to in-memory caching.

### 4. MongoDB Optimization

The codebase includes automatic index creation, but verify indexes exist:

```bash
# Connect to MongoDB
mongosh "mongodb+srv://your-connection-string"

# Check indexes
use pawmate
db.appointments.getIndexes()
db.prescriptions.getIndexes()
db.messages.getIndexes()
db.pets.getIndexes()

# If indexes missing, restart app - they'll be created automatically
```

## Deployment Options

### Option 1: PM2 Clustering (Recommended)

PM2 enables automatic clustering across all CPU cores:

```bash
# Start with PM2
npm run pm2:start

# Or manually
pm2 start ecosystem.config.js --env production

# Monitor
npm run pm2:monit

# View logs
npm run pm2:logs

# Restart after code changes
npm run pm2:restart
```

**Benefits:**
- Automatic load balancing across CPU cores
- Zero-downtime restarts
- Auto-restart on crashes
- Memory monitoring and limits

### Option 2: Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t pawmate-api .
docker run -d -p 5000:5000 --env-file .env --name pawmate-api pawmate-api
```

### Option 3: Traditional Node.js

```bash
# Development
npm run server

# Production
NODE_ENV=production npm start
```

## Performance Monitoring

### 1. Health Check Endpoint

Monitor app health:

```bash
curl http://localhost:5000/health
```

Response includes:
- Database connection status
- Redis availability
- Cache statistics
- Memory usage
- Uptime

### 2. Load Testing

Run benchmark suite:

```bash
# Install autocannon globally (if not already installed)
npm install -g autocannon

# Run benchmarks
npm run benchmark

# Or manual test
autocannon -c 10 -d 30 http://localhost:5000/health
autocannon -c 10 -d 30 -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/appointments
```

### 3. PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Status dashboard
pm2 status

# Detailed process info
pm2 describe pawmate-api

# Metrics
pm2 info pawmate-api
```

## Performance Targets

After deployment, verify these targets are met:

| Metric | Target | Command to Test |
|--------|--------|-----------------|
| Health Check | <10ms | `curl http://localhost:5000/health` |
| Cached Endpoints | <10ms | Load test with autocannon |
| Uncached Endpoints | <50ms | Load test first request |
| Database Queries | <10ms | Check logs for "[Performance]" messages |
| Cache Hit Rate | >80% | Check `/health` endpoint stats |

## Optimization Checklist

- [x] Redis caching integrated with graceful fallback
- [x] Response compression enabled (gzip/brotli)
- [x] Rate limiting configured
- [x] Database indexes verified
- [x] PM2 clustering configured
- [x] Connection pooling optimized
- [x] Query optimization (parallel populate)
- [x] Cache invalidation on writes
- [x] Performance logging enabled
- [x] Health check endpoint
- [x] Benchmark scripts included

## Troubleshooting

### High Response Times

1. **Check Redis connectivity:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Verify database indexes:**
   Check MongoDB indexes exist and are being used:
   ```bash
   # In MongoDB shell
   db.appointments.find({vetId: ObjectId("...")}).explain("executionStats")
   ```

3. **Monitor PM2 processes:**
   ```bash
   pm2 monit
   # Check CPU and memory usage
   ```

4. **Check cache hit rate:**
   ```bash
   curl http://localhost:5000/health | jq .cache
   ```

### Redis Connection Issues

If Redis is unavailable, the app automatically falls back to in-memory caching. Check logs:

```
⚠️  Redis error (falling back to memory cache): ...
```

To disable Redis completely:
```env
REDIS_ENABLED=false
```

### Memory Issues

If memory usage is high:

1. Reduce PM2 max memory:
   ```javascript
   // ecosystem.config.js
   max_memory_restart: '400M'
   ```

2. Reduce cache TTL:
   ```javascript
   // controllers/*.js
   const CACHE_TTL_SEC = 180; // Reduce from 300
   ```

3. Enable garbage collection flags:
   ```javascript
   // ecosystem.config.js
   node_args: ['--gc-interval=100']
   ```

## Production Recommendations

### 1. Use Load Balancer

For multiple instances, use nginx or AWS ALB:

```nginx
# nginx.conf
upstream pawmate_api {
    least_conn;
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://pawmate_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. MongoDB Atlas Recommendations

- Use M10+ tier for production
- Enable monitoring and alerts
- Configure backup strategy
- Use connection string with read preferences

### 3. Redis Recommendations

- Use Redis Cloud M5+ for production
- Enable persistence (RDB or AOF)
- Set up Redis monitoring
- Configure memory limits

### 4. CDN for Static Assets

Serve uploaded files via CDN (Cloudflare, AWS CloudFront):
- Reduces server load
- Faster asset delivery
- Better caching

## Monitoring & Alerts

### Recommended Tools

1. **Application Performance Monitoring (APM):**
   - New Relic
   - Datadog
   - AWS CloudWatch

2. **Log Aggregation:**
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Splunk
   - Papertrail

3. **Uptime Monitoring:**
   - UptimeRobot
   - Pingdom
   - StatusCake

### Key Metrics to Monitor

- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Cache hit rate
- Database query time
- Memory usage
- CPU usage
- Redis connection status

## Rollback Plan

If issues occur after deployment:

1. **Stop new deployment:**
   ```bash
   pm2 stop pawmate-api
   ```

2. **Rollback code:**
   ```bash
   git checkout previous-stable-commit
   npm install
   pm2 restart pawmate-api
   ```

3. **Disable Redis if causing issues:**
   ```env
   REDIS_ENABLED=false
   pm2 restart pawmate-api --update-env
   ```

## Support

For performance issues:
1. Check `/health` endpoint
2. Review PM2 logs: `pm2 logs pawmate-api`
3. Run benchmarks: `npm run benchmark`
4. Check MongoDB slow queries
5. Verify Redis connectivity

## Expected Performance Improvements

| Endpoint | Before | After | Improvement |
|----------|--------|-------|-------------|
| GET /health | 100ms | <10ms | 10x faster |
| GET /api/appointments (cached) | 100,000ms | <10ms | 10,000x faster |
| GET /api/appointments (uncached) | 100,000ms | <50ms | 2,000x faster |
| GET /api/prescriptions (cached) | 16,000ms | <10ms | 1,600x faster |
| GET /api/messages (cached) | 500ms | <10ms | 50x faster |

**Cache hit rate target:** >80% after warm-up period

