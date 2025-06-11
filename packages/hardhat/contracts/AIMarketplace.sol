// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract AIMarketplace is FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    struct AIRecommendation {
        address user;
        string query;
        uint256 timestamp;
        bytes32 requestId;
        string[] recommendedProducts;
        uint256[] sustainabilityScores;
    }

    mapping(bytes32 => AIRecommendation) public recommendations;
    mapping(address => bytes32[]) public userRecommendations;

    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;
    bytes32 public donId; // Chainlink Functions DON ID

    string public bedrockSource = 
        "const query = args[0];"
        "const preferences = JSON.parse(args[1]);"
        "const apiKey = secrets.AWS_ACCESS_KEY;"
        "const secretKey = secrets.AWS_SECRET_KEY;"
        ""
        "// Call Amazon Bedrock API"
        "const bedrockResponse = await Functions.makeHttpRequest({"
        "  url: 'https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-haiku-20240307-v1:0/invoke',"
        "  method: 'POST',"
        "  headers: {"
        "    'Content-Type': 'application/json',"
        "    'Authorization': `AWS4-HMAC-SHA256 Credential=${apiKey}/...`"
        "  },"
        "  data: {"
        "    prompt: `Find sustainable products: ${query}`,"
        "    max_tokens: 1000"
        "  }"
        "});"
        ""
        "return Functions.encodeString(JSON.stringify(bedrockResponse.data));";

    event AIRecommendationRequested(
        address indexed user,
        bytes32 indexed requestId,
        string query
    );

    event AIRecommendationFulfilled(
        address indexed user,
        bytes32 indexed requestId,
        string[] products
    );

    constructor(address router) FunctionsClient(router) {}

    function requestAIRecommendation(
        string memory query,
        string memory preferencesJson
    ) external returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(bedrockSource);
        
        string[] memory args = new string[](2);
        args[0] = query;
        args[1] = preferencesJson;
        req.setArgs(args);

        // Add AWS credentials as encrypted secrets
        req.addSecretsReference("AWS_ACCESS_KEY");
        req.addSecretsReference("AWS_SECRET_KEY");
        
        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );

        recommendations[requestId] = AIRecommendation({
            user: msg.sender,
            query: query,
            timestamp: block.timestamp,
            requestId: requestId,
            recommendedProducts: new string[](0),
            sustainabilityScores: new uint256[](0)
        });

        userRecommendations[msg.sender].push(requestId);
        
        emit AIRecommendationRequested(msg.sender, requestId, query);
    }

    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        AIRecommendation storage rec = recommendations[requestId];
        
        if (err.length > 0) {
            // Handle error
            return;
        }

        // Parse response and update recommendation
        // This is simplified - actual implementation would parse JSON
        string memory responseStr = string(response);
        
        // Update recommendation with parsed data
        rec.recommendedProducts = parseProducts(responseStr);
        rec.sustainabilityScores = parseScores(responseStr);
        
        emit AIRecommendationFulfilled(
            rec.user,
            requestId,
            rec.recommendedProducts
        );
    }

    // Helper functions to parse response (implement based on response format)
    function parseProducts(string memory response) internal pure returns (string[] memory) {
        // Implementation needed
        string[] memory products = new string[](1);
        products[0] = "Sustainable Product";
        return products;
    }

    function parseScores(string memory response) internal pure returns (uint256[] memory) {
        // Implementation needed
        uint256[] memory scores = new uint256[](1);
        scores[0] = 85;
        return scores;
    }

    // Admin functions
    function setSubscriptionId(uint64 _subscriptionId) external {
        subscriptionId = _subscriptionId;
    }

    function setDonId(bytes32 _donId) external {
        donId = _donId;
    }

    function setGasLimit(uint32 _gasLimit) external {
        gasLimit = _gasLimit;
    }
}
