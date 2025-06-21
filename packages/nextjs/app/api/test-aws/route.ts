import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check if AWS credentials are set
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION;

    if (!accessKeyId || !secretAccessKey || !region) {
      return NextResponse.json({
        success: false,
        error: "AWS credentials not found in environment variables",
        details: {
          hasAccessKey: !!accessKeyId,
          hasSecretKey: !!secretAccessKey,
          hasRegion: !!region,
          accessKeyPreview: accessKeyId ? `${accessKeyId.substring(0, 4)}...` : "missing"
        }
      }, { status: 400 });
    }

    if (accessKeyId.includes("your_aws_access_key_here") || 
        secretAccessKey.includes("your_aws_secret_key_here")) {
      return NextResponse.json({
        success: false,
        error: "AWS credentials are still placeholder values",
        details: {
          accessKeyPreview: `${accessKeyId.substring(0, 10)}...`,
          message: "Please replace with real AWS credentials"
        }
      }, { status: 400 });
    }

    // Try to import AWS SDK
    try {
      const { BedrockRuntimeClient, InvokeModelCommand } = await import("@aws-sdk/client-bedrock-runtime");
      
      const client = new BedrockRuntimeClient({
        region: region,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
        },
      });

      // Test with a simple prompt
      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 100,
          messages: [
            {
              role: "user",
              content: "Say 'AWS Bedrock connection successful!' and nothing else."
            }
          ]
        }),
        contentType: "application/json",
        accept: "application/json",
      });

      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return NextResponse.json({
        success: true,
        message: "AWS Bedrock connection successful!",
        details: {
          region: region,
          accessKeyPreview: `${accessKeyId.substring(0, 4)}...`,
          modelResponse: responseBody.content[0].text,
          timestamp: new Date().toISOString()
        }
      });

    } catch (awsError: any) {
      return NextResponse.json({
        success: false,
        error: "AWS Bedrock connection failed",
        details: {
          errorMessage: awsError.message,
          errorCode: awsError.name,
          region: region,
          accessKeyPreview: `${accessKeyId.substring(0, 4)}...`
        }
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Test endpoint error",
      details: error.message
    }, { status: 500 });
  }
}
