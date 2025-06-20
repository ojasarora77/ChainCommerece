//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "hardhat/console.sol";

/**
 * @title ProductRegistry
 * @dev Core contract for listing products in the AI-powered marketplace
 * @author AI Marketplace Team
 */
contract ProductRegistry {
    // Events
    event ProductListed(
        uint256 indexed productId,
        address indexed seller,
        string name,
        uint256 price,
        string category
    );
    
    event ProductUpdated(
        uint256 indexed productId,
        uint256 newPrice,
        bool isActive
    );
    
    event ProductPurchased(
        uint256 indexed productId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );

    // Structs
    struct Product {
        uint256 id;
        string name;
        string description;
        string category;
        uint256 price; // in wei
        address seller;
        string imageHash; // IPFS hash
        string metadataHash; // IPFS hash for additional data
        bool isActive;
        uint256 createdAt;
        uint256 totalSales;
        uint256 totalReviews;
        uint256 averageRating; // scaled by 100 (e.g., 450 = 4.5 stars)
    }

    struct SellerProfile {
        string name;
        string description;
        uint256 totalProducts;
        uint256 totalSales;
        uint256 reputation; // scaled by 100
        bool isVerified;
        uint256 joinedAt;
    }

    // State variables
    uint256 public nextProductId = 1;
    uint256 public totalProducts;
    uint256 public totalSellers;
    
    mapping(uint256 => Product) public products;
    mapping(address => SellerProfile) public sellers;
    mapping(address => uint256[]) public sellerProducts;
    mapping(string => uint256[]) public categoryProducts;
    
    // Product categories for AI recommendations
    string[] public categories;
    mapping(string => bool) public validCategories;

    // Access control
    address public owner;
    address public marketplace; // Authorized marketplace contract
    mapping(address => bool) public moderators;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyModerator() {
        require(moderators[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyMarketplace() {
        require(msg.sender == marketplace || msg.sender == owner, "Not authorized marketplace");
        _;
    }

    modifier onlySeller(uint256 _productId) {
        require(products[_productId].seller == msg.sender, "Not the seller");
        _;
    }

    modifier validProduct(uint256 _productId) {
        require(_productId > 0 && _productId < nextProductId, "Invalid product ID");
        require(products[_productId].isActive, "Product not active");
        _;
    }

    constructor() {
        owner = msg.sender;
        
        // Initialize default categories for AI recommendations
        _addCategory("Electronics");
        _addCategory("Clothing");
        _addCategory("Books");
        _addCategory("Home & Garden");
        _addCategory("Sports");
        _addCategory("Beauty");
        _addCategory("Automotive");
        _addCategory("Digital");
        
        console.log("ProductRegistry deployed by:", msg.sender);
    }

    /**
     * @dev Register as a seller
     */
    function registerSeller(
        string memory _name,
        string memory _description
    ) external {
        require(bytes(_name).length > 0, "Name required");
        
        if (sellers[msg.sender].joinedAt == 0) {
            totalSellers++;
        }
        
        sellers[msg.sender] = SellerProfile({
            name: _name,
            description: _description,
            totalProducts: sellers[msg.sender].totalProducts,
            totalSales: sellers[msg.sender].totalSales,
            reputation: sellers[msg.sender].reputation,
            isVerified: sellers[msg.sender].isVerified,
            joinedAt: sellers[msg.sender].joinedAt == 0 ? block.timestamp : sellers[msg.sender].joinedAt
        });
    }

    /**
     * @dev List a new product
     */
    function listProduct(
        string memory _name,
        string memory _description,
        string memory _category,
        uint256 _price,
        string memory _imageHash,
        string memory _metadataHash
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Product name required");
        require(_price > 0, "Price must be greater than 0");
        require(validCategories[_category], "Invalid category");
        require(sellers[msg.sender].joinedAt > 0, "Must register as seller first");

        uint256 productId = nextProductId++;
        
        products[productId] = Product({
            id: productId,
            name: _name,
            description: _description,
            category: _category,
            price: _price,
            seller: msg.sender,
            imageHash: _imageHash,
            metadataHash: _metadataHash,
            isActive: true,
            createdAt: block.timestamp,
            totalSales: 0,
            totalReviews: 0,
            averageRating: 0
        });

        // Update mappings
        sellerProducts[msg.sender].push(productId);
        categoryProducts[_category].push(productId);
        sellers[msg.sender].totalProducts++;
        totalProducts++;

        emit ProductListed(productId, msg.sender, _name, _price, _category);
        
        console.log("Product listed:", productId, "by:", msg.sender);
        return productId;
    }

    /**
     * @dev Update product price and status
     */
    function updateProduct(
        uint256 _productId,
        uint256 _newPrice,
        bool _isActive
    ) external onlySeller(_productId) {
        require(_newPrice > 0, "Price must be greater than 0");
        
        products[_productId].price = _newPrice;
        products[_productId].isActive = _isActive;
        
        emit ProductUpdated(_productId, _newPrice, _isActive);
    }

    /**
     * @dev Purchase a product (called by marketplace contract)
     */
    function purchaseProduct(
        uint256 _productId,
        address _buyer
    ) external onlyMarketplace validProduct(_productId) {
        Product storage product = products[_productId];
        
        // Increment sales counters
        product.totalSales++;
        sellers[product.seller].totalSales++;
        
        emit ProductPurchased(_productId, _buyer, product.seller, product.price);
        
        console.log("Product purchased:", _productId, "by:", _buyer);
    }

    /**
     * @dev Set marketplace contract address (owner only)
     */
    function setMarketplace(address _marketplace) external onlyOwner {
        marketplace = _marketplace;
    }

    /**
     * @dev Add a new category (owner only)
     */
    function addCategory(string memory _category) external onlyOwner {
        _addCategory(_category);
    }

    function _addCategory(string memory _category) internal {
        require(!validCategories[_category], "Category already exists");
        validCategories[_category] = true;
        categories.push(_category);
    }

    /**
     * @dev Update product rating (called by reputation system)
     */
    function updateProductRating(
        uint256 _productId,
        uint256 _newRating,
        uint256 _reviewCount
    ) external onlyModerator validProduct(_productId) {
        products[_productId].averageRating = _newRating;
        products[_productId].totalReviews = _reviewCount;
    }

    /**
     * @dev Verify a seller (moderator only)
     */
    function verifySeller(address _seller, bool _verified) external onlyModerator {
        sellers[_seller].isVerified = _verified;
    }

    /**
     * @dev Add/remove moderator (owner only)
     */
    function setModerator(address _moderator, bool _status) external onlyOwner {
        moderators[_moderator] = _status;
    }

    // View functions for AI and frontend

    /**
     * @dev Get all products by category (for AI recommendations)
     */
    function getProductsByCategory(string memory _category) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return categoryProducts[_category];
    }

    /**
     * @dev Get seller's products
     */
    function getSellerProducts(address _seller) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return sellerProducts[_seller];
    }

    /**
     * @dev Get all categories
     */
    function getCategories() external view returns (string[] memory) {
        return categories;
    }

    /**
     * @dev Get product details for AI processing
     */
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
        ) 
    {
        Product memory product = products[_productId];
        return (
            product.name,
            product.category,
            product.price,
            product.averageRating,
            product.seller,
            product.isActive
        );
    }

    /**
     * @dev Get seller reputation for AI processing
     */
    function getSellerReputation(address _seller) 
        external 
        view 
        returns (uint256 reputation, bool isVerified, uint256 totalSales) 
    {
        SellerProfile memory seller = sellers[_seller];
        return (seller.reputation, seller.isVerified, seller.totalSales);
    }

    /**
     * @dev Batch get products (for efficient AI processing)
     */
    function getBatchProducts(uint256[] calldata _productIds)
        external
        view
        returns (Product[] memory)
    {
        Product[] memory batchProducts = new Product[](_productIds.length);
        for (uint256 i = 0; i < _productIds.length; i++) {
            batchProducts[i] = products[_productIds[i]];
        }
        return batchProducts;
    }

    /**
     * @dev Get marketplace stats for analytics
     */
    function getMarketplaceStats() 
        external 
        view 
        returns (
            uint256 _totalProducts,
            uint256 _totalSellers,
            uint256 _activeProducts
        ) 
    {
        uint256 activeCount = 0;
        for (uint256 i = 1; i < nextProductId; i++) {
            if (products[i].isActive) {
                activeCount++;
            }
        }
        
        return (totalProducts, totalSellers, activeCount);
    }
}