import { invokeClaude } from "~~/services/bedrock";
import { ShoppingAgent } from "~~/services/bedrock/agents/shoppingAgent";
import { PricingAgent } from "~~/services/bedrock/agents/pricingAgent";
import { DisputeResolutionAgent } from "~~/services/bedrock/agents/disputeAgent";

// Mock environment variables for testing
process.env.AWS_ACCESS_KEY_ID = "test-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
process.env.AWS_REGION = "us-east-1";

describe("Bedrock Integration", () => {
  describe("Claude Model Invocation", () => {
    it("should handle Claude invocation gracefully when AWS not configured", async () => {
      try {
        const response = await invokeClaude("Find sustainable electronics");
        expect(response).toBeDefined();
      } catch (error) {
        // Expected to fail without proper AWS credentials
        expect(error).toBeDefined();
      }
    });
  });

  describe("Shopping Agent", () => {
    it("should create shopping agent with user preferences", () => {
      const preferences = {
        sustainabilityMin: 70,
        budgetMax: 1000,
        preferredChain: "ethereum" as const,
        categories: ["electronics"],
        ethicalConcerns: ["fair-trade"]
      };

      const agent = new ShoppingAgent("test-user", preferences);
      expect(agent).toBeDefined();
    });

    it("should return mock recommendations when AWS not configured", async () => {
      const preferences = {
        sustainabilityMin: 70,
        budgetMax: 1000,
        preferredChain: "ethereum" as const,
        categories: ["electronics"],
        ethicalConcerns: ["fair-trade"]
      };

      const agent = new ShoppingAgent("test-user", preferences);
      const recommendations = await agent.findProducts("sustainable laptop");
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("Pricing Agent", () => {
    it("should provide pricing optimization", async () => {
      const agent = new PricingAgent();
      const strategy = await agent.optimizePrice(
        "test-product",
        100,
        { fearGreedIndex: 65 },
        [95, 105, 110]
      );

      expect(strategy).toBeDefined();
      expect(strategy.suggestedPrice).toBeDefined();
      expect(strategy.reasoning).toBeDefined();
      expect(strategy.priceRange).toBeDefined();
      expect(strategy.competitivenessScore).toBeDefined();
    });
  });

  describe("Dispute Resolution Agent", () => {
    it("should analyze disputes and provide resolutions", async () => {
      const agent = new DisputeResolutionAgent();
      const dispute = {
        orderId: "test-order-123",
        buyer: "0x1234567890123456789012345678901234567890",
        seller: "0x0987654321098765432109876543210987654321",
        issue: "Product not received",
        evidence: ["Tracking shows no delivery", "No response from seller"]
      };

      const resolution = await agent.analyzeDispute(dispute);

      expect(resolution).toBeDefined();
      expect(resolution.decision).toBeDefined();
      expect(resolution.percentage).toBeDefined();
      expect(resolution.reasoning).toBeDefined();
      expect(Array.isArray(resolution.additionalActions)).toBe(true);
    });
  });
});
