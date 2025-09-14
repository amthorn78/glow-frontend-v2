#!/usr/bin/env node
// F8: CI Guards - Static checks for auth anti-patterns
// T-UI-001 Phase 5B - Prevent regression of known auth issues

const fs = require('fs');
const path = require('path');

// F8: Auth anti-pattern rules
const AUTH_GUARDS = {
  ABSOLUTE_AUTH_URLS: {
    pattern: /(https?:\/\/).*(api|auth|login|logout|me)/gi,
    message: 'Absolute URLs to auth endpoints are forbidden. Use relative /api/* URLs only.',
    allowlist: [
      'https://example.com/docs', // External documentation
      'https://api.external-service.com' // External non-auth APIs
    ]
  },
  
  AUTHORIZATION_HEADERS: {
    pattern: /(Authorization|Bearer)\s*:/gi,
    message: 'Authorization/Bearer headers are forbidden. Use cookie-based auth only.',
    allowlist: []
  },
  
  TOKEN_STORAGE: {
    pattern: /(localStorage|sessionStorage).*['"](token|auth|jwt|bearer)['"]/gi,
    message: 'Token storage in localStorage/sessionStorage is forbidden. Use cookies only.',
    allowlist: []
  },
  
  ME_401_THROWING: {
    pattern: /throw.*401.*\/api\/auth\/me|\/api\/auth\/me.*throw.*401/gi,
    message: 'Throwing on /api/auth/me 401 is forbidden. Treat 401 as unauthenticated data.',
    allowlist: []
  },
  
  // ROUTER_NAV_IN_AUTH: {
  //   pattern: /(useNavigate\(\)|navigate\(|router\.push\()/gi,
  //   message: 'Router navigation calls when AUTH_ROUTER_NAV_ENABLED=false are forbidden. Use hard navigation.',
  //   allowlist: []
  // } // Disabled: Router nav is currently disabled via feature flag
};

// F8: Recursively get all source files
function getSourceFiles(dir = 'src', files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      getSourceFiles(fullPath, files);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// F8: Scan source files for anti-patterns
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  
  for (const [ruleName, rule] of Object.entries(AUTH_GUARDS)) {
    const matches = content.match(rule.pattern);
    
    if (matches) {
      // Check allowlist
      const allowedMatches = matches.filter(match => 
        rule.allowlist.some(allowed => match.toLowerCase().includes(allowed.toLowerCase()))
      );
      
      const violatingMatches = matches.filter(match => 
        !rule.allowlist.some(allowed => match.toLowerCase().includes(allowed.toLowerCase()))
      );
      
      if (violatingMatches.length > 0) {
        violations.push({
          rule: ruleName,
          message: rule.message,
          matches: violatingMatches,
          file: filePath
        });
      }
    }
  }
  
  return violations;
}

// F8: Get all source files to scan
function getAllSourceFiles() {
  return getSourceFiles('src');
}

// F8: Main guard execution
function runAuthGuards() {
  console.log('[F8_CI_GUARDS] Starting auth anti-pattern scan...');
  
  const sourceFiles = getAllSourceFiles();
  let totalViolations = 0;
  let hasViolations = false;
  
  sourceFiles.forEach(file => {
    const violations = scanFile(file);
    
    if (violations.length > 0) {
      hasViolations = true;
      console.error(`\n❌ [F8_CI_GUARDS] Violations in ${file}:`);
      
      violations.forEach(violation => {
        console.error(`  🚫 ${violation.rule}: ${violation.message}`);
        violation.matches.forEach(match => {
          console.error(`     Found: "${match.trim()}"`);
        });
        totalViolations++;
      });
    }
  });
  
  if (hasViolations) {
    console.error(`\n💥 [F8_CI_GUARDS] FAILED: ${totalViolations} auth anti-pattern violations found`);
    console.error('🛡️  These patterns are forbidden to prevent auth regressions.');
    console.error('📖 See T-UI-001 Phase 5B specification for details.');
    
    // Emit telemetry
    console.log('[AUTH_BREADCRUMB] ci.guard.fail', JSON.stringify({ 
      violations: totalViolations,
      timestamp: new Date().toISOString()
    }));
    
    process.exit(1);
  } else {
    console.log('✅ [F8_CI_GUARDS] PASSED: No auth anti-patterns detected');
    console.log(`📊 Scanned ${sourceFiles.length} source files`);
    
    // Emit telemetry
    console.log('[AUTH_BREADCRUMB] ci.guard.pass', JSON.stringify({ 
      files_scanned: sourceFiles.length,
      timestamp: new Date().toISOString()
    }));
    
    process.exit(0);
  }
}

// F8: Execute if run directly
if (require.main === module) {
  runAuthGuards();
}

module.exports = { runAuthGuards, scanFile, AUTH_GUARDS };

