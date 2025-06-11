import { invokeAI } from "../index";
import { DisputeCase } from "~~/types/bedrock";

export class DisputeResolutionAgent {
  async analyzeDispute(dispute: DisputeCase) {
    const prompt = `You are an expert AI dispute resolution specialist for a blockchain-based sustainable marketplace. Analyze this dispute and provide comprehensive resolution recommendations.

DISPUTE DETAILS:
- Order ID: ${dispute.orderId}
- Issue Description: ${dispute.issue}
- Evidence Provided: ${dispute.evidence.join("\n")}
- Buyer Address: ${dispute.buyer || 'Not provided'}
- Seller Address: ${dispute.seller || 'Not provided'}
- Order Value: $${dispute.orderValue || 'Unknown'}
- Platform: Decentralized sustainable marketplace

MARKETPLACE CONTEXT:
- Focus on sustainable/eco-friendly products
- Blockchain-based transactions (irreversible)
- Community-driven reputation system
- Emphasis on fair trade and ethical practices

ANALYSIS REQUIREMENTS:

1. DISPUTE ASSESSMENT:
   - Categorize the dispute type (delivery, quality, description mismatch, fraud, etc.)
   - Evaluate evidence strength and credibility (0-100 scale)
   - Identify key facts and disputed claims
   - Assess potential fraud indicators

2. POLICY APPLICATION:
   - Apply relevant marketplace policies for sustainable products
   - Consider blockchain transaction finality
   - Evaluate warranty/return policy applicability
   - Review seller reputation implications

3. RESOLUTION RECOMMENDATION:
   - Primary resolution: REFUND (0-100%), RELEASE (seller keeps funds), or PARTIAL (specify %)
   - Detailed rationale for the decision
   - Alternative resolution options if primary fails
   - Specific actions for buyer and seller

4. RISK ASSESSMENT:
   - Fraud probability (0-100%)
   - Pattern analysis for repeat issues
   - Seller reliability evaluation
   - Impact on marketplace integrity

5. IMPLEMENTATION PLAN:
   - Step-by-step resolution process
   - Timeline for resolution
   - Required follow-up actions
   - Monitoring requirements

Provide legally-sound, fair, and actionable resolution that maintains marketplace integrity while protecting both parties' interests. Focus on sustainable marketplace values and community trust.`;

    try {
      const response = await invokeAI(prompt);

      if (!response || !response.content || !response.content[0]?.text) {
        throw new Error("Invalid AI response format");
      }

      return this.parseAdvancedResolution(response.content[0].text, dispute);

    } catch (error) {
      console.error("❌ AI Dispute Resolver temporarily unavailable:", error);
      throw new Error("AI Dispute Resolver is temporarily unavailable. Please try again in a moment.");
    }
  }

  private parseAdvancedResolution(aiText: string, dispute: DisputeCase) {
    try {
      console.log("🤖 Processing AI dispute resolution...");
      console.log("⚖️ AI Response length:", aiText.length, "characters");

      // Extract resolution decision and percentage
      const decision = this.extractDecision(aiText);
      const percentage = this.extractPercentage(aiText, decision);
      const reasoning = this.extractReasoning(aiText) ||
                       "AI analysis recommends this resolution based on evidence and marketplace policies";

      const additionalActions = this.extractActions(aiText);
      const fraudProbability = this.extractFraudProbability(aiText);
      const evidenceStrength = this.extractEvidenceStrength(aiText);
      const timeline = this.extractTimeline(aiText);
      const riskAssessment = this.extractRiskAssessment(aiText);

      const resolution = {
        decision,
        percentage,
        reasoning: reasoning.substring(0, 400), // Limit length
        additionalActions: additionalActions.slice(0, 5),
        fraudProbability,
        evidenceStrength,
        timeline,
        riskAssessment,
        category: this.categorizeDispute(dispute.issue),
        confidence: this.calculateConfidence(aiText, dispute),
        followUpRequired: this.extractFollowUpActions(aiText)
      };

      console.log("✅ Successfully parsed AI dispute resolution:", {
        decision: resolution.decision,
        percentage: resolution.percentage,
        confidence: resolution.confidence
      });

      return resolution;

    } catch (error) {
      console.error("❌ Error parsing AI dispute resolution:", error);
      throw new Error("Failed to process AI dispute analysis");
    }
  }

  private extractDecision(text: string): "refund" | "release" | "partial" {
    const textLower = text.toLowerCase();

    // Look for explicit decision keywords
    if (textLower.includes('full refund') || textLower.includes('100% refund')) {
      return "refund";
    }
    if (textLower.includes('partial refund') || textLower.includes('partial resolution')) {
      return "partial";
    }
    if (textLower.includes('release funds') || textLower.includes('no refund') || textLower.includes('seller keeps')) {
      return "release";
    }

    // Look for percentage indicators
    const percentageMatch = text.match(/(\d+)%/);
    if (percentageMatch) {
      const percent = parseInt(percentageMatch[1]);
      if (percent >= 90) return "refund";
      if (percent > 10) return "partial";
      return "release";
    }

    // Default based on common dispute resolution patterns
    if (textLower.includes('refund')) return "refund";
    if (textLower.includes('partial')) return "partial";

    return "partial"; // Conservative default
  }

  private extractPercentage(text: string, decision: "refund" | "release" | "partial"): number {
    // Look for explicit percentage
    const percentageMatch = text.match(/(\d+)%\s*(?:refund|compensation|return)/i);
    if (percentageMatch) {
      return Math.min(100, Math.max(0, parseInt(percentageMatch[1])));
    }

    // Default percentages based on decision
    switch (decision) {
      case "refund": return 100;
      case "release": return 0;
      case "partial": return 50;
      default: return 50;
    }
  }

  private extractReasoning(text: string): string | null {
    const patterns = [
      /reasoning[:\s]*([^.]+(?:\.[^.]+){0,3})/i,
      /rationale[:\s]*([^.]+(?:\.[^.]+){0,3})/i,
      /because[:\s]*([^.]+(?:\.[^.]+){0,3})/i,
      /analysis[:\s]*([^.]+(?:\.[^.]+){0,3})/i,
      /recommendation[:\s]*([^.]+(?:\.[^.]+){0,3})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 30) {
        return match[1].trim();
      }
    }

    // Fallback: extract first substantial paragraph
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 40);
    return sentences[0]?.trim() || null;
  }

  private extractActions(text: string): string[] {
    const actions: string[] = [];

    // Look for action items
    const actionPatterns = [
      /(?:^|\n)\s*(?:\d+\.|\*|\-)\s*([^\n]+)/g,
      /action[s]?[:\s]*([^.]+)/gi,
      /step[s]?[:\s]*([^.]+)/gi,
      /recommend[:\s]*([^.]+)/gi
    ];

    for (const pattern of actionPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 15) {
          actions.push(match[1].trim().replace(/^(?:\d+\.|\*|\-)\s*/, ''));
        }
      }
    }

    // Default actions if none found
    if (actions.length === 0) {
      actions.push(
        "Process resolution according to decision",
        "Update dispute status in system",
        "Notify both parties of resolution",
        "Monitor compliance with resolution",
        "Update seller/buyer reputation scores"
      );
    }

    return actions.slice(0, 5);
  }

  private extractFraudProbability(text: string): number {
    const fraudKeywords = ['fraud', 'scam', 'suspicious', 'fake', 'deceptive', 'illegitimate'];

    let fraudScore = 0;

    // Check for fraud indicators
    for (const keyword of fraudKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        fraudScore += 25;
      }
    }

    // Check for probability modifiers
    if (text.toLowerCase().includes('unlikely') || text.toLowerCase().includes('legitimate')) {
      fraudScore = Math.max(0, fraudScore - 30);
    } else if (text.toLowerCase().includes('likely') || text.toLowerCase().includes('probable')) {
      fraudScore += 20;
    }

    // Look for explicit percentages
    const fraudPercentMatch = text.match(/fraud.*?(\d+)%/i) || text.match(/(\d+)%.*?fraud/i);
    if (fraudPercentMatch) {
      return Math.min(100, Math.max(0, parseInt(fraudPercentMatch[1])));
    }

    return Math.min(100, Math.max(0, fraudScore));
  }

  private extractEvidenceStrength(text: string): number {
    const strengthKeywords = {
      'strong': 80, 'compelling': 85, 'conclusive': 90, 'definitive': 95,
      'weak': 30, 'insufficient': 25, 'lacking': 20, 'minimal': 15,
      'moderate': 60, 'adequate': 65, 'reasonable': 70, 'solid': 75
    };

    for (const [keyword, score] of Object.entries(strengthKeywords)) {
      if (text.toLowerCase().includes(keyword + ' evidence') ||
          text.toLowerCase().includes('evidence is ' + keyword)) {
        return score;
      }
    }

    // Look for explicit scores
    const evidenceMatch = text.match(/evidence.*?(\d+)(?:%|\/100)/i);
    if (evidenceMatch) {
      return Math.min(100, Math.max(0, parseInt(evidenceMatch[1])));
    }

    return 60; // Default moderate strength
  }

  private extractTimeline(text: string): string {
    const timePatterns = [
      /(\d+)\s*(?:business\s+)?(?:days?|hours?|weeks?)/gi,
      /(?:within|by)\s*([^.]+)/gi,
      /timeline[:\s]*([^.]+)/gi,
      /(?:immediate|immediately)/gi
    ];

    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    if (text.toLowerCase().includes('immediate')) {
      return "Immediate action required";
    }

    return "3-5 business days";
  }

  private extractRiskAssessment(text: string): string {
    const riskLevels = ['low', 'medium', 'high', 'minimal', 'significant', 'critical'];
    const riskKeywords = ['risk', 'danger', 'concern', 'threat'];

    for (const level of riskLevels) {
      for (const keyword of riskKeywords) {
        if (text.toLowerCase().includes(level + ' ' + keyword) ||
            text.toLowerCase().includes(keyword + ' is ' + level)) {
          return `${level.charAt(0).toUpperCase() + level.slice(1)} risk identified`;
        }
      }
    }

    return "Standard risk profile";
  }

  private categorizeDispute(issue: string): string {
    const categories = {
      'delivery': ['delivery', 'shipping', 'received', 'arrived', 'not received'],
      'quality': ['quality', 'defective', 'broken', 'damaged', 'poor quality'],
      'description': ['description', 'mismatch', 'different', 'not as described', 'misleading'],
      'fraud': ['fraud', 'scam', 'fake', 'counterfeit', 'suspicious'],
      'payment': ['payment', 'charge', 'billing', 'refund', 'overcharged'],
      'sustainability': ['not sustainable', 'greenwashing', 'environmental claims', 'eco-friendly']
    };

    const issueLower = issue.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => issueLower.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  private calculateConfidence(text: string, dispute: DisputeCase): number {
    let confidence = 70; // Base confidence

    // Evidence quality
    if (dispute.evidence && dispute.evidence.length > 2) confidence += 15;
    else if (dispute.evidence && dispute.evidence.length > 0) confidence += 10;

    // Issue clarity
    if (dispute.issue && dispute.issue.length > 50) confidence += 10;
    else if (dispute.issue && dispute.issue.length > 20) confidence += 5;

    // AI response quality
    if (text.length > 500) confidence += 10;
    if (text.toLowerCase().includes('analysis') || text.toLowerCase().includes('evidence')) confidence += 5;

    // Look for explicit confidence in text
    const confidenceMatch = text.match(/confidence[^0-9]*([0-9]+)%?/i);
    if (confidenceMatch) {
      const aiConfidence = parseInt(confidenceMatch[1]);
      if (aiConfidence >= 0 && aiConfidence <= 100) {
        return aiConfidence;
      }
    }

    return Math.min(95, Math.max(60, confidence));
  }

  private extractFollowUpActions(text: string): string[] {
    const followUpKeywords = ['follow up', 'monitor', 'check', 'verify', 'confirm', 'review'];
    const actions: string[] = [];

    for (const keyword of followUpKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        actions.push(`${keyword.charAt(0).toUpperCase() + keyword.slice(1)} required`);
      }
    }

    if (actions.length === 0) {
      actions.push("Monitor resolution compliance", "Update dispute records");
    }

    return actions.slice(0, 3);
  }
}
