#!/usr/bin/env node
/**
 * Production-Grade Performance Benchmarking Script
 * Tests API endpoints with real authentication and database queries
 * 
 * Features:
 * - Automatic authentication with test credentials
 * - Real database query execution validation
 * - Separate cached and uncached benchmarking
 * - Response validation (fails if no 2xx responses)
 * - Comprehensive reporting
 * 
 * Usage:
 *   npm install -g autocannon
 *   node benchmark.js
 * 
 * Environment Variables:
 *   API_URL=http://localhost:5000  (default)
 *   BENCHMARK_USER=vet@pawmate.com (default)
 *   BENCHMARK_PASSWORD=password123 (default)
 *   BENCHMARK_DURATION=30          (seconds, default)
 *   BENCHMARK_CONNECTIONS=10       (default)
 *   SKIP_CACHE_TEST=false          (skip uncached test)
 */

const autocannon = require('autocannon');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_DURATION = parseInt(process.env.BENCHMARK_DURATION || '30', 10);
const CONNECTIONS = parseInt(process.env.BENCHMARK_CONNECTIONS || '10', 10);
const PIPELINING = 1;

// Test user credentials (from seed data)
const TEST_CREDENTIALS = {
  'pet-owner': {
    email: process.env.BENCHMARK_USER || 'owner@pawmate.com',
    password: process.env.BENCHMARK_PASSWORD || 'password123',
    role: 'pet-owner'
  },
  'vet': {
    email: 'vet@pawmate.com',
    password: 'password123',
    role: 'vet'
  },
  'admin': {
    email: 'admin@pawmate.com',
    password: 'password123',
    role: 'admin'
  }
};

// Global token cache
const tokenCache = new Map();

/**
 * Make HTTP request (supports both http and https)
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Authenticate and get JWT token
 */
async function authenticate(role = 'vet') {
  const cacheKey = `token_${role}`;
  
  // Check cache first
  if (tokenCache.has(cacheKey)) {
    const cached = tokenCache.get(cacheKey);
    // Token expires in 30 days, but we'll refresh every hour for safety
    if (Date.now() - cached.timestamp < 3600000) {
      return cached.token;
    }
  }

  const credentials = TEST_CREDENTIALS[role];
  if (!credentials) {
    throw new Error(`Invalid role: ${role}. Must be one of: pet-owner, vet, admin`);
  }

  console.log(`🔐 Authenticating as ${credentials.email} (${role})...`);
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        email: credentials.email,
        password: credentials.password
      }
    });

    if (response.status !== 200) {
      // Try registering if login fails
      console.log(`⚠️  Login failed (${response.status}), attempting registration...`);
      
      const registerResponse = await makeRequest(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          name: credentials.role === 'vet' ? 'Dr. Test Vet' : credentials.role === 'admin' ? 'Test Admin' : 'Test Owner',
          email: credentials.email,
          password: credentials.password,
          role: credentials.role
        }
      });

      if (registerResponse.status === 201 || registerResponse.status === 200) {
        const token = registerResponse.data.token;
        if (token) {
          tokenCache.set(cacheKey, { token, timestamp: Date.now() });
          console.log(`✅ Registered and authenticated as ${credentials.email}`);
          return token;
        }
      }
      
      throw new Error(`Authentication failed: ${registerResponse.status} - ${JSON.stringify(registerResponse.data)}`);
    }

    const token = response.data.token;
    if (!token) {
      throw new Error('No token received from login response');
    }

    tokenCache.set(cacheKey, { token, timestamp: Date.now() });
    console.log(`✅ Authenticated as ${credentials.email}`);
    return token;

  } catch (error) {
    console.error(`❌ Authentication error:`, error.message);
    throw error;
  }
}

/**
 * Verify endpoint is accessible with token
 */
async function verifyEndpoint(endpoint, token) {
  try {
    const testUrl = endpoint.path + (endpoint.requiresCacheBypass ? '?nocache=true' : '');
    const response = await makeRequest(`${API_BASE_URL}${testUrl}`, {
      method: endpoint.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...endpoint.headers
      }
    });

    if (response.status >= 200 && response.status < 300) {
      return { valid: true, status: response.status };
    } else {
      return { valid: false, status: response.status, error: response.data };
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Run benchmark for a single endpoint
 */
async function benchmarkEndpoint(endpoint, token, options = {}) {
  const { skipValidation = false, label = '' } = options;
  const displayName = label ? `${endpoint.name} (${label})` : endpoint.name;
  
  console.log(`\n🚀 Benchmarking: ${displayName}`);
  console.log(`   ${endpoint.method} ${endpoint.path}${endpoint.requiresCacheBypass ? '?nocache=true' : ''}`);
  
  // Verify endpoint before benchmarking
  if (!skipValidation && endpoint.requiresAuth !== false) {
    const verification = await verifyEndpoint(endpoint, token);
    if (!verification.valid) {
      console.log(`   ⚠️  WARNING: Endpoint returned ${verification.status}`);
      if (verification.error) {
        console.log(`   Error: ${JSON.stringify(verification.error).substring(0, 100)}`);
      }
    }
  }

  console.log('   Running...');

  const path = endpoint.path + (endpoint.requiresCacheBypass ? '?nocache=true' : '');
  
  const config = {
    url: `${API_BASE_URL}${path}`,
    method: endpoint.method,
    connections: CONNECTIONS,
    duration: TEST_DURATION,
    pipelining: PIPELINING,
    headers: {
      ...(endpoint.requiresAuth !== false ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(endpoint.headers || {})
    }
  };

  try {
    const result = await autocannon(config);
    
    // Validate results
    const has2xx = result['2xx'] > 0;
    const errorRate = result['4xx'] + result['5xx'];
    const errorPercentage = (errorRate / result.requests.total) * 100;
    
    // Fail if no successful requests
    if (!has2xx && endpoint.requiresAuth !== false) {
      throw new Error(`❌ VALIDATION FAILED: No 2xx responses! Got ${result['4xx']} 4xx and ${result['5xx']} 5xx`);
    }
    
    // Warn if error rate is high
    if (errorPercentage > 10) {
      console.log(`   ⚠️  WARNING: High error rate: ${errorPercentage.toFixed(1)}%`);
    }
    
    // Calculate metrics
    const avgLatency = result.latency.mean / 1000; // Convert to ms
    const p99Latency = result.latency.p99_9 / 1000;
    const p95Latency = result.latency.p99 / 1000;
    const p50Latency = result.latency.p50 / 1000;
    const requestsPerSecond = result.requests.average;
    const throughput = result.throughput.average / 1024 / 1024; // MB/s
    
    // Performance assessment
    let performance = '🟢 EXCELLENT';
    let performanceNote = '';
    if (avgLatency > 100) {
      performance = '🔴 POOR';
      performanceNote = ' (Target: <50ms)';
    } else if (avgLatency > 50) {
      performance = '🟡 ACCEPTABLE';
      performanceNote = ' (Target: <50ms)';
    } else if (avgLatency > 20) {
      performance = '🟠 GOOD';
      performanceNote = ' (Target: <50ms)';
    } else if (avgLatency < 1) {
      performance = '⚠️  SUSPICIOUS';
      performanceNote = ' (Likely cached or mock response)';
    }
    
    console.log('\n   📊 Results:');
    console.log(`   ${performance}${performanceNote}`);
    console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Average Latency:    ${avgLatency.toFixed(2)}ms`);
    console.log(`   P50 Latency:        ${p50Latency.toFixed(2)}ms`);
    console.log(`   P95 Latency:        ${p95Latency.toFixed(2)}ms`);
    console.log(`   P99 Latency:        ${p99Latency.toFixed(2)}ms`);
    console.log(`   Requests/sec:       ${requestsPerSecond.toFixed(0)}`);
    console.log(`   Throughput:         ${throughput.toFixed(2)} MB/s`);
    console.log(`   Total Requests:     ${result.requests.total}`);
    console.log(`   HTTP 2xx:           ${result['2xx']} ✅`);
    console.log(`   HTTP 4xx:           ${result['4xx']} ${result['4xx'] > 0 ? '⚠️' : ''}`);
    console.log(`   HTTP 5xx:           ${result['5xx']} ${result['5xx'] > 0 ? '⚠️' : ''}`);
    console.log(`   Errors:             ${result.errors}`);
    
    return {
      endpoint: displayName,
      path: endpoint.path,
      cached: !endpoint.requiresCacheBypass,
      avgLatency,
      p50Latency,
      p95Latency,
      p99Latency,
      requestsPerSecond,
      throughput,
      totalRequests: result.requests.total,
      errors: result.errors,
      status2xx: result['2xx'],
      status4xx: result['4xx'],
      status5xx: result['5xx'],
      errorRate: errorPercentage,
      performance,
      valid: has2xx
    };
  } catch (error) {
    console.error(`   ❌ Error benchmarking ${displayName}:`, error.message);
    return {
      endpoint: displayName,
      path: endpoint.path,
      error: error.message,
      valid: false
    };
  }
}

/**
 * Test endpoints configuration
 */
const endpoints = [
  {
    name: 'Health Check',
    path: '/health',
    method: 'GET',
    requiresAuth: false,
    expectedStatus: 200,
    testBothModes: false
  },
  {
    name: 'Get Appointments',
    path: '/api/appointments',
    method: 'GET',
    requiresAuth: true,
    requiredRole: 'vet',
    expectedStatus: 200,
    testBothModes: true
  },
  {
    name: 'Get Pets',
    path: '/api/pets',
    method: 'GET',
    requiresAuth: true,
    requiredRole: 'pet-owner',
    expectedStatus: 200,
    testBothModes: true
  },
  {
    name: 'Get Prescriptions',
    path: '/api/prescriptions',
    method: 'GET',
    requiresAuth: true,
    requiredRole: 'vet',
    expectedStatus: 200,
    testBothModes: true
  },
  {
    name: 'Get Messages',
    path: '/api/messages/695d083a5b261659264e3981', // This will need a real user ID
    method: 'GET',
    requiresAuth: true,
    requiredRole: 'vet',
    expectedStatus: 200,
    testBothModes: false
  }
];

/**
 * Run all benchmarks and generate report
 */
async function runBenchmarks() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║    PAWMATE API Performance Benchmark Suite (Production) ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\n📍 Target: ${API_BASE_URL}`);
  console.log(`⏱️  Duration: ${TEST_DURATION}s per endpoint`);
  console.log(`🔗 Connections: ${CONNECTIONS}`);
  console.log(`\n🔐 Authenticating test users...\n`);

  // Authenticate all required roles
  const tokens = {};
  try {
    for (const role of ['vet', 'pet-owner', 'admin']) {
      tokens[role] = await authenticate(role);
    }
  } catch (error) {
    console.error('\n❌ Authentication failed. Please ensure:');
    console.error('   1. API server is running');
    console.error('   2. Database is accessible');
    console.error('   3. Test users exist (run: npm run seed)');
    process.exit(1);
  }

  console.log(`\n✅ Authentication successful\n`);
  console.log(`⚠️  Testing real database queries with actual authentication\n`);

  const results = [];
  const skipCacheTest = process.env.SKIP_CACHE_TEST === 'true';
  
  for (const endpoint of endpoints) {
    // Get appropriate token for this endpoint
    const role = endpoint.requiredRole || 'vet';
    const token = tokens[role];
    
    if (!token) {
      console.log(`⚠️  Skipping ${endpoint.name} - no token for role: ${role}`);
      continue;
    }

    // Test cached version first
    endpoint.requiresCacheBypass = false;
    const cachedResult = await benchmarkEndpoint(endpoint, token, { label: 'Cached' });
    if (cachedResult) {
      results.push(cachedResult);
    }
    
    // Test uncached version if required
    if (endpoint.testBothModes && !skipCacheTest) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for cache to settle
      
      endpoint.requiresCacheBypass = true;
      const uncachedResult = await benchmarkEndpoint(endpoint, token, { label: 'Uncached' });
      if (uncachedResult) {
        results.push(uncachedResult);
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Generate summary report
  console.log('\n\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    SUMMARY REPORT                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const validResults = results.filter(r => r.valid !== false);
  const invalidResults = results.filter(r => r.valid === false);
  
  if (invalidResults.length > 0) {
    console.log('❌ FAILED ENDPOINTS:');
    invalidResults.forEach(r => {
      console.log(`   ${r.endpoint}: ${r.error || 'No 2xx responses'}`);
    });
    console.log('');
  }

  if (validResults.length > 0) {
    console.log('Endpoint'.padEnd(40) + 'Mode'.padEnd(10) + 'Avg Latency'.padEnd(15) + '2xx/Total'.padEnd(15) + 'Status');
    console.log('─'.repeat(95));
    
    validResults.forEach(r => {
      const mode = r.cached ? 'Cached' : 'Uncached';
      const latency = `${r.avgLatency.toFixed(2)}ms`.padEnd(15);
      const success = `${r.status2xx}/${r.totalRequests}`.padEnd(15);
      console.log(`${r.endpoint.padEnd(40)}${mode.padEnd(10)}${latency}${success}${r.performance}`);
    });
    
    // Calculate metrics
    const cachedResults = validResults.filter(r => r.cached);
    const uncachedResults = validResults.filter(r => !r.cached);
    
    const avgCachedLatency = cachedResults.length > 0
      ? cachedResults.reduce((sum, r) => sum + r.avgLatency, 0) / cachedResults.length
      : 0;
    const avgUncachedLatency = uncachedResults.length > 0
      ? uncachedResults.reduce((sum, r) => sum + r.avgLatency, 0) / uncachedResults.length
      : 0;
    
    const totalRPS = validResults.reduce((sum, r) => sum + r.requestsPerSecond, 0);
    const totalErrors = validResults.reduce((sum, r) => sum + r.errors, 0);
    const total2xx = validResults.reduce((sum, r) => sum + r.status2xx, 0);
    const totalRequests = validResults.reduce((sum, r) => sum + r.totalRequests, 0);
    
    console.log('\n' + '─'.repeat(95));
    console.log(`Cached Average Latency:   ${avgCachedLatency > 0 ? avgCachedLatency.toFixed(2) + 'ms' : 'N/A'}`);
    console.log(`Uncached Average Latency: ${avgUncachedLatency > 0 ? avgUncachedLatency.toFixed(2) + 'ms' : 'N/A'}`);
    console.log(`Total Requests/sec:       ${totalRPS.toFixed(0)}`);
    console.log(`Total Successful (2xx):   ${total2xx} / ${totalRequests}`);
    console.log(`Total Errors:             ${totalErrors}`);
    
    // Performance targets check
    console.log('\n📋 Performance Targets:');
    const cachedPass = avgCachedLatency > 0 && avgCachedLatency < 10;
    const uncachedPass = avgUncachedLatency > 0 && avgUncachedLatency < 50;
    console.log(`   ${cachedPass ? '✅' : '❌'} <10ms cached:    ${cachedPass ? 'PASS' : 'FAIL'} (${avgCachedLatency.toFixed(2)}ms)`);
    console.log(`   ${uncachedPass ? '✅' : '❌'} <50ms uncached:  ${uncachedPass ? 'PASS' : 'FAIL'} (${avgUncachedLatency.toFixed(2)}ms)`);
    console.log(`   ${total2xx > 0 ? '✅' : '❌'} All endpoints return 2xx: ${total2xx === totalRequests ? 'PASS' : 'FAIL'} (${total2xx}/${totalRequests})`);
  }
  
  // Save results to file
  const fs = require('fs');
  const reportPath = './benchmark-results.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: {
      apiUrl: API_BASE_URL,
      duration: TEST_DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING
    },
    results: validResults,
    summary: {
      cachedAverageLatency: avgCachedLatency,
      uncachedAverageLatency: avgUncachedLatency,
      totalRPS,
      totalErrors,
      total2xx,
      totalRequests,
      validEndpoints: validResults.length,
      invalidEndpoints: invalidResults.length
    }
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${reportPath}`);
  
  // Exit with error if there are failures
  if (invalidResults.length > 0 || (validResults.length > 0 && total2xx === 0)) {
    console.log('\n❌ Benchmark validation failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All benchmarks passed!');
  }
}

// Check if autocannon is available
async function checkDependencies() {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    await execPromise('autocannon --version');
    return true;
  } catch (error) {
    console.error('\n❌ autocannon is not installed!');
    console.log('\nInstall it with:');
    console.log('   npm install -g autocannon');
    console.log('\nOr install locally and run:');
    console.log('   npx autocannon -c 10 -d 30 http://localhost:5000/health\n');
    return false;
  }
}

// Main execution
(async () => {
  const hasDependencies = await checkDependencies();
  if (hasDependencies) {
    try {
      await runBenchmarks();
    } catch (error) {
      console.error('\n❌ Benchmark suite failed:', error.message);
      process.exit(1);
    }
  } else {
    process.exit(1);
  }
})();
