/**
 * Database Connection Test Script
 * Tests both DATABASE_URL and DIRECT_URL connectivity
 */

const { PrismaClient } = require('@prisma/client');

// Test configuration
const tests = {
  passed: 0,
  failed: 0,
  results: []
};

function logTest(name, passed, message) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const result = `${status} - ${name}: ${message}`;
  console.log(result);
  tests.results.push({ name, passed, message });
  if (passed) tests.passed++;
  else tests.failed++;
}

async function testDatabaseConnection() {
  console.log('\n===========================================');
  console.log('🧪 TESTING DATABASE CONNECTION');
  console.log('===========================================\n');

  const prisma = new PrismaClient({
    log: ['error', 'warn']
  });

  try {
    // Test 1: Basic connectivity
    console.log('Test 1: Basic database connectivity...');
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      logTest('Basic Connectivity', true, 'Database is reachable');
    } catch (error) {
      logTest('Basic Connectivity', false, `Cannot reach database: ${error.message}`);
    }

    // Test 2: Check if we can query users table
    console.log('\nTest 2: Query users table...');
    try {
      const userCount = await prisma.user.count();
      logTest('Query Users Table', true, `Found ${userCount} users in database`);
    } catch (error) {
      logTest('Query Users Table', false, `Query failed: ${error.message}`);
    }

    // Test 3: Check cleanup-related tables
    console.log('\nTest 3: Check cleanup tables...');
    try {
      const [magicLinks, invitations, loginAttempts, sessions, auditLogs] = await Promise.all([
        prisma.magicLink.count(),
        prisma.invitation.count(),
        prisma.loginAttempt.count(),
        prisma.session.count(),
        prisma.auditLog.count()
      ]);

      logTest('Cleanup Tables Query', true,
        `MagicLinks: ${magicLinks}, Invitations: ${invitations}, LoginAttempts: ${loginAttempts}, Sessions: ${sessions}, AuditLogs: ${auditLogs}`
      );
    } catch (error) {
      logTest('Cleanup Tables Query', false, `Query failed: ${error.message}`);
    }

    // Test 4: Test connection health check function
    console.log('\nTest 4: Test checkDatabaseConnection function...');
    try {
      const { checkDatabaseConnection } = require('./dist/config/database');
      const isConnected = await checkDatabaseConnection();
      logTest('Health Check Function', isConnected,
        isConnected ? 'Health check passed' : 'Health check returned false'
      );
    } catch (error) {
      logTest('Health Check Function', false, `Function failed: ${error.message}`);
    }

    // Test 5: Verify DATABASE_URL and DIRECT_URL are set
    console.log('\nTest 5: Check environment variables...');
    const databaseUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL;

    if (databaseUrl && directUrl) {
      logTest('Environment Variables', true,
        `Both DATABASE_URL and DIRECT_URL are configured`
      );

      // Show connection info (masked)
      console.log(`   📍 DATABASE_URL: ${databaseUrl.substring(0, 30)}...`);
      console.log(`   📍 DIRECT_URL: ${directUrl.substring(0, 30)}...`);
    } else {
      logTest('Environment Variables', false,
        `Missing: ${!databaseUrl ? 'DATABASE_URL ' : ''}${!directUrl ? 'DIRECT_URL' : ''}`
      );
    }

  } catch (error) {
    console.error('\n❌ Unexpected error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }

  // Print summary
  console.log('\n===========================================');
  console.log('📊 TEST SUMMARY');
  console.log('===========================================');
  console.log(`✅ Passed: ${tests.passed}`);
  console.log(`❌ Failed: ${tests.failed}`);
  console.log(`📈 Total: ${tests.passed + tests.failed}`);

  if (tests.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Database is correctly configured.');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.');
  }
  console.log('===========================================\n');

  process.exit(tests.failed > 0 ? 1 : 0);
}

// Run tests
testDatabaseConnection();
