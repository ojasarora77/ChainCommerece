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

// Direct Claude Model Invocation for Quick Queries
export async function invokeClaude(prompt: string) {
  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-haiku-20240307-v1:0", // Using Haiku for cost efficiency
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      messages: [{
        role: "user",
        content: prompt
      }],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  const response = await runtimeClient.send(command);
  const responseBody = new TextDecoder().decode(response.body);
  return JSON.parse(responseBody);
}
