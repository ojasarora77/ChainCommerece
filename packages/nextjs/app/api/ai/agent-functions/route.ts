import { NextRequest, NextResponse } from 'next/server';
import { ShoppingAgentFunctions } from '../../../../services/bedrock/agents/shoppingAgentFunctions';

export async function POST(request: NextRequest) {
  try {
    const { 
      function: functionName, 
      parameters, 
      sessionId, 
      actionGroup,
      inputText,
      source 
    } = await request.json();

    console.log(`🔧 Agent Function API: ${functionName} called from ${source || 'unknown'}`);
    console.log(`📋 Parameters:`, parameters);

    if (!functionName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Function name is required',
          message: 'No function specified for execution'
        },
        { status: 400 }
      );
    }

    // Initialize the shopping agent functions
    const agentFunctions = new ShoppingAgentFunctions();

    let result;

    // Execute the requested function
    switch (functionName) {
      case 'searchProducts':
        result = await agentFunctions.searchProducts(parameters);
        break;
        
      case 'getProductDetails':
        result = await agentFunctions.getProductDetails(parameters);
        break;
        
      case 'createOrder':
        result = await agentFunctions.createOrder(parameters);
        break;
        
      case 'processPayment':
        result = await agentFunctions.processPayment(parameters);
        break;
        
      case 'checkOrderStatus':
        result = await agentFunctions.checkOrderStatus(parameters);
        break;
        
      default:
        console.warn(`⚠️ Unknown function: ${functionName}`);
        result = {
          success: false,
          error: `Unknown function: ${functionName}`,
          message: `The function '${functionName}' is not implemented`
        };
    }

    console.log(`✅ Function ${functionName} executed:`, result.success ? 'SUCCESS' : 'FAILURE');

    // Return result in format expected by both Lambda and direct calls
    const response = {
      success: result.success,
      data: result.success ? result.data : null,
      error: result.success ? null : result.error,
      message: result.message,
      function: functionName,
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      executionDetails: {
        actionGroup: actionGroup,
        inputText: inputText,
        source: source
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Agent Function API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to execute agent function',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Agent Functions API is running',
    availableFunctions: [
      'searchProducts',
      'getProductDetails', 
      'createOrder',
      'processPayment',
      'checkOrderStatus'
    ],
    usage: {
      POST: 'Execute agent functions',
      parameters: {
        function: 'Function name to execute',
        parameters: 'Function-specific parameters',
        sessionId: 'Optional session identifier',
        actionGroup: 'Optional action group name',
        inputText: 'Optional original user input',
        source: 'Optional source identifier'
      }
    },
    examples: {
      searchProducts: {
        function: 'searchProducts',
        parameters: {
          query: 'sustainable electronics',
          maxPrice: 100,
          sustainabilityMin: 80
        }
      },
      createOrder: {
        function: 'createOrder',
        parameters: {
          productId: 1,
          quantity: 1,
          userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96DfbB8E24'
        }
      }
    }
  });
}
