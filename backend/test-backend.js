#!/usr/bin/env node

/**
 * NAINA Backend - Test & Validation Script
 * Tests all connections and features
 */

import axios from 'axios';
import io from 'socket.io-client';

const BASE_URL = 'http://localhost:5173';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`),
  result: (msg) => console.log(`${msg}`)
};

// Test counter
let passed = 0;
let failed = 0;

/**
 * Test HTTP Health Endpoint
 */
async function testHealth() {
  log.section('🏥 Testing Server Health');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    
    if (response.status === 200) {
      log.success('Server is running');
      log.result(`  Port: 5173`);
      log.result(`  Status: ${response.data.status}`);
      log.result(`  Uptime: ${Math.round(response.data.uptime)}s`);
      log.result(`  Features: ${response.data.features.length} active`);
      
      // Check for new features
      if (response.data.features.includes('real-time-websocket')) {
        log.success('WebSocket support enabled');
      } else {
        log.warning('WebSocket support not detected');
      }
      
      if (response.data.features.includes('shopify-integration')) {
        log.success('Shopify integration enabled');
      } else {
        log.warning('Shopify integration not detected');
      }
      
      passed++;
      return true;
    }
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test Chat API
 */
async function testChatAPI() {
  log.section('💬 Testing Chat API');
  
  try {
    const sessionId = `test-${Date.now()}`;
    const response = await axios.post(
      `${BASE_URL}/api/chat/message`,
      {
        sessionId,
        message: 'What products do you have?'
      },
      { timeout: 15000 }
    );
    
    if (response.status === 200 && response.data.response) {
      log.success('Chat API working');
      log.result(`  Session: ${sessionId}`);
      log.result(`  Response: "${response.data.response.substring(0, 60)}..."`);
      log.result(`  Stage: ${response.data.stage}`);
      log.result(`  Intent: ${response.data.intent}`);
      log.result(`  Products found: ${response.data.products.length}`);
      
      if (response.data.products.length > 0) {
        log.success('Products are being returned');
        log.result(`    - ${response.data.products[0].name}`);
      }
      
      passed++;
      return true;
    }
  } catch (error) {
    log.error(`Chat API test failed: ${error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test Status Endpoint
 */
async function testStatus() {
  log.section('📊 Testing Status Endpoint');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/status`, { timeout: 5000 });
    
    if (response.status === 200) {
      log.success('Status endpoint working');
      log.result(`  Server: ${response.data.server}`);
      log.result(`  Socket.IO: ${response.data.socketIO}`);
      
      if (response.data.shopify) {
        log.result(`  Shopify:`);
        log.result(`    - Enabled: ${response.data.shopify.enabled}`);
        
        if (response.data.shopify.enabled) {
          log.success('Shopify is connected');
          if (response.data.shopify.lastSync) {
            const lastSync = new Date(response.data.shopify.lastSync);
            log.result(`    - Last sync: ${lastSync.toISOString()}`);
          }
        } else {
          log.warning('Shopify not enabled (using local database)');
        }
      }
      
      passed++;
      return true;
    }
  } catch (error) {
    log.error(`Status test failed: ${error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test WebSocket Connection
 */
async function testWebSocket() {
  log.section('🔌 Testing WebSocket (Socket.io)');
  
  return new Promise((resolve) => {
    const socket = io(BASE_URL, {
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionDelayMax: 500,
      reconnectionAttempts: 3
    });

    let messageReceived = false;
    let timeout;

    socket.on('connect', () => {
      log.success('WebSocket connected');
      
      // Send test message
      const sessionId = `websocket-${Date.now()}`;
      socket.emit('chat:message', {
        sessionId,
        message: 'Hello, are you real time?'
      });
    });

    socket.on('chat:response', (data) => {
      messageReceived = true;
      log.success('Real-time response received');
      log.result(`  Message: "${data.response.substring(0, 60)}..."`);
      
      if (data.products && data.products.length > 0) {
        log.success(`Real-time products: ${data.products.length}`);
      }
      
      socket.disconnect();
      clearTimeout(timeout);
      passed++;
      resolve(true);
    });

    socket.on('error', (error) => {
      log.error(`WebSocket error: ${error}`);
      socket.disconnect();
      clearTimeout(timeout);
      failed++;
      resolve(false);
    });

    socket.on('connect_error', (error) => {
      log.error(`WebSocket connection error: ${error.message}`);
      socket.disconnect();
      clearTimeout(timeout);
      failed++;
      resolve(false);
    });

    // Timeout after 10 seconds
    timeout = setTimeout(() => {
      if (!messageReceived) {
        log.warning('WebSocket response timeout');
        socket.disconnect();
        failed++;
        resolve(false);
      }
    }, 10000);
  });
}

/**
 * Test Database Connection
 */
async function testDatabase() {
  log.section('🗄️  Testing Database Connection');
  
  try {
    // Try to get conversation history (will fail if DB not connected)
    const sessionId = `db-test-${Date.now()}`;
    const response = await axios.get(
      `${BASE_URL}/api/chat/conversation/${sessionId}`,
      { timeout: 5000, validateStatus: () => true } // Accept any status
    );
    
    // If we get a 404, DB is connected but conversation doesn't exist (expected)
    if (response.status === 404) {
      log.success('Database is connected');
      log.result('  (No conversation found - this is expected for new session)');
      passed++;
      return true;
    } else if (response.status === 200) {
      log.success('Database is connected and working');
      passed++;
      return true;
    } else {
      log.error(`Database error: ${response.status}`);
      failed++;
      return false;
    }
  } catch (error) {
    log.error(`Database test failed: ${error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test 6-Stage Conversation Flow
 */
async function testConversationFlow() {
  log.section('🎯 Testing 6-Stage Conversation Flow');
  
  try {
    const sessionId = `flow-${Date.now()}`;
    const messages = [
      'Hi, I want to buy something',
      'I like dresses',
      'Show me casual dresses',
      'Tell me about delivery',
      'Can I return items?'
    ];

    let currentStage = null;
    
    for (let i = 0; i < messages.length; i++) {
      const response = await axios.post(
        `${BASE_URL}/api/chat/message`,
        {
          sessionId,
          message: messages[i]
        },
        { timeout: 15000 }
      );

      const stage = response.data.stage;
      const isNewStage = stage !== currentStage;
      
      if (isNewStage) {
        log.result(`\n  Stage ${i + 1}: ${stage.toUpperCase()}`);
        currentStage = stage;
      }
      
      log.result(`    User: "${messages[i]}"`);
      log.result(`    Bot: "${response.data.response.substring(0, 50)}..."`);
    }
    
    log.success('Conversation flow completed');
    passed++;
    return true;
    
  } catch (error) {
    log.error(`Flow test failed: ${error.message}`);
    failed++;
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.clear();
  
  console.log(`
╔════════════════════════════════════════════════════════╗
║     🤖 NAINA CHATBOT - BACKEND VALIDATION TEST        ║
╚════════════════════════════════════════════════════════╝
  `);

  log.info('Starting tests...\n');

  // Run tests
  await testHealth();
  await testStatus();
  await testDatabase();
  await testChatAPI();
  await testWebSocket();
  await testConversationFlow();

  // Summary
  log.section('📈 Test Summary');
  log.result(`\n  Passed: ${colors.green}${passed}${colors.reset}`);
  log.result(`  Failed: ${colors.red}${failed}${colors.reset}`);
  log.result(`  Total:  ${passed + failed}\n`);

  if (failed === 0) {
    console.log(`
╔════════════════════════════════════════════════════════╗
║  ${colors.green}✅ ALL TESTS PASSED - READY FOR PRODUCTION${colors.reset}  ║
╚════════════════════════════════════════════════════════╝
    `);
    process.exit(0);
  } else {
    console.log(`
╔════════════════════════════════════════════════════════╗
║  ${colors.red}❌ SOME TESTS FAILED - CHECK LOGS ABOVE${colors.reset}    ║
╚════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }
}

// Check if server is running
axios.get(`${BASE_URL}/health`, { timeout: 3000 }).then(() => {
  runAllTests().catch((error) => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}).catch(() => {
  log.error(`\n⚠️  Cannot connect to backend at ${BASE_URL}`);
  log.info('Make sure the backend is running: npm run dev\n');
  process.exit(1);
});
