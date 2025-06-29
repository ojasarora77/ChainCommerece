//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

interface IProductRegistry {
    struct Product {
        uint256 id;
        string name;
        string description;
        string category;
        uint256 price;
        address seller;
        string imageHash;
        string metadataHash;
        bool isActive;
        uint256 createdAt;
        uint256 totalSales;
        uint256 totalReviews;
        uint256 averageRating;
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
    
    function purchaseProduct(uint256 _productId, address _buyer) external;
    function products(uint256 _productId) external view returns (Product memory);
}

interface IAIRecommendations {
    function getDetailedRecommendations(address _user) 
        external 
        view 
        returns (
            IProductRegistry.Product[] memory products,
            uint256[] memory scores
        );
}

/**
 * @title EscrowManager
 * @dev Comprehensive escrow system for AI marketplace with Chainlink integrations
 * @author AI Marketplace Team
 */
contract EscrowManager is 
    FunctionsClient,
    AutomationCompatibleInterface,
    VRFConsumerBaseV2,
    CCIPReceiver,
    ReentrancyGuard,
    Pausable,
    AccessControl 
{
    using FunctionsRequest for FunctionsRequest.Request;
    using SafeERC20 for IERC20;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    enum EscrowStatus {
        Created,
        Delivered,
        Disputed,
        Resolved,
        Refunded
    }

    enum DisputeOutcome {
        Pending,
        FavorBuyer,
        FavorSeller,
        Split
    }

    struct Escrow {
        uint256 id;
        address buyer;
        address seller;
        uint256 productId;
        uint256 amount;
        address token; // address(0) for ETH, token address for ERC20
        EscrowStatus status;
        uint256 createdAt;
        uint256 disputeId;
        uint64 sourceChainSelector; // CCIP chain selector for cross-chain payments
        bool isActive;
    }

    struct Dispute {
        uint256 id;
        uint256 escrowId;
        address initiator;
        string reason;
        DisputeOutcome outcome;
        address[] arbitrators;
        mapping(address => bool) hasVoted;
        mapping(address => DisputeOutcome) votes;
        uint256 votesCount;
        uint256 createdAt;
        uint256 resolvedAt;
        bytes aiAnalysis;
        bool isResolved;
    }

    // Events
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 productId,
        uint256 amount,
        address token
    );

    event EscrowDelivered(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller
    );

    event DisputeCreated(
        uint256 indexed disputeId,
        uint256 indexed escrowId,
        address indexed initiator,
        string reason
    );

    event DisputeResolved(
        uint256 indexed disputeId,
        uint256 indexed escrowId,
        DisputeOutcome outcome,
        address resolver
    );

    event FundsReleased(
        uint256 indexed escrowId,
        address indexed recipient,
        uint256 amount,
        address token
    );

    event AutoReleaseExecuted(
        uint256 indexed escrowId,
        uint256 timestamp
    );

    event ArbitratorsSelected(
        uint256 indexed disputeId,
        address[] arbitrators,
        uint256 vrfRequestId
    );

    event CCIPPaymentReceived(
        uint256 indexed escrowId,
        uint64 sourceChainSelector,
        address sender,
        uint256 amount
    );

    event AIDisputeAnalysisRequested(
        uint256 indexed disputeId,
        bytes32 requestId
    );

    event AIDisputeAnalysisReceived(
        uint256 indexed disputeId,
        bytes32 requestId,
        bytes analysis
    );

    event EmergencyWithdrawal(
        uint256 indexed escrowId,
        address indexed admin,
        address indexed recipient,
        uint256 amount,
        address token
    );

    // State variables
    IProductRegistry public productRegistry;
    IAIRecommendations public aiRecommendations;
    IERC20 public usdcToken;

    uint256 public nextEscrowId = 1;
    uint256 public nextDisputeId = 1;
    uint256 public constant AUTO_RELEASE_DELAY = 7 days;
    uint256 public constant DISPUTE_TIMEOUT = 3 days;
    uint256 public constant MAX_ARBITRATORS = 5;
    
    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => uint256[]) public userEscrows;
    mapping(address => uint256[]) public sellerEscrows;
    
    // Chainlink VRF configuration
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    
    mapping(uint256 => uint256) public vrfRequestToDisputeId;
    address[] public availableArbitrators;
    mapping(address => bool) public isArbitrator;
    
    // Chainlink Functions configuration
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    string public aiDisputeSourceCode;
    uint64 public functionsSubscriptionId;
    uint32 public functionsGasLimit;
    bytes32 public functionsDonID;
    
    mapping(bytes32 => uint256) public functionsRequestToDisputeId;
    
    // Automation configuration
    uint256 public lastUpkeepTimestamp;
    uint256 public upkeepInterval = 1 hours;
    
    // Fee configuration
    uint256 public platformFeePercentage = 250; // 2.5%
    uint256 public constant MAX_FEE_PERCENTAGE = 1000; // 10%
    address public feeRecipient;
    
    // Emergency controls
    bool public emergencyMode = false;
    mapping(uint256 => bool) public emergencyWithdrawn;

    constructor(
        address _productRegistry,
        address _aiRecommendations,
        address _usdcToken,
        address _functionsRouter,
        address _vrfCoordinator,
        uint64 _vrfSubscriptionId,
        bytes32 _gasLane,
        uint32 _callbackGasLimit,
        address _ccipRouter,
        address _feeRecipient
    ) 
        FunctionsClient(_functionsRouter)
        VRFConsumerBaseV2(_vrfCoordinator)
        CCIPReceiver(_ccipRouter)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MODERATOR_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        productRegistry = IProductRegistry(_productRegistry);
        aiRecommendations = IAIRecommendations(_aiRecommendations);
        usdcToken = IERC20(_usdcToken);
        
        i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        i_subscriptionId = _vrfSubscriptionId;
        i_gasLane = _gasLane;
        i_callbackGasLimit = _callbackGasLimit;
        
        feeRecipient = _feeRecipient;
        lastUpkeepTimestamp = block.timestamp;
        
        console.log("EscrowManager deployed");
        console.log("ProductRegistry:", _productRegistry);
        console.log("USDC Token:", _usdcToken);
    }

    // Modifiers
    modifier validEscrow(uint256 _escrowId) {
        require(_escrowId > 0 && _escrowId < nextEscrowId, "Invalid escrow ID");
        require(escrows[_escrowId].isActive, "Escrow not active");
        _;
    }

    modifier onlyParties(uint256 _escrowId) {
        require(
            msg.sender == escrows[_escrowId].buyer || 
            msg.sender == escrows[_escrowId].seller,
            "Not authorized"
        );
        _;
    }

    modifier onlyBuyer(uint256 _escrowId) {
        require(msg.sender == escrows[_escrowId].buyer, "Only buyer");
        _;
    }

    modifier onlySeller(uint256 _escrowId) {
        require(msg.sender == escrows[_escrowId].seller, "Only seller");
        _;
    }

    modifier notInEmergency() {
        require(!emergencyMode, "Emergency mode active");
        _;
    }

    // Core escrow functions

    /**
     * @dev Create escrow with ETH payment
     */
    function createEscrowETH(
        uint256 _productId
    ) external payable nonReentrant whenNotPaused notInEmergency returns (uint256) {
        require(msg.value > 0, "ETH amount required");
        
        (, , uint256 price, , address seller, bool isActive) = productRegistry.getProductForAI(_productId);
        require(isActive, "Product not active");
        require(seller != address(0), "Invalid product");
        require(seller != msg.sender, "Cannot buy own product");
        
        uint256 platformFee = (msg.value * platformFeePercentage) / 10000;
        uint256 escrowAmount = msg.value - platformFee;
        require(escrowAmount >= price, "Insufficient payment");
        
        // Transfer platform fee
        if (platformFee > 0) {
            payable(feeRecipient).transfer(platformFee);
        }
        
        uint256 escrowId = _createEscrow(
            msg.sender,
            seller,
            _productId,
            escrowAmount,
            address(0), // ETH
            0 // No source chain for direct payments
        );
        
        // Update product registry
        productRegistry.purchaseProduct(_productId, msg.sender);
        
        return escrowId;
    }

    /**
     * @dev Create escrow with USDC payment
     */
    function createEscrowUSDC(
        uint256 _productId,
        uint256 _amount
    ) external nonReentrant whenNotPaused notInEmergency returns (uint256) {
        require(_amount > 0, "USDC amount required");
        
        (, , uint256 price, , address seller, bool isActive) = productRegistry.getProductForAI(_productId);
        require(isActive, "Product not active");
        require(seller != address(0), "Invalid product");
        require(seller != msg.sender, "Cannot buy own product");
        
        uint256 platformFee = (_amount * platformFeePercentage) / 10000;
        uint256 escrowAmount = _amount - platformFee;
        require(escrowAmount >= price, "Insufficient payment");
        
        // Transfer USDC from buyer
        usdcToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Transfer platform fee
        if (platformFee > 0) {
            usdcToken.safeTransfer(feeRecipient, platformFee);
        }
        
        uint256 escrowId = _createEscrow(
            msg.sender,
            seller,
            _productId,
            escrowAmount,
            address(usdcToken),
            0 // No source chain for direct payments
        );
        
        // Update product registry
        productRegistry.purchaseProduct(_productId, msg.sender);
        
        return escrowId;
    }

    /**
     * @dev Confirm delivery (buyer only)
     */
    function confirmDelivery(uint256 _escrowId) 
        external 
        validEscrow(_escrowId) 
        onlyBuyer(_escrowId) 
        nonReentrant 
    {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Created, "Invalid status");
        
        escrow.status = EscrowStatus.Delivered;
        
        // Release funds to seller
        _releaseFunds(_escrowId, escrow.seller);
        
        emit EscrowDelivered(_escrowId, escrow.buyer, escrow.seller);
    }

    /**
     * @dev Create dispute
     */
    function createDispute(
        uint256 _escrowId,
        string memory _reason
    ) external validEscrow(_escrowId) onlyParties(_escrowId) returns (uint256) {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Created, "Invalid status for dispute");
        
        uint256 disputeId = nextDisputeId++;
        escrow.status = EscrowStatus.Disputed;
        escrow.disputeId = disputeId;
        
        Dispute storage dispute = disputes[disputeId];
        dispute.id = disputeId;
        dispute.escrowId = _escrowId;
        dispute.initiator = msg.sender;
        dispute.reason = _reason;
        dispute.outcome = DisputeOutcome.Pending;
        dispute.createdAt = block.timestamp;
        dispute.isResolved = false;
        
        // Request random arbitrators selection
        _requestRandomArbitrators(disputeId);
        
        // Request AI analysis
        _requestAIDisputeAnalysis(disputeId);
        
        emit DisputeCreated(disputeId, _escrowId, msg.sender, _reason);
        
        return disputeId;
    }

    /**
     * @dev Vote on dispute (arbitrators only)
     */
    function voteOnDispute(
        uint256 _disputeId,
        DisputeOutcome _outcome
    ) external {
        Dispute storage dispute = disputes[_disputeId];
        require(!dispute.isResolved, "Dispute already resolved");
        require(_isArbitratorForDispute(_disputeId, msg.sender), "Not an arbitrator");
        require(!dispute.hasVoted[msg.sender], "Already voted");
        require(_outcome != DisputeOutcome.Pending, "Invalid outcome");
        
        dispute.hasVoted[msg.sender] = true;
        dispute.votes[msg.sender] = _outcome;
        dispute.votesCount++;
        
        // Check if majority reached
        if (dispute.votesCount >= (dispute.arbitrators.length + 1) / 2) {
            _resolveDispute(_disputeId);
        }
    }

    // Chainlink VRF integration for random arbitrator selection

    /**
     * @dev Request random arbitrators for dispute
     */
    function _requestRandomArbitrators(uint256 _disputeId) internal {
        require(availableArbitrators.length >= 3, "Insufficient arbitrators");
        
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            1
        );
        
        vrfRequestToDisputeId[requestId] = _disputeId;
    }

    /**
     * @dev Callback for VRF random words
     */
    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        uint256 disputeId = vrfRequestToDisputeId[_requestId];
        require(disputeId != 0, "Invalid VRF request");
        
        Dispute storage dispute = disputes[disputeId];
        
        // Select random arbitrators
        uint256 numArbitrators = availableArbitrators.length >= MAX_ARBITRATORS ? 
            MAX_ARBITRATORS : availableArbitrators.length;
        
        // Use Fisher-Yates shuffle algorithm
        address[] memory selectedArbitrators = new address[](numArbitrators);
        uint256[] memory indices = new uint256[](availableArbitrators.length);
        
        for (uint256 i = 0; i < availableArbitrators.length; i++) {
            indices[i] = i;
        }
        
        uint256 randomValue = _randomWords[0];
        for (uint256 i = 0; i < numArbitrators; i++) {
            uint256 remainingIndices = availableArbitrators.length - i;
            uint256 randomIndex = (uint256(keccak256(abi.encode(randomValue, i))) % remainingIndices);
            
            selectedArbitrators[i] = availableArbitrators[indices[randomIndex]];
            
            // Swap with last element
            indices[randomIndex] = indices[remainingIndices - 1];
        }
        
        dispute.arbitrators = selectedArbitrators;
        
        emit ArbitratorsSelected(disputeId, selectedArbitrators, _requestId);
    }

    // Chainlink Functions integration for AI dispute analysis

    /**
     * @dev Initialize Chainlink Functions configuration
     */
    function initializeFunctions(
        string memory _sourceCode,
        uint64 _subscriptionId,
        uint32 _gasLimit,
        bytes32 _donID
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        aiDisputeSourceCode = _sourceCode;
        functionsSubscriptionId = _subscriptionId;
        functionsGasLimit = _gasLimit;
        functionsDonID = _donID;
    }

    /**
     * @dev Request AI analysis for dispute
     */
    function _requestAIDisputeAnalysis(uint256 _disputeId) internal {
        if (bytes(aiDisputeSourceCode).length == 0) return;
        
        Dispute storage dispute = disputes[_disputeId];
        Escrow memory escrow = escrows[dispute.escrowId];
        
        // Build request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(aiDisputeSourceCode);
        
        // Set arguments
        string[] memory args = new string[](4);
        args[0] = _uint256ToString(dispute.escrowId);
        args[1] = _uint256ToString(escrow.productId);
        args[2] = dispute.reason;
        args[3] = _addressToString(dispute.initiator);
        req.setArgs(args);
        
        // Send request
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            functionsSubscriptionId,
            functionsGasLimit,
            functionsDonID
        );
        
        functionsRequestToDisputeId[requestId] = _disputeId;
        s_lastRequestId = requestId;
        
        emit AIDisputeAnalysisRequested(_disputeId, requestId);
    }

    /**
     * @dev Callback for Chainlink Functions
     */
    function fulfillRequest(
        bytes32 _requestId,
        bytes memory _response,
        bytes memory _err
    ) internal override {
        if (_err.length > 0) {
            s_lastError = _err;
            return;
        }
        
        s_lastResponse = _response;
        uint256 disputeId = functionsRequestToDisputeId[_requestId];
        
        if (disputeId != 0) {
            disputes[disputeId].aiAnalysis = _response;
            emit AIDisputeAnalysisReceived(disputeId, _requestId, _response);
        }
    }

    // Chainlink Automation integration for auto-release

    /**
     * @dev Check if upkeep is needed
     */
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        if (block.timestamp < lastUpkeepTimestamp + upkeepInterval) {
            return (false, "");
        }
        
        // Check for escrows ready for auto-release
        uint256[] memory readyEscrows = new uint256[](50); // Limit batch size
        uint256 count = 0;
        
        for (uint256 i = 1; i < nextEscrowId && count < 50; i++) {
            Escrow memory escrow = escrows[i];
            if (
                escrow.isActive &&
                escrow.status == EscrowStatus.Created &&
                block.timestamp >= escrow.createdAt + AUTO_RELEASE_DELAY
            ) {
                readyEscrows[count] = i;
                count++;
            }
        }
        
        if (count > 0) {
            // Resize array
            uint256[] memory result = new uint256[](count);
            for (uint256 i = 0; i < count; i++) {
                result[i] = readyEscrows[i];
            }
            return (true, abi.encode(result));
        }
        
        return (false, "");
    }

    /**
     * @dev Perform upkeep (auto-release funds)
     */
    function performUpkeep(bytes calldata _performData) external override {
        uint256[] memory escrowIds = abi.decode(_performData, (uint256[]));
        
        for (uint256 i = 0; i < escrowIds.length; i++) {
            uint256 escrowId = escrowIds[i];
            Escrow storage escrow = escrows[escrowId];
            
            if (
                escrow.isActive &&
                escrow.status == EscrowStatus.Created &&
                block.timestamp >= escrow.createdAt + AUTO_RELEASE_DELAY
            ) {
                escrow.status = EscrowStatus.Delivered;
                _releaseFunds(escrowId, escrow.seller);
                
                emit AutoReleaseExecuted(escrowId, block.timestamp);
            }
        }
        
        lastUpkeepTimestamp = block.timestamp;
    }

    // CCIP integration for cross-chain payments

    /**
     * @dev Handle cross-chain messages
     */
    function _ccipReceive(Client.Any2EVMMessage memory _message) internal override {
        uint256 escrowId = abi.decode(_message.data, (uint256));
        uint256 amount = _message.destTokenAmounts[0].amount;
        
        require(escrowId > 0 && escrowId < nextEscrowId, "Invalid escrow ID");
        
        Escrow storage escrow = escrows[escrowId];
        escrow.sourceChainSelector = _message.sourceChainSelector;
        
        emit CCIPPaymentReceived(
            escrowId,
            _message.sourceChainSelector,
            abi.decode(_message.sender, (address)),
            amount
        );
    }

    // Internal helper functions

    function _createEscrow(
        address _buyer,
        address _seller,
        uint256 _productId,
        uint256 _amount,
        address _token,
        uint64 _sourceChainSelector
    ) internal returns (uint256) {
        uint256 escrowId = nextEscrowId++;
        
        escrows[escrowId] = Escrow({
            id: escrowId,
            buyer: _buyer,
            seller: _seller,
            productId: _productId,
            amount: _amount,
            token: _token,
            status: EscrowStatus.Created,
            createdAt: block.timestamp,
            disputeId: 0,
            sourceChainSelector: _sourceChainSelector,
            isActive: true
        });
        
        userEscrows[_buyer].push(escrowId);
        sellerEscrows[_seller].push(escrowId);
        
        emit EscrowCreated(escrowId, _buyer, _seller, _productId, _amount, _token);
        
        return escrowId;
    }

    function _releaseFunds(uint256 _escrowId, address _recipient) internal {
        Escrow storage escrow = escrows[_escrowId];
        
        if (escrow.token == address(0)) {
            // ETH transfer
            payable(_recipient).transfer(escrow.amount);
        } else {
            // ERC20 transfer
            IERC20(escrow.token).safeTransfer(_recipient, escrow.amount);
        }
        
        escrow.isActive = false;
        
        emit FundsReleased(_escrowId, _recipient, escrow.amount, escrow.token);
    }

    function _resolveDispute(uint256 _disputeId) internal {
        Dispute storage dispute = disputes[_disputeId];
        Escrow storage escrow = escrows[dispute.escrowId];
        
        // Count votes
        uint256 buyerVotes = 0;
        uint256 sellerVotes = 0;
        uint256 splitVotes = 0;
        
        for (uint256 i = 0; i < dispute.arbitrators.length; i++) {
            address arbitrator = dispute.arbitrators[i];
            if (dispute.hasVoted[arbitrator]) {
                if (dispute.votes[arbitrator] == DisputeOutcome.FavorBuyer) {
                    buyerVotes++;
                } else if (dispute.votes[arbitrator] == DisputeOutcome.FavorSeller) {
                    sellerVotes++;
                } else if (dispute.votes[arbitrator] == DisputeOutcome.Split) {
                    splitVotes++;
                }
            }
        }
        
        // Determine outcome
        DisputeOutcome outcome;
        if (buyerVotes > sellerVotes && buyerVotes > splitVotes) {
            outcome = DisputeOutcome.FavorBuyer;
        } else if (sellerVotes > buyerVotes && sellerVotes > splitVotes) {
            outcome = DisputeOutcome.FavorSeller;
        } else {
            outcome = DisputeOutcome.Split;
        }
        
        dispute.outcome = outcome;
        dispute.isResolved = true;
        dispute.resolvedAt = block.timestamp;
        escrow.status = EscrowStatus.Resolved;
        
        // Execute outcome
        if (outcome == DisputeOutcome.FavorBuyer) {
            _releaseFunds(dispute.escrowId, escrow.buyer);
        } else if (outcome == DisputeOutcome.FavorSeller) {
            _releaseFunds(dispute.escrowId, escrow.seller);
        } else {
            // Split funds
            uint256 halfAmount = escrow.amount / 2;
            
            if (escrow.token == address(0)) {
                payable(escrow.buyer).transfer(halfAmount);
                payable(escrow.seller).transfer(escrow.amount - halfAmount);
            } else {
                IERC20(escrow.token).safeTransfer(escrow.buyer, halfAmount);
                IERC20(escrow.token).safeTransfer(escrow.seller, escrow.amount - halfAmount);
            }
            
            escrow.isActive = false;
            emit FundsReleased(dispute.escrowId, escrow.buyer, halfAmount, escrow.token);
            emit FundsReleased(dispute.escrowId, escrow.seller, escrow.amount - halfAmount, escrow.token);
        }
        
        emit DisputeResolved(_disputeId, dispute.escrowId, outcome, address(this));
    }

    function _isArbitratorForDispute(uint256 _disputeId, address _arbitrator) internal view returns (bool) {
        Dispute storage dispute = disputes[_disputeId];
        for (uint256 i = 0; i < dispute.arbitrators.length; i++) {
            if (dispute.arbitrators[i] == _arbitrator) {
                return true;
            }
        }
        return false;
    }

    // Admin functions

    /**
     * @dev Add arbitrator
     */
    function addArbitrator(address _arbitrator) external onlyRole(MODERATOR_ROLE) {
        require(!isArbitrator[_arbitrator], "Already an arbitrator");
        isArbitrator[_arbitrator] = true;
        availableArbitrators.push(_arbitrator);
    }

    /**
     * @dev Remove arbitrator
     */
    function removeArbitrator(address _arbitrator) external onlyRole(MODERATOR_ROLE) {
        require(isArbitrator[_arbitrator], "Not an arbitrator");
        isArbitrator[_arbitrator] = false;
        
        // Remove from array
        for (uint256 i = 0; i < availableArbitrators.length; i++) {
            if (availableArbitrators[i] == _arbitrator) {
                availableArbitrators[i] = availableArbitrators[availableArbitrators.length - 1];
                availableArbitrators.pop();
                break;
            }
        }
    }

    /**
     * @dev Set platform fee
     */
    function setPlatformFee(uint256 _feePercentage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feePercentage <= MAX_FEE_PERCENTAGE, "Fee too high");
        platformFeePercentage = _feePercentage;
    }

    /**
     * @dev Set fee recipient
     */
    function setFeeRecipient(address _feeRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Emergency pause
     */
    function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    /**
     * @dev Emergency unpause
     */
    function emergencyUnpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }

    /**
     * @dev Toggle emergency mode
     */
    function toggleEmergencyMode() external onlyRole(EMERGENCY_ROLE) {
        emergencyMode = !emergencyMode;
    }

    /**
     * @dev Emergency withdrawal of stuck funds
     */
    function emergencyWithdraw(
        uint256 _escrowId,
        address _recipient
    ) external onlyRole(EMERGENCY_ROLE) {
        require(emergencyMode, "Emergency mode not active");
        require(!emergencyWithdrawn[_escrowId], "Already withdrawn");
        
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.isActive, "Escrow not active");
        
        emergencyWithdrawn[_escrowId] = true;
        escrow.isActive = false;
        
        if (escrow.token == address(0)) {
            payable(_recipient).transfer(escrow.amount);
        } else {
            IERC20(escrow.token).safeTransfer(_recipient, escrow.amount);
        }
        
        emit EmergencyWithdrawal(_escrowId, msg.sender, _recipient, escrow.amount, escrow.token);
    }

    // View functions

    /**
     * @dev Get escrow details
     */
    function getEscrow(uint256 _escrowId) external view returns (Escrow memory) {
        return escrows[_escrowId];
    }

    /**
     * @dev Get dispute details
     */
    function getDispute(uint256 _disputeId) external view returns (
        uint256 id,
        uint256 escrowId,
        address initiator,
        string memory reason,
        DisputeOutcome outcome,
        address[] memory arbitrators,
        uint256 votesCount,
        uint256 createdAt,
        uint256 resolvedAt,
        bytes memory aiAnalysis,
        bool isResolved
    ) {
        Dispute storage dispute = disputes[_disputeId];
        return (
            dispute.id,
            dispute.escrowId,
            dispute.initiator,
            dispute.reason,
            dispute.outcome,
            dispute.arbitrators,
            dispute.votesCount,
            dispute.createdAt,
            dispute.resolvedAt,
            dispute.aiAnalysis,
            dispute.isResolved
        );
    }

    /**
     * @dev Get user's escrows
     */
    function getUserEscrows(address _user) external view returns (uint256[] memory) {
        return userEscrows[_user];
    }

    /**
     * @dev Get seller's escrows
     */
    function getSellerEscrows(address _seller) external view returns (uint256[] memory) {
        return sellerEscrows[_seller];
    }

    /**
     * @dev Get available arbitrators
     */
    function getAvailableArbitrators() external view returns (address[] memory) {
        return availableArbitrators;
    }

    // Utility functions
    function _uint256ToString(uint256 _value) internal pure returns (string memory) {
        if (_value == 0) return "0";
        
        uint256 temp = _value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(_value % 10)));
            _value /= 10;
        }
        
        return string(buffer);
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

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl, CCIPReceiver)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Allow contract to receive ETH
    receive() external payable {}
}