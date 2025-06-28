/**
 * AWS Lambda Function for Bedrock Agent Function Execution
 * This function receives calls from the Bedrock Agent and forwards them to your Next.js API
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_ENDPOINT = '/api/ai/agent-functions';

/**
 * Make HTTP request to Next.js API
 */
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'AWS-Lambda-Agent-Executor'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Main Lambda handler
 */
exports.handler = async (event, context) => {
  console.log('🤖 Agent Function Executor - Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Extract function details from Bedrock Agent event
    const { 
      actionGroup, 
      function: functionName, 
      parameters,
      sessionId,
      inputText 
    } = event;

    console.log(`📞 Executing function: ${functionName}`);
    console.log(`📋 Parameters:`, parameters);

    // Prepare request to Next.js API
    const requestData = {
      function: functionName,
      parameters: parameters || {},
      sessionId: sessionId,
      actionGroup: actionGroup,
      inputText: inputText,
      timestamp: new Date().toISOString(),
      source: 'bedrock-agent'
    };

    // Call Next.js API
    const apiUrl = `${API_BASE_URL}${API_ENDPOINT}`;
    console.log(`🌐 Calling API: ${apiUrl}`);
    
    const result = await makeRequest(apiUrl, requestData);
    
    console.log(`✅ Function executed successfully:`, result);

    // Format response for Bedrock Agent
    const response = {
      actionGroup: actionGroup,
      function: functionName,
      functionResponse: {
        responseBody: result.success ? result.data : result.error,
        responseState: result.success ? 'SUCCESS' : 'FAILURE'
      }
    };

    return response;

  } catch (error) {
    console.error('❌ Function execution failed:', error);
    
    // Return error response to Bedrock Agent
    return {
      actionGroup: event.actionGroup || 'unknown',
      function: event.function || 'unknown',
      functionResponse: {
        responseBody: {
          error: error.message,
          details: 'Function execution failed in Lambda'
        },
        responseState: 'FAILURE'
      }
    };
  }
};

/**
 * Local testing function
 */
if (require.main === module) {
  // Test the function locally
  const testEvent = {
    actionGroup: 'shopping-functions',
    function: 'searchProducts',
    parameters: {
      query: 'sustainable electronics',
      maxPrice: 100
    },
    sessionId: 'test-session-123',
    inputText: 'Find sustainable electronics under $100'
  };

  exports.handler(testEvent, {})
    .then(result => {
      console.log('✅ Test result:', JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
    });
}
