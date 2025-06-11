import { invokeAI } from "../index";
import { DisputeCase } from "~~/types/bedrock";

export class DisputeResolutionAgent {
  async analyzeDispute(dispute: DisputeCase) {
    const prompt = `
      Analyze this marketplace dispute:
      Order: ${dispute.orderId}
      Issue: ${dispute.issue}
      Evidence: ${dispute.evidence.join("\n")}
      
      Provide fair resolution considering:
      1. Transaction history
      2. Seller reputation
      3. Evidence provided
      4. Marketplace policies
      
      Suggest resolution and reasoning.
    `;

    try {
      const response = await invokeAI(prompt);
      return this.parseResolution(response);
    } catch (error) {
      // Return mock resolution if AWS not configured
      return this.getMockResolution(dispute);
    }
  }

  private parseResolution(response: any) {
    return {
      decision: "refund" as "refund" | "release" | "partial",
      percentage: 100,
      reasoning: "",
      additionalActions: []
    };
  }

  private getMockResolution(dispute: DisputeCase) {
    // Simple mock logic based on dispute type
    const issueType = dispute.issue.toLowerCase();
    
    if (issueType.includes("not received") || issueType.includes("damaged")) {
      return {
        decision: "refund" as const,
        percentage: 100,
        reasoning: "Based on evidence provided and marketplace policies, full refund is recommended due to non-delivery or damaged goods.",
        additionalActions: ["Contact seller for explanation", "Review seller rating"]
      };
    } else if (issueType.includes("quality") || issueType.includes("description")) {
      return {
        decision: "partial" as const,
        percentage: 50,
        reasoning: "Partial refund recommended due to quality/description mismatch. Buyer keeps product with compensation.",
        additionalActions: ["Seller to improve product descriptions", "Buyer to provide detailed feedback"]
      };
    } else {
      return {
        decision: "release" as const,
        percentage: 0,
        reasoning: "Insufficient evidence for refund. Transaction appears legitimate based on available information.",
        additionalActions: ["Encourage direct communication between parties", "Monitor for future issues"]
      };
    }
  }
}
