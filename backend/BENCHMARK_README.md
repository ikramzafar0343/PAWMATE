# Performance Benchmarking Guide

## Overview

The benchmark script (`benchmark.js`) provides production-grade performance testing with:
- **Real authentication** using test credentials
- **Actual database queries** (not mocks)
- **Separate cached/uncached testing**
- **Response validation** (fails if no 2xx responses)
- **Comprehensive reporting**

## Prerequisites

1. **Install autocannon:**
   ```bash
   npm install -g autocannon
   # Or use npx
   npx autocannon --version
   ```

2. **Ensure API server is running:**
   ```bash
   cd backend
   npm start
   # Or with PM2
   npm run pm2:start
   ```

3. **Verify test users exist:**
   ```bash
   # Users are auto-created on first run, or manually:
   npm run seed
   ```

## Quick Start

```bash
cd backend
node benchmark.js
```

## Configuration

### Environment Variables

```bash
# API endpoint (default: http://localhost:5000)
API_URL=http://localhost:5000

# Test user credentials (default: owner@pawmate.com / password123)
BENCHMARK_USER=owner@pawmate.com
BENCHMARK_PASSWORD=password123

# Benchmark settings
BENCHMARK_DURATION=30        # seconds per endpoint
BENCHMARK_CONNECTIONS=10     # concurrent connections

# Skip uncached tests (default: false)
SKIP_CACHE_TEST=false
```

### Example: Custom Configuration

```bash
API_URL=http://localhost:5000 \
BENCHMARK_DURATION=60 \
BENCHMARK_CONNECTIONS=20 \
node benchmark.js
```

## Test Users

The benchmark automatically authenticates with these test users (from seed data):

| Role | Email | Password | Use Case |
|------|-------|----------|----------|
| Pet Owner | `owner@pawmate.com` | `password123` | Testing owner-specific endpoints |
| Veterinarian | `vet@pawmate.com` | `password123` | Testing vet-specific endpoints |
| Admin | `admin@pawmate.com` | `password123` | Testing admin endpoints |

**Note:** Users are automatically registered if they don't exist.

## What Gets Tested

### Endpoints Benchmarked

1. **Health Check** (`/health`)
   - No authentication required
   - Tests server responsiveness

2. **Get Appointments** (`/api/appointments`)
   - Requires authentication (vet role)
   - Tests with **cached** and **uncached** modes
   - Validates database query execution

3. **Get Pets** (`/api/pets`)
   - Requires authentication (pet-owner role)
   - Tests with **cached** and **uncached** modes

4. **Get Prescriptions** (`/api/prescriptions`)
   - Requires authentication (vet role)
   - Tests with **cached** and **uncached** modes

5. **Get Messages** (`/api/messages/:userId`)
   - Requires authentication (vet role)
   - Tests cached mode only

### Cache Bypass Testing

Endpoints marked with `testBothModes: true` are tested in two modes:

1. **Cached** (default)
   - Tests Redis/memory cache performance
   - Target: <10ms

2. **Uncached** (`?nocache=true`)
   - Bypasses cache, executes real database queries
   - Target: <50ms

## Output

### Console Output

The benchmark provides real-time console output:

```
🚀 Benchmarking: Get Appointments (Cached)
   GET /api/appointments
   Running...

   📊 Results:
   🟢 EXCELLENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Average Latency:    8.45ms
   P50 Latency:        7.23ms
   P95 Latency:        12.34ms
   P99 Latency:        15.67ms
   Requests/sec:       1182
   Throughput:         2.34 MB/s
   Total Requests:     35460
   HTTP 2xx:           35460 ✅
   HTTP 4xx:           0 ⚠️
   HTTP 5xx:           0 ⚠️
   Errors:             0
```

### Summary Report

```
╔══════════════════════════════════════════════════════════╗
║                    SUMMARY REPORT                        ║
╚══════════════════════════════════════════════════════════╝

Endpoint                                  Mode      Avg Latency    2xx/Total        Status
───────────────────────────────────────────────────────────────────────────────────────────
Get Appointments (Cached)                 Cached    8.45ms         35460/35460     🟢 EXCELLENT
Get Appointments (Uncached)               Uncached  32.14ms        35460/35460     🟠 GOOD
Get Pets (Cached)                         Cached    6.23ms         35460/35460     🟢 EXCELLENT
Get Pets (Uncached)                       Uncached  28.45ms        35460/35460     🟠 GOOD

───────────────────────────────────────────────────────────────────────────────────────────
Cached Average Latency:   7.34ms
Uncached Average Latency: 30.30ms
Total Requests/sec:       4728
Total Successful (2xx):   141840 / 141840
Total Errors:             0

📋 Performance Targets:
   ✅ <10ms cached:    PASS (7.34ms)
   ✅ <50ms uncached:  PASS (30.30ms)
   ✅ All endpoints return 2xx: PASS (141840/141840)
```

### JSON Report

Results are saved to `benchmark-results.json`:

```json
{
  "timestamp": "2024-01-XXTXX:XX:XX.XXXZ",
  "config": {
    "apiUrl": "http://localhost:5000",
    "duration": 30,
    "connections": 10,
    "pipelining": 1
  },
  "results": [
    {
      "endpoint": "Get Appointments (Cached)",
      "path": "/api/appointments",
      "cached": true,
      "avgLatency": 8.45,
      "p50Latency": 7.23,
      "p95Latency": 12.34,
      "p99Latency": 15.67,
      "requestsPerSecond": 1182,
      "status2xx": 35460,
      "valid": true
    }
  ],
  "summary": {
    "cachedAverageLatency": 7.34,
    "uncachedAverageLatency": 30.30,
    "totalRPS": 4728,
    "total2xx": 141840,
    "validEndpoints": 8,
    "invalidEndpoints": 0
  }
}
```

## Validation

The benchmark automatically validates:

1. **Authentication Success**
   - Verifies JWT tokens are valid
   - Checks token expiration
   - Auto-registers users if needed

2. **Response Codes**
   - Fails if no 2xx responses received
   - Warns if error rate >10%
   - Validates expected status codes

3. **Database Execution**
   - Logs cache bypass for uncached tests
   - Validates MongoDB queries execute
   - Detects mock responses (<1ms latency)

4. **Cache Effectiveness**
   - Compares cached vs uncached latency
   - Validates cache hit/miss behavior
   - Confirms Redis is working

## Troubleshooting

### Issue: "Authentication failed"

**Solution:**
1. Ensure API server is running:
   ```bash
   curl http://localhost:5000/health
   ```

2. Verify database connection:
   ```bash
   # Check MongoDB connection in server logs
   ```

3. Manually seed users:
   ```bash
   npm run seed
   ```

### Issue: "No 2xx responses"

**Solution:**
1. Check if endpoint requires authentication:
   - Verify token is being sent in headers
   - Check token expiration

2. Verify endpoint exists:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/appointments
   ```

3. Check server logs for errors

### Issue: "Unrealistically low latency (<1ms)"

**Possible causes:**
- Endpoint returning cached/mock data
- Redis returning empty cache
- Database queries not executing

**Solution:**
1. Use `?nocache=true` to bypass cache
2. Check server logs for "[Performance]" messages
3. Verify MongoDB queries are executing

### Issue: "High error rate (>10%)"

**Solution:**
1. Check authentication tokens are valid
2. Verify database has test data
3. Check server logs for specific errors
4. Ensure Redis is accessible (if enabled)

## Advanced Usage

### Test Specific Endpoints Only

Edit `benchmark.js` to modify the `endpoints` array:

```javascript
const endpoints = [
  {
    name: 'Get Appointments',
    path: '/api/appointments',
    method: 'GET',
    requiresAuth: true,
    requiredRole: 'vet',
    testBothModes: true
  }
  // Add or remove endpoints as needed
];
```

### Custom Test Duration

```bash
BENCHMARK_DURATION=60 node benchmark.js  # 60 seconds per endpoint
```

### High Load Testing

```bash
BENCHMARK_CONNECTIONS=50 BENCHMARK_DURATION=120 node benchmark.js
```

### Skip Cache Tests

```bash
SKIP_CACHE_TEST=true node benchmark.js
```

## Performance Targets

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Cached Latency | <10ms | Check "Cached" results in summary |
| Uncached Latency | <50ms | Check "Uncached" results in summary |
| Cache Hit Rate | >80% | Compare cached vs uncached latency |
| Error Rate | <1% | Check "HTTP 2xx" vs "HTTP 4xx/5xx" |
| Success Rate | 100% | All endpoints should return 2xx |

## Integration with CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/benchmark.yml
name: Performance Benchmark

on: [push, pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install -g autocannon
      - run: cd backend && npm install
      - run: npm run seed
      - run: npm start &
      - run: sleep 5  # Wait for server to start
      - run: node benchmark.js
      - uses: actions/upload-artifact@v2
        with:
          name: benchmark-results
          path: backend/benchmark-results.json
```

## Best Practices

1. **Run benchmarks when:**
   - Before production deployment
   - After major code changes
   - When performance degrades

2. **Baseline metrics:**
   - Keep historical benchmark results
   - Compare before/after optimization
   - Track performance trends

3. **Environment consistency:**
   - Use same server hardware
   - Same database state
   - Similar network conditions

4. **Multiple runs:**
   - Run 3-5 times and average results
   - Account for warm-up time
   - Consider cold vs warm cache

## Support

For issues or questions:
1. Check server logs for errors
2. Verify environment variables
3. Test endpoints manually with curl
4. Review benchmark-results.json for details

