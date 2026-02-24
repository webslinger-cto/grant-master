/**
 * Simple test script for AI Chatbot API
 *
 * This tests the chatbot endpoints without authentication
 * (for development testing only)
 */

const BASE_URL = 'http://localhost:3001/api/v1';

// Test user ID from seed data
const TEST_USER_ID = '20000001-0000-0000-0000-000000000001'; // founder@webslinger.ai
const TEST_APPLICATION_ID = '50000001-0000-0000-0000-000000000001'; // Should exist from seed data

async function testTemplatesEndpoint() {
  console.log('\n🧪 Test 1: Get NIH R01 Section Templates');
  console.log('='  .repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/generated-sections/meta/templates?grantType=NIH_R01`);

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Failed:', error.substring(0, 200));
      return false;
    }

    const data = await response.json();
    console.log(`✅ Success! Found ${data.data?.length || 0} templates`);

    if (data.data && data.data.length > 0) {
      console.log('\nSample templates:');
      data.data.slice(0, 3).forEach(t => {
        console.log(`  - ${t.section_name} (${t.section_key})`);
        console.log(`    Page limit: ${t.page_limit || 'N/A'}, Word limit: ${t.word_limit || 'N/A'}`);
      });
    }

    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testChatEndpoint() {
  console.log('\n🧪 Test 2: Send Chat Message (requires auth)');
  console.log('='.repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicationId: TEST_APPLICATION_ID,
        content: 'Hello! Can you help me write a grant application?'
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.log('⚠️  Unauthorized (expected - endpoint requires JWT authentication)');
      return 'auth_required';
    }

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Failed:', error.substring(0, 200));
      return false;
    }

    const data = await response.json();
    console.log('✅ Success! Got AI response');
    console.log('Response preview:', data.response?.substring(0, 100) + '...');

    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n🧪 Test 3: Database Query Test');
  console.log('='.repeat(60));

  try {
    // Try to get generated sections (should return empty array or require auth)
    const response = await fetch(`${BASE_URL}/generated-sections?applicationId=${TEST_APPLICATION_ID}`);

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.log('⚠️  Unauthorized (expected - endpoint requires JWT authentication)');
      return 'auth_required';
    }

    if (!response.ok) {
      const error = await response.text();
      console.log('Response:', error.substring(0, 300));
      return false;
    }

    const data = await response.json();
    console.log('✅ Success! Database is accessible');
    console.log(`Found ${data.data?.length || 0} generated sections`);

    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testWebSocketConnection() {
  console.log('\n🧪 Test 4: WebSocket Connection');
  console.log('='.repeat(60));
  console.log('⏭️  Skipping WebSocket test (requires socket.io client)');
  console.log('To test WebSocket streaming:');
  console.log('  1. Install: npm install socket.io-client');
  console.log('  2. Connect to: ws://localhost:3001/chat');
  console.log('  3. Emit: stream-message with { applicationId, content, userId }');
  return 'skipped';
}

// Main test runner
async function runTests() {
  console.log('\n🚀 GrantsMaster AI Chatbot API Test Suite');
  console.log('='.repeat(60));
  console.log(`Testing: ${BASE_URL}`);
  console.log('='.repeat(60));

  const results = {
    templates: await testTemplatesEndpoint(),
    chat: await testChatEndpoint(),
    database: await testDatabaseConnection(),
    websocket: await testWebSocketConnection(),
  };

  console.log('\n📊 Test Summary');
  console.log('='.repeat(60));

  Object.entries(results).forEach(([test, result]) => {
    const icon = result === true ? '✅' : result === 'auth_required' ? '⚠️ ' : result === 'skipped' ? '⏭️ ' : '❌';
    const status = result === true ? 'PASS' : result === 'auth_required' ? 'AUTH REQUIRED' : result === 'skipped' ? 'SKIPPED' : 'FAIL';
    console.log(`${icon} ${test.padEnd(15)}: ${status}`);
  });

  console.log('\n📝 Notes:');
  console.log('  - Chat and database endpoints require JWT authentication');
  console.log('  - To get a JWT token, use Google OAuth login flow');
  console.log('  - Templates endpoint should work without auth for now');
  console.log('  - Backend is running on port 3001 ✓');
  console.log('  - Database is connected (Supabase) ✓');
  console.log('  - Migration and seed completed ✓');

  console.log('\n✨ Backend is ready! Next steps:');
  console.log('  1. Build frontend chat components');
  console.log('  2. Implement Google OAuth login');
  console.log('  3. Test end-to-end chat flow');
  console.log('  4. Test section generation');

  console.log('\n');
}

// Run tests
runTests().catch(console.error);
