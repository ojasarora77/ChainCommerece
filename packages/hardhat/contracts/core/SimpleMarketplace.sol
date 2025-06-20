// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ProductRegistry.sol";

/**
 * @title SimpleMarketplace
 * @dev Handles payments and purchases for the AI marketplace
 */
contract SimpleMarketplace {
    ProductRegistry public productRegistry;
    
    // Events
    event PaymentReceived(
        uint256 indexed productId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );
    
    event RefundIssued(
        uint256 indexed productId,
        address indexed buyer,
        uint256 amount
    );

    // Fees
    uint256 public platformFeePercent = 250; // 2.5% (250 basis points)
    address public feeRecipient;
    uint256 public totalFeesCollected;

    // Purchase tracking
    mapping(address => uint256[]) public userPurchases;
    mapping(uint256 => address[]) public productBuyers;
    
    constructor(address _productRegistry, address _feeRecipient) {
        productRegistry = ProductRegistry(_productRegistry);
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Purchase a product with ETH/AVAX
     */
    function purchaseProduct(uint256 _productId) external payable {
        // Get product details
        (
            uint256 id,
            string memory name,
            string memory description,
            string memory category,
            uint256 price,
            address seller,
            string memory imageHash,
            string memory metadataHash,
            bool isActive,
            uint256 createdAt,
            uint256 totalSales,
            uint256 totalReviews,
            uint256 averageRating
        ) = productRegistry.products(_productId);

        require(isActive, "Product not active");
        require(msg.value >= price, "Insufficient payment");
        require(seller != msg.sender, "Cannot buy your own product");

        // Calculate fees
        uint256 platformFee = (price * platformFeePercent) / 10000;
        uint256 sellerAmount = price - platformFee;

        // Handle overpayment
        uint256 refund = msg.value - price;
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }

        // Transfer payment to seller
        payable(seller).transfer(sellerAmount);
        
        // Keep platform fee
        totalFeesCollected += platformFee;

        // Update product registry
        productRegistry.purchaseProduct(_productId, msg.sender);

        // Track purchase
        userPurchases[msg.sender].push(_productId);
        productBuyers[_productId].push(msg.sender);

        emit PaymentReceived(_productId, msg.sender, seller, price);
    }

    /**
     * @dev Get user's purchase history
     */
    function getUserPurchases(address _user) external view returns (uint256[] memory) {
        return userPurchases[_user];
    }

    /**
     * @dev Get product buyers
     */
    function getProductBuyers(uint256 _productId) external view returns (address[] memory) {
        return productBuyers[_productId];
    }

    /**
     * @dev Check if user has purchased a product
     */
    function hasPurchased(address _user, uint256 _productId) external view returns (bool) {
        uint256[] memory purchases = userPurchases[_user];
        for (uint256 i = 0; i < purchases.length; i++) {
            if (purchases[i] == _productId) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawFees() external {
        require(msg.sender == feeRecipient, "Not authorized");
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        payable(feeRecipient).transfer(amount);
    }

    /**
     * @dev Update platform fee (owner only)
     */
    function updatePlatformFee(uint256 _feePercent) external {
        require(msg.sender == feeRecipient, "Not authorized");
        require(_feePercent <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = _feePercent;
    }

    /**
     * @dev Emergency withdrawal (owner only)
     */
    function emergencyWithdraw() external {
        require(msg.sender == feeRecipient, "Not authorized");
        payable(feeRecipient).transfer(address(this).balance);
    }

    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
