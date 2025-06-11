import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand 
} from "@aws-sdk/client-bedrock-agent-runtime";
import { 
  BedrockRuntimeClient, 
  InvokeModelCommand 
} from "@aws-sdk/client-bedrock-runtime";

// Initialize clients
const agentClient = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const runtimeClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Shopping Assistant Agent
export async function askShoppingAssistant(
  query: string, 
  userPreferences: {
    sustainabilityMin?: number;
    priceMax?: number;
    chain?: "ethereum" | "avalanche";
    categories?: string[];
  }
) {
  const prompt = `
    User Query: ${query}
    Preferences: ${JSON.stringify(userPreferences)}
    
    Find sustainable products matching these criteria across our cross-chain marketplace.
  `;

  const command = new InvokeAgentCommand({
    agentId: process.env.BEDROCK_AGENT_ID!,
    agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID!,
    sessionId: `session-${Date.now()}`,
    inputText: prompt,
  });
  
  const response = await agentClient.send(command);
  return response;
}

// Direct Model Invocation for Quick Queries - Smart fallback system
export async function invokeAI(prompt: string) {
  // Try Claude first, fallback to Titan if not available
  try {
    console.log("Attempting Claude model invocation...");
    return await invokeClaude(prompt);
  } catch (error: any) {
    console.log("Claude not available, attempting Titan model...", error.message);
    try {
      return await invokeTitan(prompt);
    } catch (titanError: any) {
      console.error("Both Claude and Titan failed:", titanError.message);
      // Return structured mock response for development
      return {
        content: [{
          text: `AI Response (Mock): Based on your query "${prompt.substring(0, 50)}...", here's a helpful response. This is mock data - configure AWS credentials for real AI responses.`
        }]
      };
    }
  }
}

// Claude Model (for regions where available) - Following AWS official patterns
export async function invokeClaude(prompt: string) {
  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-haiku-20240307-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      messages: [{
        role: "user",
        content: [{
          type: "text",
          text: prompt
        }]
      }],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  const response = await runtimeClient.send(command);
  const responseBody = new TextDecoder().decode(response.body);
  const result = JSON.parse(responseBody);

  // Extract text from Claude response format
  return {
    content: [{
      text: result.content[0].text
    }]
  };
}

// Titan Model (widely available alternative)
export async function invokeTitan(prompt: string) {
  const command = new InvokeModelCommand({
    modelId: "amazon.titan-text-express-v1",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: 1000,
        temperature: 0.7,
        topP: 0.9
      }
    })
  });

  const response = await runtimeClient.send(command);
  const responseBody = new TextDecoder().decode(response.body);
  const result = JSON.parse(responseBody);

  // Convert Titan response format to match Claude format
  return {
    content: [{
      text: result.results[0].outputText
    }]
  };
}
