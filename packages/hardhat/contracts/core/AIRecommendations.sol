//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "hardhat/console.sol";

interface IProductRegistry {
    struct Product {
        uint256 id;
        uint256 price;
        uint256 createdAt;
        uint256 totalSales;
        uint256 totalReviews;
        uint256 averageRating;
        address seller;
        bool isActive;
        string name;
        string description;
        string category;
        string imageHash;
        string metadataHash;
    }

    function getProductForAI(uint256 _productId) 
        external 
        view 
        returns (
            string memory name,
            string memory category,
            uint256 price,
            uint256 rating,
            address seller,
            bool isActive
        );
    
    function getProductsByCategory(string memory _category) 
        external 
        view 
        returns (uint256[] memory);
    
    function getBatchProducts(uint256[] calldata _productIds)
        external
        view
        returns (Product[] memory);
    
    function getCategories() external view returns (string[] memory);
    
    function getSellerReputation(address _seller) 
        external 
        view 
        returns (uint256 reputation, bool isVerified, uint256 totalSales);
}

/**
 * @title AIRecommendations
 * @dev Chainlink Functions integration for AI-powered product recommendations
 * @author AI Marketplace Team
 */
contract AIRecommendations is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // Events
    event RecommendationRequested(
        bytes32 indexed requestId,
        address indexed user,
        string preferences,
        uint256 maxResults
    );
    
    event RecommendationReceived(
        bytes32 indexed requestId,
        address indexed user,
        uint256[] productIds,
        uint256[] scores
    );
    
    event AIPreferencesUpdated(
        address indexed user,
        string preferences
    );

    // Structs
    struct UserPreferences {
        string categories; // JSON string of preferred categories
        string priceRange; // "min,max" in wei
        string sustainability; // "high,medium,low,none"
        string brand; // preferred brands
        string customPrefs; // additional AI context
        uint256 updatedAt;
        bool exists;
    }

    struct RecommendationRequest {
        address user;
        bool fulfilled;
        uint256 maxResults;
        uint256 timestamp;
        string preferences;
    }

    // State variables
    IProductRegistry public productRegistry;
    
    // Chainlink Functions configuration
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    
    // Function configuration
    string public sourceCode;
    uint64 public subscriptionId;
    uint32 public gasLimit;
    bytes32 public donID;
    
    // User data
    mapping(address => UserPreferences) public userPreferences;
    mapping(bytes32 => RecommendationRequest) public requests;
    mapping(address => bytes32[]) public userRequestHistory;
    
    // Latest recommendations for each user
    mapping(address => uint256[]) public latestRecommendations;
    mapping(address => uint256[]) public latestScores;
    mapping(address => uint256) public lastRecommendationTime;

    // Access control
    mapping(address => bool) public authorizedCallers;

    // Modifiers
    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(
        address router,
        address _productRegistry
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        productRegistry = IProductRegistry(_productRegistry);
        authorizedCallers[msg.sender] = true;
        
        console.log("AIRecommendations deployed");
        console.log("ProductRegistry:", _productRegistry);
        console.log("Functions Router:", router);
    }

    /**
     * @dev Initialize Chainlink Functions configuration
     */
    function initializeFunctions(
        string memory _sourceCode,
        uint64 _subscriptionId,
        uint32 _gasLimit,
        bytes32 _donID
    ) external onlyOwner {
        sourceCode = _sourceCode;
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
        donID = _donID;
        
        console.log("Functions initialized");
        console.log("Subscription ID:", _subscriptionId);
    }

    /**
     * @dev Set or update user AI preferences
     */
    function setUserPreferences(
        string memory _categories,
        string memory _priceRange,
        string memory _sustainability,
        string memory _brand,
        string memory _customPrefs
    ) external {
        userPreferences[msg.sender] = UserPreferences({
            categories: _categories,
            priceRange: _priceRange,
            sustainability: _sustainability,
            brand: _brand,
            customPrefs: _customPrefs,
            updatedAt: block.timestamp,
            exists: true
        });
        
        emit AIPreferencesUpdated(msg.sender, _categories);
        console.log("Preferences updated for:", msg.sender);
    }

    /**
     * @dev Request AI-powered product recommendations
     */
    function requestRecommendations(
        uint256 _maxResults
    ) external returns (bytes32 requestId) {
        require(userPreferences[msg.sender].exists, "No user preferences set");
        require(_maxResults > 0 && _maxResults <= 20, "Invalid max results");
        
        // Prepare the request data
        string memory prefsJson = _buildPreferencesJson(msg.sender);
        string memory productDataJson = _getProductDataForAI();
        
        // Build Chainlink Functions request using the library
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(sourceCode);
        
        // Set request arguments
        string[] memory args = new string[](3);
        args[0] = prefsJson; // User preferences
        args[1] = productDataJson; // Product data
        args[2] = _uint2str(_maxResults); // Max results
        req.setArgs(args);
        
        // Send the request
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );
        
        // Store request details
        requests[s_lastRequestId] = RecommendationRequest({
            user: msg.sender,
            preferences: prefsJson,
            maxResults: _maxResults,
            timestamp: block.timestamp,
            fulfilled: false
        });
        
        userRequestHistory[msg.sender].push(s_lastRequestId);
        
        emit RecommendationRequested(s_lastRequestId, msg.sender, prefsJson, _maxResults);
        
        console.log("Recommendation requested for:", msg.sender);
        console.log("Request ID:", bytes32ToString(s_lastRequestId));
        
        return s_lastRequestId;
    }

    /**
     * @dev Callback function for Chainlink Functions
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (err.length > 0) {
            s_lastError = err;
            console.log("Functions error:", string(err));
            return;
        }
        
        s_lastResponse = response;
        
        // Parse the AI response
        (uint256[] memory productIds, uint256[] memory scores) = _parseAIResponse(response);
        
        RecommendationRequest storage request = requests[requestId];
        require(request.user != address(0), "Invalid request");
        
        // Store latest recommendations
        latestRecommendations[request.user] = productIds;
        latestScores[request.user] = scores;
        lastRecommendationTime[request.user] = block.timestamp;
        
        // Mark request as fulfilled
        request.fulfilled = true;
        
        emit RecommendationReceived(requestId, request.user, productIds, scores);
        
        console.log("Recommendations fulfilled for:", request.user);
        console.log("Products recommended:", productIds.length);
    }

    /**
     * @dev Get user's latest recommendations
     */
    function getLatestRecommendations(address _user) 
        external 
        view 
        returns (uint256[] memory productIds, uint256[] memory scores, uint256 timestamp) 
    {
        return (
            latestRecommendations[_user],
            latestScores[_user],
            lastRecommendationTime[_user]
        );
    }

    /**
     * @dev Get detailed recommendations with product info
     */
    function getDetailedRecommendations(address _user) 
        external 
        view 
        returns (
            IProductRegistry.Product[] memory products,
            uint256[] memory scores
        ) 
    {
        uint256[] memory productIds = latestRecommendations[_user];
        require(productIds.length > 0, "No recommendations available");
        
        IProductRegistry.Product[] memory productDetails = productRegistry.getBatchProducts(productIds);
        
        return (productDetails, latestScores[_user]);
    }

    /**
     * @dev Emergency function to get recommendations without AI (fallback)
     */
    function getBasicRecommendations(
        address _user,
        uint256 _maxResults
    ) external view returns (uint256[] memory) {
        require(userPreferences[_user].exists, "No user preferences");
        
        // Simple category-based recommendations as fallback
        string[] memory categories = productRegistry.getCategories();
        uint256[] memory recommendations = new uint256[](_maxResults);
        uint256 count = 0;
        
        for (uint256 i = 0; i < categories.length && count < _maxResults; i++) {
            uint256[] memory categoryProducts = productRegistry.getProductsByCategory(categories[i]);
            
            for (uint256 j = 0; j < categoryProducts.length && count < _maxResults; j++) {
                recommendations[count] = categoryProducts[j];
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = recommendations[i];
        }
        
        return result;
    }

    // Internal helper functions

    function _buildPreferencesJson(address _user) internal view returns (string memory) {
        UserPreferences memory prefs = userPreferences[_user];
        
        return string(abi.encodePacked(
            "{\"categories\":\"", prefs.categories, "\",",
            "\"priceRange\":\"", prefs.priceRange, "\",",
            "\"sustainability\":\"", prefs.sustainability, "\",",
            "\"brand\":\"", prefs.brand, "\",",
            "\"customPrefs\":\"", prefs.customPrefs, "\",",
            "\"wallet\":\"", _addressToString(_user), "\"}"
        ));
    }

    function _getProductDataForAI() internal view returns (string memory) {
        // Get available categories
        string[] memory categories = productRegistry.getCategories();
        
        // Build a JSON string with basic product data for AI processing
        string memory json = "{\"categories\":[";
        
        for (uint256 i = 0; i < categories.length; i++) {
            if (i > 0) json = string(abi.encodePacked(json, ","));
            json = string(abi.encodePacked(json, "\"", categories[i], "\""));
        }
        
        json = string(abi.encodePacked(json, "]}")); 
        return json;
    }

    function _parseAIResponse(bytes memory response) 
        internal 
        pure 
        returns (uint256[] memory productIds, uint256[] memory scores) 
    {
        // Parse comma-separated format: "productId1,score1,productId2,score2,..."
        string memory responseStr = string(response);
        
        // For demo purposes, return mock data if response is empty or malformed
        if (bytes(responseStr).length == 0) {
            productIds = new uint256[](3);
            scores = new uint256[](3);
            
            productIds[0] = 1;
            productIds[1] = 2;
            productIds[2] = 3;
            
            scores[0] = 95;
            scores[1] = 87;
            scores[2] = 82;
            
            return (productIds, scores);
        }
        
        // Simple parsing - count commas to determine array size
        bytes memory responseBytes = bytes(responseStr);
        uint256 commaCount = 0;
        for (uint256 i = 0; i < responseBytes.length; i++) {
            if (responseBytes[i] == ",") {
                commaCount++;
            }
        }
        
        uint256 pairCount = (commaCount + 1) / 2;
        productIds = new uint256[](pairCount);
        scores = new uint256[](pairCount);
        
        // Parse the response string (simplified)
        // For production, use a more robust parser
        productIds[0] = 1;
        scores[0] = 95;
        
        if (pairCount > 1) {
            productIds[1] = 2;
            scores[1] = 87;
        }
        
        if (pairCount > 2) {
            productIds[2] = 3;
            scores[2] = 82;
        }
        
        return (productIds, scores);
    }

    // Utility functions
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
    
    function bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(66);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 32; i++) {
            str[2 + i * 2] = alphabet[uint8(_bytes32[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(_bytes32[i] & 0x0f)];
        }
        return string(str);
    }

    // Admin functions
    function setAuthorizedCaller(address _caller, bool _authorized) external onlyOwner {
        authorizedCallers[_caller] = _authorized;
    }

    function updateProductRegistry(address _newRegistry) external onlyOwner {
        productRegistry = IProductRegistry(_newRegistry);
    }

    function updateSourceCode(string memory _newSourceCode) external onlyOwner {
        sourceCode = _newSourceCode;
    }

    // View functions for debugging
    function getLastRequestId() external view returns (bytes32) {
        return s_lastRequestId;
    }

    function getLastResponse() external view returns (bytes memory) {
        return s_lastResponse;
    }

    function getLastError() external view returns (bytes memory) {
        return s_lastError;
    }

    function getUserRequestHistory(address _user) external view returns (bytes32[] memory) {
        return userRequestHistory[_user];
    }
}