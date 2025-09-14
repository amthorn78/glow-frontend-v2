#!/usr/bin/env node
// F8: Auth Smoke Test - Validate production contracts
// T-UI-001 Phase 5B - Ensure auth endpoints work correctly

const https = require('https');
const http = require('http');

// F8: Smoke test configuration
const SMOKE_CONFIG = {
  baseUrl: process.env.SMOKE_BASE_URL || 'https://glowme.io',
  timeout: 10000,
  retries: 2
};

// F8: HTTP request helper
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            raw: data,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(SMOKE_CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// F8: Parse URL helper
function parseUrl(url) {
  const parsed = new URL(url);
  return {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname + parsed.search
  };
}

// F8: Smoke test cases
const SMOKE_TESTS = [
  {
    name: 'Health Check',
    description: 'Verify API is responding',
    async run() {
      const url = `${SMOKE_CONFIG.baseUrl}/api/health`;
      const options = {
        ...parseUrl(url),
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      };
      
      const response = await makeRequest(options);
      
      if (response.status !== 200) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      return { status: 'healthy', response_time: Date.now() };
    }
  },
  
  {
    name: 'Unauthenticated /me',
    description: 'GET /api/auth/me (unauth) → 401 JSON',
    async run() {
      const url = `${SMOKE_CONFIG.baseUrl}/api/auth/me`;
      const options = {
        ...parseUrl(url),
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      };
      
      const response = await makeRequest(options);
      
      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`);
      }
      
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Expected JSON response, got non-JSON');
      }
      
      if (response.data.code !== 'AUTH_REQUIRED') {
        throw new Error(`Expected AUTH_REQUIRED code, got ${response.data.code}`);
      }
      
      return { status: 'unauthenticated', code: response.data.code };
    }
  },
  
  {
    name: 'Login Contract',
    description: 'POST /api/auth/login → 200 with Set-Cookie',
    async run() {
      const url = `${SMOKE_CONFIG.baseUrl}/api/auth/login`;
      const options = {
        ...parseUrl(url),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@glowme.app',
          password: 'admin123'
        })
      };
      
      const response = await makeRequest(options);
      
      if (response.status !== 200) {
        throw new Error(`Login failed: ${response.status} - ${response.data?.error || 'Unknown error'}`);
      }
      
      if (!response.data || !response.data.user) {
        throw new Error('Login response missing user data');
      }
      
      const setCookie = response.headers['set-cookie'];
      if (!setCookie || !setCookie.some(cookie => cookie.includes('glow_session'))) {
        throw new Error('Login response missing session cookie');
      }
      
      // Validate cookie attributes
      const sessionCookie = setCookie.find(cookie => cookie.includes('glow_session'));
      if (!sessionCookie.includes('HttpOnly')) {
        throw new Error('Session cookie missing HttpOnly attribute');
      }
      
      if (!sessionCookie.includes('Secure') && SMOKE_CONFIG.baseUrl.startsWith('https')) {
        throw new Error('Session cookie missing Secure attribute for HTTPS');
      }
      
      return { 
        status: 'authenticated', 
        user: response.data.user.email,
        cookie_attributes: sessionCookie
      };
    }
  },
  
  {
    name: 'Logout Contract',
    description: 'POST /api/auth/logout → 200',
    async run() {
      // Note: This test assumes we have a valid session from previous test
      // In a real CI environment, we'd need to login first or use a test session
      
      const url = `${SMOKE_CONFIG.baseUrl}/api/auth/logout`;
      const options = {
        ...parseUrl(url),
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        }
      };
      
      const response = await makeRequest(options);
      
      // Logout should succeed even without valid session
      if (response.status !== 200) {
        throw new Error(`Logout failed: ${response.status}`);
      }
      
      return { status: 'logged_out' };
    }
  }
];

// F8: Run smoke tests
async function runSmokeTests() {
  console.log('[F8_SMOKE] Starting auth contract smoke tests...');
  console.log(`[F8_SMOKE] Target: ${SMOKE_CONFIG.baseUrl}`);
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  for (const test of SMOKE_TESTS) {
    console.log(`\n🧪 [F8_SMOKE] Running: ${test.name}`);
    console.log(`   ${test.description}`);
    
    try {
      const startTime = Date.now();
      const result = await test.run();
      const duration = Date.now() - startTime;
      
      console.log(`✅ [F8_SMOKE] PASSED: ${test.name} (${duration}ms)`);
      console.log(`   Result: ${JSON.stringify(result)}`);
      
      results.push({
        name: test.name,
        status: 'passed',
        duration,
        result
      });
      
      passed++;
      
    } catch (error) {
      console.error(`❌ [F8_SMOKE] FAILED: ${test.name}`);
      console.error(`   Error: ${error.message}`);
      
      results.push({
        name: test.name,
        status: 'failed',
        error: error.message
      });
      
      failed++;
    }
  }
  
  console.log(`\n📊 [F8_SMOKE] Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.error('💥 [F8_SMOKE] FAILED: Auth contracts are broken');
    
    // Emit telemetry
    console.log('[AUTH_BREADCRUMB] ci.smoke.fail', JSON.stringify({ 
      passed,
      failed,
      results,
      timestamp: new Date().toISOString()
    }));
    
    process.exit(1);
  } else {
    console.log('✅ [F8_SMOKE] PASSED: All auth contracts working');
    
    // Emit telemetry
    console.log('[AUTH_BREADCRUMB] ci.smoke.pass', JSON.stringify({ 
      passed,
      results,
      timestamp: new Date().toISOString()
    }));
    
    process.exit(0);
  }
}

// F8: Execute if run directly
if (require.main === module) {
  runSmokeTests().catch(error => {
    console.error('[F8_SMOKE] Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { runSmokeTests, SMOKE_TESTS };

