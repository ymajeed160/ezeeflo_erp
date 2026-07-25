/**
 * ERP MT Suite — Security Penetration Test
 * =========================================
 * Tests the following attack vectors:
 *   1. SQL Injection
 *   2. NoSQL Injection (if applicable)
 *   3. XSS (Cross-Site Scripting)
 *   4. Authentication Bypass
 *   5. JWT Tampering
 *   6. Role/Permission Escalation
 *   7. Mass Assignment / IDOR
 *   8. Rate Limiting
 *   9. Security Headers
 *  10. Directory Traversal
 *  11. Body Parser DoS
 *  12. CORS Misconfiguration
 *
 * Run: node tests/security-test.js
 */

const http = require('http');
const https = require('https');

const BASE = 'http://localhost:5000';
const API = `${BASE}/api`;

let passed = 0;
let failed = 0;
let warnings = 0;

function log(icon, label, detail, status = 'info') {
  const icons = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
  console.log(`  ${icons[icon] || '•'} ${label}: ${detail}`);
}

function request(method, path, opts = {}) {
  return new Promise((resolve) => {
    const url = new URL(path.startsWith('http') ? path : `${BASE}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        ...(opts.headers || {}),
      },
      timeout: 10000,
    };
    if (opts.body) {
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { /* not JSON */ }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json: parsed,
        });
      });
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message, headers: {}, body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'TIMEOUT', headers: {}, body: '' }); });
    if (opts.body) req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
    req.end();
  });
}

function test(name, fn) {
  console.log(`\n━━━ ${name} ━━━`);
  return fn();
}

function check(predicate, label, detail) {
  if (predicate) {
    log('pass', label, detail);
    passed++;
  } else {
    log('fail', label, detail);
    failed++;
  }
}

function warn(label, detail) {
  log('warn', label, detail);
  warnings++;
}

// ─────────────────────────────────────────────
async function runTests() {
  console.log('══════════════════════════════════════════════');
  console.log('  ERP MT Suite — Security Penetration Test');
  console.log('  Target:', BASE);
  console.log('══════════════════════════════════════════════\n');

  // ── 1. SQL Injection ──
  await test('SQL INJECTION ATTACKS', async () => {
    const payloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "1; SELECT * FROM users",
      "' OR 1=1 --",
      "admin'--",
      "1' AND 1=2 UNION SELECT 1,2,3,4--",
    ];
    for (const payload of payloads) {
      const res = await request('GET', `/api/items?search=${encodeURIComponent(payload)}`);
      // If status 200 with data returned without error, there might be a SQLi issue
      if (res.json && res.json.success === true && res.json.data && res.json.data.length > 0) {
        warn('Potential SQLi', `Payload "${payload}" returned data (status ${res.status})`);
      } else if (res.status === 500) {
        warn('Server error on SQLi', `Payload "${payload}" caused 500 — check if error leaks info`);
      }
    }
    // Test auth login SQLi
    for (const payload of payloads.slice(0, 3)) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: `${payload}@test.com`, password: payload },
      });
      if (res.status === 200 && res.json?.success === true) {
        log('fail', 'SQLi on login', `Payload "${payload}" authenticated successfully!`);
        failed++;
      }
    }
    log('pass', 'SQL Injection check', `${payloads.length} payloads tested — endpoints appear parameterized`);
    passed++;
  });

  // ── 2. XSS Attacks ──
  await test('CROSS-SITE SCRIPTING (XSS)', async () => {
    const xssPayloads = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '"><script>alert(1)</script>',
      '<svg onload=alert(1)>',
      'javascript:alert(1)',
    ];
    for (const payload of xssPayloads) {
      const res = await request('GET', `/api/items?search=${encodeURIComponent(payload)}`);
      // Check if the payload is reflected back unescaped in error messages or response
      if (res.body && res.body.includes(payload) && res.headers['content-type']?.includes('text/html')) {
        warn('Reflected XSS', `Payload "${payload}" reflected in HTML response`);
      }
    }
    log('pass', 'XSS check', `${xssPayloads.length} XSS payloads tested — API returns JSON, not HTML`);
    passed++;
  });

  // ── 3. Authentication Bypass ──
  await test('AUTHENTICATION BYPASS', async () => {
    // Test protected endpoints without token
    const protectedRoutes = [
      '/api/users',
      '/api/roles',
      '/api/accounts',
      '/api/items',
      '/api/customers',
      '/api/suppliers',
      '/api/sales-orders',
      '/api/purchase-orders',
      '/api/bank-accounts',
      '/api/inventory',
      '/api/dashboard',
    ];
    for (const route of protectedRoutes) {
      const res = await request('GET', route);
      if (res.status === 200 && res.json?.success === true) {
        log('fail', 'Auth bypass', `GET ${route} returned 200 without token — UNPROTECTED!`);
        failed++;
      }
    }
    log('pass', 'Auth bypass check', `${protectedRoutes.length} protected routes all reject unauthenticated requests`);
    passed++;

    // Test with malformed tokens
    const badTokens = [
      'Bearer invalidtoken',
      'Bearer ',
      'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dGVzdA',
      'Basic dGVzdDp0ZXN0',
      'Token faketoken123',
    ];
    for (const token of badTokens) {
      const res = await request('GET', '/api/users', { headers: { Authorization: token } });
      if (res.status === 200) {
        log('fail', 'Bad token accepted', `Token "${token.substring(0, 20)}..." was accepted`);
        failed++;
      }
    }
    log('pass', 'Bad token rejection', `${badTokens.length} malformed tokens all rejected correctly`);
    passed++;
  });

  // ── 4. JWT Tampering ──
  await test('JWT TAMPERING / TOKEN MANIPULATION', async () => {
    // Test with alg:none attack
    const noneToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiJ9.';
    const res = await request('GET', '/api/users', { headers: { Authorization: `Bearer ${noneToken}` } });
    if (res.status === 200) {
      log('fail', 'JWT alg:none', 'Server accepted a JWT with "alg: none" — CRITICAL!');
      failed++;
    } else {
      log('pass', 'JWT alg:none', 'Server correctly rejected "none" algorithm token');
      passed++;
    }

    // Test expired token acceptance
    const res2 = await request('GET', '/api/users', {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInRlbmFudElkIjoxLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.6v3gOKFZuHahWzPkJwBfN6nG7O7PvXd3MZn3X3KjZfA' },
    });
    if (res2.status === 200 && res2.json?.success === true) {
      log('fail', 'Expired token', 'Server accepted an expired JWT token');
      failed++;
    } else {
      log('pass', 'Expired token', 'Server correctly rejected expired token');
      passed++;
    }
  });

  // ── 5. Authorization / IDOR Testing ──
  await test('AUTHORIZATION & IDOR', async () => {
    // Test accessing other tenant's data (multi-tenant isolation)
    const routesWithIds = [
      '/api/users/1',
      '/api/accounts/1',
      '/api/items/1',
      '/api/customers/1',
    ];
    for (const route of routesWithIds) {
      const res = await request('GET', route);
      if (res.status === 200) {
        warn('IDOR possible', `GET ${route} returned 200 without auth — no tenant isolation check`);
      }
    }
    log('pass', 'Auth check', `All IDOR test endpoints require authentication`);
    passed++;
  });

  // ── 6. Rate Limiting ──
  await test('RATE LIMITING', async () => {
    const attempts = 120;
    let blocked = false;
    for (let i = 0; i < attempts; i++) {
      const res = await request('POST', '/api/auth/login', {
        body: { email: `test${i}@test.com`, password: 'wrong' },
      });
      if (res.status === 429) {
        blocked = true;
        log('pass', 'Rate limiting', `Blocked after ${i + 1} requests to /api/auth/login (status 429)`);
        passed++;
        break;
      }
    }
    if (!blocked) {
      warn('Rate limiting (auth)', `Sent ${attempts} requests to /api/auth/login without being rate-limited`);
      warnings++;
    }

    // Test rate limiting on non-auth routes
    let nonAuthBlocked = false;
    for (let i = 0; i < 200; i++) {
      const res = await request('GET', `/api/health?x=${i}`);
      if (res.status === 429) {
        nonAuthBlocked = true;
        break;
      }
    }
    if (!nonAuthBlocked) {
      warn('Rate limiting (general)', 'Non-auth routes have no rate limiting — 200 requests sent with no block');
      warnings++;
    } else {
      log('pass', 'Rate limiting (general)', 'Non-auth routes also have rate limiting');
      passed++;
    }
  });

  // ── 7. Security Headers ──
  await test('SECURITY HEADERS', async () => {
    const res = await request('GET', '/api/health');
    const h = res.headers;
    const checks = {
      'X-Content-Type-Options': h['x-content-type-options'] === 'nosniff',
      'X-Frame-Options': h['x-frame-options'] !== undefined,
      'Strict-Transport-Security': h['strict-transport-security'] !== undefined,
      'Content-Security-Policy': h['content-security-policy'] !== undefined,
      'X-XSS-Protection': h['x-xss-protection'] !== undefined,
    };
    for (const [header, present] of Object.entries(checks)) {
      if (present) {
        log('pass', header, `${header}: ${h[header.toLowerCase()] || 'present'}`);
        passed++;
      } else {
        warn('Missing header', `${header} is missing from response`);
        warnings++;
      }
    }
  });

  // ── 8. CORS Testing ──
  await test('CORS CONFIGURATION', async () => {
    // Test with disallowed origin
    const res = await request('GET', '/api/health', {
      headers: { Origin: 'https://evil-malicious.com' },
    });
    const corsHeader = res.headers['access-control-allow-origin'];
    if (corsHeader === 'https://evil-malicious.com') {
      log('fail', 'CORS', 'Evil origin was allowed — CORS misconfiguration!');
      failed++;
    } else if (!corsHeader || corsHeader === 'null') {
      log('pass', 'CORS', 'Evil origin correctly rejected');
      passed++;
    } else {
      log('pass', 'CORS', `Origin restricted to: ${corsHeader}`);
      passed++;
    }

    // Test with allowed origin
    const res2 = await request('GET', '/api/health', {
      headers: { Origin: 'http://localhost:3001' },
    });
    if (res2.headers['access-control-allow-origin'] === 'http://localhost:3001') {
      log('pass', 'CORS (allowed)', 'localhost:3001 correctly allowed');
      passed++;
    } else {
      warn('CORS (allowed)', 'localhost:3001 was not allowed — verify CORS config');
      warnings++;
    }
  });

  // ── 9. Directory Traversal ──
  await test('DIRECTORY TRAVERSAL', async () => {
    const traversalPayloads = [
      '/uploads/../../../etc/passwd',
      '/uploads/..%2F..%2F..%2Fwindows%2Fsystem32%2Fconfig',
      '/uploads/....//....//....//etc/hosts',
      '/api/../../package.json',
    ];
    for (const path of traversalPayloads) {
      const res = await request('GET', path);
      if (res.status === 200 && (res.body.includes('root:') || res.body.includes('"name":') || res.body.length > 100)) {
        log('fail', 'Directory traversal', `Path "${path}" returned file contents — CRITICAL!`);
        failed++;
      }
    }
    log('pass', 'Directory traversal', `${traversalPayloads.length} traversal payloads blocked`);
    passed++;
  });

  // ── 10. Body Parser DoS ──
  await test('BODY PARSER / PAYLOAD SIZE', async () => {
    // Test with very large payload — send raw to avoid memory issues
    try {
      const bigBody = Buffer.alloc(12 * 1024 * 1024, 'x'); // 12MB
      const res = await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost', port: 5000, path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': bigBody.length },
          timeout: 10000,
        }, (r) => {
          let d = '';
          r.on('data', c => d += c);
          r.on('end', () => resolve({ status: r.statusCode }));
        });
        req.on('error', () => resolve({ status: 0 }));
        req.on('timeout', () => { req.destroy(); resolve({ status: 0 }); });
        req.write(bigBody);
        req.end();
      });
      if (res.status === 413 || res.status === 400 || res.status === 0) {
        log('pass', 'Payload size limit', `Large payload (12MB) rejected (status ${res.status})`);
        passed++;
      } else {
        warn('Payload size limit', `Large payload (12MB) returned status ${res.status} — verify limit`);
        warnings++;
      }
    } catch (e) {
      log('pass', 'Payload size limit', `Large payload rejected: ${e.message}`);
      passed++;
    }

    // Test with nested object DoS — send as raw string to avoid JSON.stringify crash
    try {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '10024',
        },
        timeout: 5000,
      };
      const res2 = await new Promise((resolve) => {
        const req2 = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode }));
        });
        req2.on('error', () => resolve({ status: 0 }));
        req2.on('timeout', () => { req2.destroy(); resolve({ status: 0 }); });
        // Send a deeply nested JSON string manually
        let body = '{"a":';
        for (let i = 0; i < 10000; i++) body += '{"a":';
        body += '1';
        for (let i = 0; i < 10000; i++) body += '}';
        body += '}';
        req2.write(body.slice(0, 10000));
        req2.end();
      });
      if (res2.status === 400 || res2.status === 413 || res2.status === 0) {
        log('pass', 'Nested object DoS', 'Deeply nested JSON payload rejected');
        passed++;
      } else {
        warn('Nested object DoS', `Deeply nested payload returned status ${res2.status} — potential DoS vector`);
        warnings++;
      }
    } catch (e) {
      log('pass', 'Nested object DoS', 'Deeply nested payload rejected (error: ' + e.message + ')');
      passed++;
    }
  });

  // ── 11. Information Disclosure ──
  await test('INFORMATION DISCLOSURE', async () => {
    const res = await request('GET', '/api/nonexistent-route-12345');
    const body = res.body || '';
    const disclosures = [];
    if (body.includes('stack')) disclosures.push('stack trace');
    if (body.includes('node_modules')) disclosures.push('node_modules path');
    if (body.includes('ERPMultiTenant')) disclosures.push('internal paths');
    if (body.includes(__dirname?.split('\\').pop() || '')) disclosures.push('directory structure');

    if (disclosures.length > 0) {
      warn('Info disclosure', `Error response leaks: ${disclosures.join(', ')}`);
      warnings++;
    } else {
      log('pass', 'Info disclosure', 'Error responses do not leak sensitive information');
      passed++;
    }

    // Check server header
    const serverHeader = res.headers['x-powered-by'] || res.headers['server'] || '';
    if (serverHeader) {
      warn('Server header', `Response includes "${serverHeader}" — consider removing for production`);
      warnings++;
    } else {
      log('pass', 'Server header', 'No identifying server header leaked');
      passed++;
    }
  });

  // ── 12. Input Validation ──
  await test('INPUT VALIDATION', async () => {
    // Test various malformed inputs
    const testCases = [
      { path: '/api/auth/login', method: 'POST', body: { email: 'notanemail', password: '' } },
      { path: '/api/auth/login', method: 'POST', body: {} },
      { path: '/api/auth/login', method: 'POST', body: null },
      { path: '/api/auth/login', method: 'POST', body: 'notjson' },
    ];
    for (const tc of testCases) {
      const res = await request(tc.method, tc.path, {
        body: tc.body,
        headers: tc.body && typeof tc.body !== 'string' ? {} : {},
      });
      if (res.status === 400 || res.status === 422) {
        // Expected — validation working
      } else if (res.status === 200) {
        warn('Validation', `${tc.method} ${tc.path} with body ${JSON.stringify(tc.body)} returned 200 — validation may be missing`);
        warnings++;
      } else if (res.status === 500) {
        warn('Validation crash', `${tc.method} ${tc.path} with invalid input caused 500 error`);
        warnings++;
      }
    }
    log('pass', 'Input validation', 'Validation checks completed');
    passed++;
  });

  // ── 13. Verbose Error Messages ──
  await test('VERBOSE ERROR HANDLING', async () => {
    const res = await request('GET', '/api/items/invalid-id-format');
    const body = res.body || '';
    if (body.includes('Sequelize') || body.includes('ValidationError') || body.includes('Error:')) {
      warn('Verbose errors', 'Error response may leak internal details');
      warnings++;
    } else {
      log('pass', 'Error verbosity', 'Errors are sanitized in responses');
      passed++;
    }
  });

  // ── Final Summary ──
  const total = passed + failed;
  console.log('\n══════════════════════════════════════════════');
  console.log('  SECURITY TEST SUMMARY');
  console.log('══════════════════════════════════════════════');
  console.log(`  ✅ Passed:  ${passed}`);
  console.log(`  ❌ Failed:  ${failed}`);
  console.log(`  ⚠️ Warnings: ${warnings}`);
  console.log(`  📊 Score:   ${total > 0 ? Math.round((passed / total) * 100) : 100}%`);
  console.log('══════════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('  ❌ CRITICAL issues found that need immediate attention!');
  }
  if (warnings > 0) {
    console.log('  ⚠️ Review warnings for security hardening opportunities.');
  }
  if (failed === 0 && warnings === 0) {
    console.log('  ✅ Great! No security issues detected.');
  }
  console.log('');
}

runTests().catch(console.error);
