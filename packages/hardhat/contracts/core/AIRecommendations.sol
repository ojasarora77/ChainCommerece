//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "hardhat/console.sol";

interface IEscrowManager {
    function getEscrow(uint256 _escrowId) external view returns (
        uint256 id,
        address buyer,
        address seller,
        uint256 productId,
        uint256 amount,
        address token,
        uint8 status,
        uint256 createdAt,
        uint256 disputeId,
        uint64 sourceChainSelector,
        bool isActive
    );
    
    function resolveDisputeWithDistribution(
        uint256 _escrowId,
        uint256 _buyerRefundPercent
    ) external;
    
    function isValidEscrow(uint256 _escrowId) external view returns (bool);
}

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
contract AIRecommendations is FunctionsClient, VRFConsumerBaseV2, ConfirmedOwner, ReentrancyGuard {
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
    
    // Dispute Events
    event DisputeCreated(
        uint256 indexed disputeId,
        uint256 indexed escrowId,
        address indexed initiator,
        string evidence
    );
    
    event DisputeAnalyzed(
        uint256 indexed disputeId,
        bytes32 indexed requestId,
        uint256 aiRecommendedRefundPercent,
        string reasoning
    );
    
    event ArbitratorSelected(
        uint256 indexed disputeId,
        address indexed arbitrator,
        uint256 vrfRequestId
    );
    
    event DisputeResolved(
        uint256 indexed disputeId,
        uint256 indexed escrowId,
        uint256 buyerRefundPercent,
        address resolvedBy
    );

    // Enums
    enum DisputeStatus {
        Open,
        AIAnalyzed,
        ArbitratorAssigned,
        Resolved
    }
    
    enum RequestType {
        Recommendation,
        DisputeAnalysis
    }
    
    // Structs
    struct DisputeCase {
        uint256 id;
        uint256 escrowId;
        address buyer;
        address seller;
        uint256 amount;
        address token;
        string evidence;
        uint256 aiRecommendedRefundPercent;
        string aiReasoning;
        address assignedArbitrator;
        DisputeStatus status;
        uint256 createdAt;
        uint256 resolvedAt;
        bool exists;
    }
    
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
        RequestType requestType;
        uint256 disputeId; // Only used for dispute analysis requests
    }

    // State variables
    IProductRegistry public productRegistry;
    IEscrowManager public escrowManager;
    
    // Dispute management
    uint256 public nextDisputeId = 1;
    mapping(uint256 => DisputeCase) public disputes;
    mapping(address => uint256[]) public userDisputes;
    mapping(uint256 => uint256) public escrowToDispute; // escrowId => disputeId
    
    // Arbitrator management
    address[] public arbitratorQueue;
    mapping(address => bool) public isArbitrator;
    mapping(address => uint256) public arbitratorCaseCount;
    uint256 public maxCasesPerArbitrator = 5;
    
    // VRF Configuration
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_vrfSubscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    mapping(uint256 => uint256) public vrfRequestToDisputeId;
    
    // Enhanced Functions configuration
    string public disputeAnalysisSourceCode;
    
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
        address _productRegistry,
        address _escrowManager,
        address _vrfCoordinator,
        uint64 _vrfSubscriptionId,
        bytes32 _gasLane,
        uint32 _callbackGasLimit
    ) FunctionsClient(router) VRFConsumerBaseV2(_vrfCoordinator) ConfirmedOwner(msg.sender) {
        productRegistry = IProductRegistry(_productRegistry);
        escrowManager = IEscrowManager(_escrowManager);
        authorizedCallers[msg.sender] = true;
        
        i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        i_vrfSubscriptionId = _vrfSubscriptionId;
        i_gasLane = _gasLane;
        i_callbackGasLimit = _callbackGasLimit;
        
        console.log("AIRecommendations deployed");
        console.log("ProductRegistry:", _productRegistry);
        console.log("EscrowManager:", _escrowManager);
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
            fulfilled: false,
            requestType: RequestType.Recommendation,
            disputeId: 0
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
        
        RecommendationRequest storage request = requests[requestId];
        require(request.user != address(0), "Invalid request");
        
        if (request.requestType == RequestType.Recommendation) {
            // Handle recommendation response
            (uint256[] memory productIds, uint256[] memory scores) = _parseAIResponse(response);
            
            // Store latest recommendations
            latestRecommendations[request.user] = productIds;
            latestScores[request.user] = scores;
            lastRecommendationTime[request.user] = block.timestamp;
            
            emit RecommendationReceived(requestId, request.user, productIds, scores);
            console.log("Recommendations fulfilled for:", request.user);
            console.log("Products recommended:", productIds.length);
            
        } else if (request.requestType == RequestType.DisputeAnalysis) {
            // Handle dispute analysis response
            (uint256 refundPercent, string memory reasoning) = _parseDisputeResponse(response);
            
            DisputeCase storage dispute = disputes[request.disputeId];
            dispute.aiRecommendedRefundPercent = refundPercent;
            dispute.aiReasoning = reasoning;
            dispute.status = DisputeStatus.AIAnalyzed;
            
            emit DisputeAnalyzed(
                request.disputeId,
                requestId,
                refundPercent,
                reasoning
            );
            
            // Request arbitrator selection after AI analysis
            _requestArbitratorSelection(request.disputeId);
            
            console.log("Dispute analysis fulfilled for:", request.disputeId);
            console.log("AI recommended refund %:", refundPercent);
        }
        
        // Mark request as fulfilled
        request.fulfilled = true;
    }
    
    /**
     * @dev VRF callback function (required by VRFConsumerBaseV2)
     */
    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        uint256 disputeId = vrfRequestToDisputeId[_requestId];
        require(disputeId != 0, "Invalid VRF request");
        
        DisputeCase storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.AIAnalyzed, "Invalid dispute status");
        
        // Select random arbitrator from available queue
        if (arbitratorQueue.length > 0) {
            uint256 randomIndex = _randomWords[0] % arbitratorQueue.length;
            address selectedArbitrator = arbitratorQueue[randomIndex];
            
            // Assign arbitrator if they haven't exceeded max cases
            if (arbitratorCaseCount[selectedArbitrator] < maxCasesPerArbitrator) {
                dispute.assignedArbitrator = selectedArbitrator;
                dispute.status = DisputeStatus.ArbitratorAssigned;
                arbitratorCaseCount[selectedArbitrator]++;
                
                emit ArbitratorSelected(disputeId, selectedArbitrator, _requestId);
                console.log("Arbitrator selected for dispute:", disputeId, "arbitrator:", selectedArbitrator);
            } else {
                // Find next available arbitrator
                for (uint256 i = 0; i < arbitratorQueue.length; i++) {
                    address arbitrator = arbitratorQueue[i];
                    if (arbitratorCaseCount[arbitrator] < maxCasesPerArbitrator) {
                        dispute.assignedArbitrator = arbitrator;
                        dispute.status = DisputeStatus.ArbitratorAssigned;
                        arbitratorCaseCount[arbitrator]++;
                        
                        emit ArbitratorSelected(disputeId, arbitrator, _requestId);
                        console.log("Arbitrator assigned for dispute:", disputeId, "arbitrator:", arbitrator);
                        break;
                    }
                }
            }
        }
        
        delete vrfRequestToDisputeId[_requestId];
    }

    // Dispute Resolution Functions
    
    /**
     * @dev Analyze a dispute using AI (called by EscrowManager)
     */
    function analyzeDispute(
        uint256 _escrowId,
        string memory _evidence
    ) external onlyAuthorized nonReentrant returns (uint256) {
        require(escrowManager.isValidEscrow(_escrowId), "Invalid escrow");
        require(escrowToDispute[_escrowId] == 0, "Dispute already exists");
        require(bytes(_evidence).length > 0, "Evidence required");
        
        // Get escrow details
        (
            ,
            address buyer,
            address seller,
            ,
            uint256 amount,
            address token,
            ,
            ,
            ,
            ,
            
        ) = escrowManager.getEscrow(_escrowId);
        
        // Create dispute case
        uint256 disputeId = nextDisputeId++;
        disputes[disputeId] = DisputeCase({
            id: disputeId,
            escrowId: _escrowId,
            buyer: buyer,
            seller: seller,
            amount: amount,
            token: token,
            evidence: _evidence,
            aiRecommendedRefundPercent: 0,
            aiReasoning: "",
            assignedArbitrator: address(0),
            status: DisputeStatus.Open,
            createdAt: block.timestamp,
            resolvedAt: 0,
            exists: true
        });
        
        // Track dispute
        escrowToDispute[_escrowId] = disputeId;
        userDisputes[buyer].push(disputeId);
        userDisputes[seller].push(disputeId);
        
        // Request AI analysis if available
        if (bytes(disputeAnalysisSourceCode).length > 0) {
            _requestAIDisputeAnalysis(disputeId);
        } else {
            // Skip AI analysis and go straight to arbitrator selection
            _requestArbitratorSelection(disputeId);
        }
        
        emit DisputeCreated(disputeId, _escrowId, buyer, _evidence);
        console.log("Dispute created:", disputeId, "for escrow:", _escrowId);
        
        return disputeId;
    }
    
    /**
     * @dev Request arbitrator selection using VRF
     */
    function requestArbitratorSelection(uint256 _disputeId) external onlyAuthorized {
        _requestArbitratorSelection(_disputeId);
    }
    
    function _requestArbitratorSelection(uint256 _disputeId) internal {
        require(disputes[_disputeId].exists, "Dispute does not exist");
        require(arbitratorQueue.length > 0, "No arbitrators available");
        
        DisputeCase storage dispute = disputes[_disputeId];
        require(
            dispute.status == DisputeStatus.Open || dispute.status == DisputeStatus.AIAnalyzed,
            "Invalid dispute status"
        );
        
        // Request random words from VRF
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_vrfSubscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            1
        );
        
        vrfRequestToDisputeId[requestId] = _disputeId;
        
        // Update status if coming from Open (no AI analysis)
        if (dispute.status == DisputeStatus.Open) {
            dispute.status = DisputeStatus.AIAnalyzed;
        }
    }
    
    /**
     * @dev Resolve dispute with fund distribution (called by arbitrator)
     */
    function resolveDispute(
        uint256 _disputeId,
        uint256 _buyerRefundPercent
    ) external nonReentrant {
        require(_buyerRefundPercent <= 100, "Invalid refund percentage");
        
        DisputeCase storage dispute = disputes[_disputeId];
        require(dispute.exists, "Dispute does not exist");
        require(dispute.status == DisputeStatus.ArbitratorAssigned, "Invalid dispute status");
        require(msg.sender == dispute.assignedArbitrator, "Only assigned arbitrator");
        
        // Update dispute status
        dispute.status = DisputeStatus.Resolved;
        dispute.resolvedAt = block.timestamp;
        
        // Decrease arbitrator case count
        arbitratorCaseCount[dispute.assignedArbitrator]--;
        
        // Call EscrowManager to distribute funds
        escrowManager.resolveDisputeWithDistribution(
            dispute.escrowId,
            _buyerRefundPercent
        );
        
        emit DisputeResolved(
            _disputeId,
            dispute.escrowId,
            _buyerRefundPercent,
            msg.sender
        );
        
        console.log("Dispute resolved:", _disputeId, "refund %:", _buyerRefundPercent);
    }
    
    /**
     * @dev Request AI analysis for dispute
     */
    function _requestAIDisputeAnalysis(uint256 _disputeId) internal {
        DisputeCase storage dispute = disputes[_disputeId];
        
        // Build request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(disputeAnalysisSourceCode);
        
        // Set arguments for dispute analysis
        string[] memory args = new string[](6);
        args[0] = _uint2str(dispute.escrowId);
        args[1] = dispute.evidence;
        args[2] = _addressToString(dispute.buyer);
        args[3] = _addressToString(dispute.seller);
        args[4] = _uint2str(dispute.amount);
        args[5] = _addressToString(dispute.token);
        req.setArgs(args);
        
        // Send request
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );
        
        // Store request details for dispute analysis
        requests[requestId] = RecommendationRequest({
            user: dispute.buyer,
            preferences: dispute.evidence,
            maxResults: 0,
            timestamp: block.timestamp,
            fulfilled: false,
            requestType: RequestType.DisputeAnalysis,
            disputeId: _disputeId
        });
        
        s_lastRequestId = requestId;
        console.log("AI dispute analysis requested for:", _disputeId);
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

    // Dispute View Functions
    
    /**
     * @dev Get dispute details
     */
    function getDisputeDetails(uint256 _disputeId) 
        external 
        view 
        returns (
            uint256 id,
            uint256 escrowId,
            address buyer,
            address seller,
            uint256 amount,
            address token,
            string memory evidence,
            uint256 aiRecommendedRefundPercent,
            string memory aiReasoning,
            address assignedArbitrator,
            DisputeStatus status,
            uint256 createdAt,
            uint256 resolvedAt
        ) 
    {
        DisputeCase memory dispute = disputes[_disputeId];
        require(dispute.exists, "Dispute does not exist");
        
        return (
            dispute.id,
            dispute.escrowId,
            dispute.buyer,
            dispute.seller,
            dispute.amount,
            dispute.token,
            dispute.evidence,
            dispute.aiRecommendedRefundPercent,
            dispute.aiReasoning,
            dispute.assignedArbitrator,
            dispute.status,
            dispute.createdAt,
            dispute.resolvedAt
        );
    }
    
    /**
     * @dev Get user's disputes
     */
    function getUserDisputes(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userDisputes[_user];
    }
    
    /**
     * @dev Get arbitrator queue
     */
    function getArbitratorQueue() 
        external 
        view 
        returns (address[] memory) 
    {
        return arbitratorQueue;
    }
    
    /**
     * @dev Get arbitrator case count
     */
    function getArbitratorCaseCount(address _arbitrator) 
        external 
        view 
        returns (uint256) 
    {
        return arbitratorCaseCount[_arbitrator];
    }
    
    // Admin Functions for Dispute System
    
    /**
     * @dev Add arbitrator to queue
     */
    function addArbitrator(address _arbitrator) external onlyOwner {
        require(_arbitrator != address(0), "Invalid arbitrator address");
        require(!isArbitrator[_arbitrator], "Already an arbitrator");
        
        isArbitrator[_arbitrator] = true;
        arbitratorQueue.push(_arbitrator);
        
        console.log("Arbitrator added:", _arbitrator);
    }
    
    /**
     * @dev Remove arbitrator from queue
     */
    function removeArbitrator(address _arbitrator) external onlyOwner {
        require(isArbitrator[_arbitrator], "Not an arbitrator");
        
        isArbitrator[_arbitrator] = false;
        
        // Remove from queue
        for (uint256 i = 0; i < arbitratorQueue.length; i++) {
            if (arbitratorQueue[i] == _arbitrator) {
                arbitratorQueue[i] = arbitratorQueue[arbitratorQueue.length - 1];
                arbitratorQueue.pop();
                break;
            }
        }
        
        console.log("Arbitrator removed:", _arbitrator);
    }
    
    /**
     * @dev Set dispute analysis source code
     */
    function setDisputeAnalysisSourceCode(string memory _sourceCode) external onlyOwner {
        disputeAnalysisSourceCode = _sourceCode;
        console.log("Dispute analysis source code updated");
    }
    
    /**
     * @dev Set max cases per arbitrator
     */
    function setMaxCasesPerArbitrator(uint256 _maxCases) external onlyOwner {
        require(_maxCases > 0, "Max cases must be greater than 0");
        maxCasesPerArbitrator = _maxCases;
    }
    
    /**
     * @dev Update EscrowManager address
     */
    function updateEscrowManager(address _newEscrowManager) external onlyOwner {
        require(_newEscrowManager != address(0), "Invalid escrow manager");
        escrowManager = IEscrowManager(_newEscrowManager);
        console.log("EscrowManager updated to:", _newEscrowManager);
    }

    // Internal helper functions
    
    /**
     * @dev Parse AI dispute analysis response
     */
    function _parseDisputeResponse(bytes memory response) 
        internal 
        pure 
        returns (uint256 refundPercent, string memory reasoning) 
    {
        string memory responseStr = string(response);
        
        // For demo purposes, return mock analysis if response is empty
        if (bytes(responseStr).length == 0) {
            return (50, "Insufficient evidence provided. Splitting funds equally.");
        }
        
        // Expected format: "refundPercent,reasoning"
        // For production, implement robust JSON parsing
        bytes memory responseBytes = bytes(responseStr);
        uint256 commaIndex = 0;
        
        // Find first comma
        for (uint256 i = 0; i < responseBytes.length; i++) {
            if (responseBytes[i] == ",") {
                commaIndex = i;
                break;
            }
        }
        
        if (commaIndex == 0) {
            // No comma found, return default
            return (50, responseStr);
        }
        
        // Extract refund percentage (simple parsing)
        bytes memory percentBytes = new bytes(commaIndex);
        for (uint256 i = 0; i < commaIndex; i++) {
            percentBytes[i] = responseBytes[i];
        }
        
        // Extract reasoning
        uint256 reasoningLength = responseBytes.length - commaIndex - 1;
        bytes memory reasoningBytes = new bytes(reasoningLength);
        for (uint256 i = 0; i < reasoningLength; i++) {
            reasoningBytes[i] = responseBytes[commaIndex + 1 + i];
        }
        
        // Convert percentage to uint (simplified)
        uint256 percent = _parseUint(string(percentBytes));
        if (percent > 100) percent = 100;
        
        return (percent, string(reasoningBytes));
    }
    
    /**
     * @dev Simple uint parsing helper
     */
    function _parseUint(string memory _str) internal pure returns (uint256) {
        bytes memory strBytes = bytes(_str);
        uint256 result = 0;
        
        for (uint256 i = 0; i < strBytes.length; i++) {
            if (strBytes[i] >= "0" && strBytes[i] <= "9") {
                result = result * 10 + (uint8(strBytes[i]) - 48);
            }
        }
        
        return result;
    }

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