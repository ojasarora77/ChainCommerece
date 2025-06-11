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

// Direct Model Invocation for Quick Queries - Optimized for available models
export async function invokeAI(prompt: string) {
  // Use Titan as primary since it's available and cost-effective
  try {
    console.log("Using Amazon Titan Text Express model...");
    return await invokeTitan(prompt);
  } catch (titanError: any) {
    console.log("Titan failed, trying Mistral...", titanError.message);
    try {
      return await invokeMistral(prompt);
    } catch (mistralError: any) {
      console.log("Mistral failed, trying Meta Llama...", mistralError.message);
      try {
        return await invokeLlama(prompt);
      } catch (llamaError: any) {
        console.error("All models failed:", llamaError.message);
        // Return structured mock response for development
        return {
          content: [{
            text: `AI Response (Mock): Based on your query "${prompt.substring(0, 50)}...", here's a helpful response. This is mock data - configure AWS credentials for real AI responses.`
          }]
        };
      }
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

// Titan Model (Primary choice - cost-effective and reliable)
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
        topP: 0.9,
        stopSequences: []
      }
    })
  });

  const response = await runtimeClient.send(command);
  const responseBody = new TextDecoder().decode(response.body);
  const result = JSON.parse(responseBody);

  // Convert Titan response format to match standard format
  return {
    content: [{
      text: result.results[0].outputText
    }]
  };
}

// Mistral AI Model (Good for creative and multilingual tasks)
export async function invokeMistral(prompt: string) {
  const command = new InvokeModelCommand({
    modelId: "mistral.mistral-7b-instruct-v0:2",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      prompt: `<s>[INST] ${prompt} [/INST]`,
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 50
    })
  });

  const response = await runtimeClient.send(command);
  const responseBody = new TextDecoder().decode(response.body);
  const result = JSON.parse(responseBody);

  // Convert Mistral response format
  return {
    content: [{
      text: result.outputs[0].text
    }]
  };
}

// Meta Llama Model (Backup option for complex reasoning)
export async function invokeLlama(prompt: string) {
  const command = new InvokeModelCommand({
    modelId: "meta.llama2-13b-chat-v1", // or "meta.llama3-8b-instruct-v1:0"
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      prompt: `[INST] ${prompt} [/INST]`,
      max_gen_len: 1000,
      temperature: 0.7,
      top_p: 0.9
    })
  });

  const response = await runtimeClient.send(command);
  const responseBody = new TextDecoder().decode(response.body);
  const result = JSON.parse(responseBody);

  // Convert Llama response format
  return {
    content: [{
      text: result.generation
    }]
  };
}
