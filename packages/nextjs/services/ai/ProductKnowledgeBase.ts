// Enhanced Product Knowledge Base for AI Agent
// Contains detailed information about all marketplace products for accurate AI responses

export interface ProductKnowledge {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string; // in AVAX
  priceUSD: number;
  sustainabilityScore: number;
  averageRating: number;
  features: string[];
  benefits: string[];
  specifications: Record<string, string>;
  useCases: string[];
  targetAudience: string[];
  keywords: string[];
  alternatives: number[]; // IDs of similar products
  certifications: string[];
  carbonFootprint: number;
  materials: string[];
  brandStory?: string;
  warranty?: string;
  shipping?: string;
  aiRecommendationTags: string[];
}

export class ProductKnowledgeBase {
  private static instance: ProductKnowledgeBase;
  private products: Map<number, ProductKnowledge> = new Map();
  private categoryIndex: Map<string, number[]> = new Map();
  private keywordIndex: Map<string, number[]> = new Map();
  private priceRanges: Map<string, number[]> = new Map();

  private constructor() {
    this.initializeProductKnowledge();
    this.buildIndexes();
  }

  public static getInstance(): ProductKnowledgeBase {
    if (!ProductKnowledgeBase.instance) {
      ProductKnowledgeBase.instance = new ProductKnowledgeBase();
    }
    return ProductKnowledgeBase.instance;
  }

  private initializeProductKnowledge(): void {
    // Initialize with real smart contract products (21 products total)
    // This data matches the actual deployed products from addProductsFuji.ts and addNewProducts.ts
    const products: ProductKnowledge[] = [
      {
        id: 1,
        name: "AI-Powered Smart Watch",
        description: "Advanced smartwatch with AI health monitoring and blockchain integration",
        category: "Electronics",
        price: "0.15",
        priceUSD: 6.0, // 0.15 * 40 USD/AVAX
        sustainabilityScore: 88,
        averageRating: 4.7,
        features: [
          "AI health monitoring", "Heart rate tracking", "Sleep analysis", 
          "Blockchain integration", "Fitness tracking", "Smart notifications",
          "Water resistant", "Long battery life", "GPS tracking"
        ],
        benefits: [
          "Personalized health insights", "Secure data storage on blockchain",
          "Comprehensive fitness tracking", "Smart lifestyle management"
        ],
        specifications: {
          "Display": "1.4 inch AMOLED",
          "Battery": "7 days typical use",
          "Water Resistance": "5ATM",
          "Connectivity": "Bluetooth 5.0, WiFi",
          "Sensors": "Heart rate, SpO2, Accelerometer, Gyroscope",
          "Compatibility": "iOS, Android"
        },
        useCases: [
          "Health monitoring", "Fitness tracking", "Smart notifications",
          "Sleep tracking", "Workout analysis", "Daily activity tracking"
        ],
        targetAudience: [
          "Health enthusiasts", "Fitness lovers", "Tech-savvy users",
          "Blockchain enthusiasts", "Professionals"
        ],
        keywords: [
          "smartwatch", "AI", "health", "fitness", "blockchain", "wearable",
          "heart rate", "sleep", "notifications", "GPS", "waterproof"
        ],
        alternatives: [5], // Smart Fitness Tracker
        certifications: ["Blockchain Verified", "AI Powered", "Health Certified"],
        carbonFootprint: 2.1,
        materials: ["Recycled aluminum", "Sustainable silicone", "Gorilla glass"],
        brandStory: "Combining cutting-edge AI with blockchain security for the ultimate health companion",
        warranty: "2 years international warranty",
        shipping: "Free shipping worldwide, 3-5 business days",
        aiRecommendationTags: ["premium", "health-focused", "tech-advanced", "blockchain"]
      },
      {
        id: 2,
        name: "Sustainable Bamboo Laptop Stand",
        description: "Eco-friendly laptop stand made from sustainable bamboo with ergonomic design",
        category: "Electronics",
        price: "0.04",
        priceUSD: 1.6,
        sustainabilityScore: 95,
        averageRating: 4.5,
        features: [
          "100% sustainable bamboo", "Ergonomic design", "Adjustable height",
          "Ventilation slots", "Anti-slip pads", "Portable design",
          "Tool-free assembly", "Universal compatibility"
        ],
        benefits: [
          "Improved posture", "Better laptop cooling", "Eco-friendly choice",
          "Workspace organization", "Reduced neck strain"
        ],
        specifications: {
          "Material": "FSC Certified Bamboo",
          "Dimensions": "25cm x 20cm x 15cm",
          "Weight": "800g",
          "Compatibility": "11-17 inch laptops",
          "Load Capacity": "5kg",
          "Adjustability": "6 height levels"
        },
        useCases: [
          "Home office setup", "Remote work", "Study sessions",
          "Laptop cooling", "Ergonomic workspace", "Travel work"
        ],
        targetAudience: [
          "Remote workers", "Students", "Eco-conscious users",
          "Office workers", "Digital nomads"
        ],
        keywords: [
          "laptop stand", "bamboo", "sustainable", "ergonomic", "eco-friendly",
          "adjustable", "portable", "workspace", "cooling", "posture"
        ],
        alternatives: [],
        certifications: ["FSC Certified", "Sustainable Materials", "Blockchain Verified"],
        carbonFootprint: 0.5,
        materials: ["FSC Certified Bamboo", "Natural wood finish"],
        brandStory: "Crafted from sustainably sourced bamboo to create the perfect ergonomic workspace",
        warranty: "1 year warranty against manufacturing defects",
        shipping: "Carbon-neutral shipping, 2-4 business days",
        aiRecommendationTags: ["eco-friendly", "workspace", "ergonomic", "affordable"]
      },
      {
        id: 3,
        name: "NFT Art Collection Guide",
        description: "Complete digital guide to creating and selling NFT art collections",
        category: "Digital",
        price: "0.025",
        priceUSD: 1.0,
        sustainabilityScore: 92,
        averageRating: 4.6,
        features: [
          "Step-by-step tutorials", "Market analysis", "Platform comparisons",
          "Legal considerations", "Marketing strategies", "Technical guides",
          "Case studies", "Template resources", "Community access"
        ],
        benefits: [
          "Learn NFT creation", "Understand market dynamics", "Avoid common mistakes",
          "Maximize earnings", "Build sustainable NFT business"
        ],
        specifications: {
          "Format": "Digital PDF + Video",
          "Pages": "150+ pages",
          "Videos": "5 hours of content",
          "Updates": "Lifetime updates",
          "Language": "English",
          "Compatibility": "All devices"
        },
        useCases: [
          "NFT creation", "Digital art monetization", "Blockchain education",
          "Creative business", "Investment guidance"
        ],
        targetAudience: [
          "Digital artists", "NFT beginners", "Crypto enthusiasts",
          "Creative entrepreneurs", "Investors"
        ],
        keywords: [
          "NFT", "digital art", "blockchain", "crypto", "guide", "tutorial",
          "collection", "marketplace", "creation", "selling"
        ],
        alternatives: [],
        certifications: ["Blockchain Verified", "Digital Content"],
        carbonFootprint: 0.1,
        materials: ["Digital content"],
        brandStory: "Empowering artists to succeed in the NFT revolution with comprehensive guidance",
        warranty: "30-day money-back guarantee",
        shipping: "Instant digital download",
        aiRecommendationTags: ["educational", "digital", "blockchain", "creative"]
      },
      {
        id: 4,
        name: "Organic Hemp T-Shirt",
        description: "Comfortable organic hemp t-shirt with blockchain authenticity verification",
        category: "Clothing",
        price: "0.03",
        priceUSD: 1.2,
        sustainabilityScore: 90,
        averageRating: 4.4,
        features: [
          "100% organic hemp", "Blockchain authenticity", "Soft texture",
          "Breathable fabric", "Durable construction", "Natural antimicrobial",
          "UV protection", "Moisture-wicking", "Hypoallergenic"
        ],
        benefits: [
          "Eco-friendly fashion", "Verified authenticity", "Superior comfort",
          "Long-lasting wear", "Sustainable choice"
        ],
        specifications: {
          "Material": "100% Organic Hemp",
          "Weight": "180 GSM",
          "Sizes": "XS to XXL",
          "Colors": "Natural, Black, Navy",
          "Care": "Machine washable",
          "Origin": "Sustainably sourced"
        },
        useCases: [
          "Casual wear", "Eco-fashion", "Everyday comfort",
          "Sustainable wardrobe", "Gift giving"
        ],
        targetAudience: [
          "Eco-conscious consumers", "Fashion enthusiasts", "Sustainability advocates",
          "Comfort seekers", "Blockchain supporters"
        ],
        keywords: [
          "hemp", "organic", "t-shirt", "sustainable", "clothing", "eco-friendly",
          "blockchain", "authentic", "comfortable", "natural"
        ],
        alternatives: [],
        certifications: ["Organic Certified", "Hemp Fiber", "Blockchain Verified"],
        carbonFootprint: 1.2,
        materials: ["100% Organic Hemp"],
        brandStory: "Revolutionizing fashion with sustainable hemp and blockchain verification",
        warranty: "Quality guarantee - 6 months",
        shipping: "Eco-friendly packaging, 3-7 business days",
        aiRecommendationTags: ["sustainable", "fashion", "organic", "comfortable"]
      },
      {
        id: 5,
        name: "Smart Fitness Tracker",
        description: "Advanced fitness tracker with AI coaching and Web3 rewards",
        category: "Sports",
        price: "0.12",
        priceUSD: 4.8,
        sustainabilityScore: 82,
        averageRating: 4.4,
        features: [
          "AI coaching", "Web3 rewards", "Multi-sport tracking", "Heart rate monitoring",
          "Sleep analysis", "Stress tracking", "Workout detection", "Social challenges",
          "Long battery life", "Water resistant"
        ],
        benefits: [
          "Personalized coaching", "Earn crypto rewards", "Comprehensive health tracking",
          "Motivation through gamification", "Community engagement"
        ],
        specifications: {
          "Display": "1.1 inch color LCD",
          "Battery": "10 days typical use",
          "Water Resistance": "5ATM",
          "Sensors": "Heart rate, Accelerometer, Gyroscope",
          "Connectivity": "Bluetooth 5.0",
          "Compatibility": "iOS, Android"
        },
        useCases: [
          "Fitness tracking", "Health monitoring", "Workout coaching",
          "Earning rewards", "Social fitness challenges"
        ],
        targetAudience: [
          "Fitness enthusiasts", "Crypto users", "Health-conscious individuals",
          "Gamification lovers", "Tech adopters"
        ],
        keywords: [
          "fitness tracker", "AI coaching", "Web3", "rewards", "health",
          "sports", "workout", "heart rate", "crypto", "gamification"
        ],
        alternatives: [1], // AI-Powered Smart Watch
        certifications: ["AI Powered", "Web3 Rewards", "Blockchain Verified"],
        carbonFootprint: 1.8,
        materials: ["Recycled plastics", "Sustainable silicone"],
        brandStory: "Merging fitness with Web3 to create the most rewarding health journey",
        warranty: "18 months international warranty",
        shipping: "Express shipping available, 2-5 business days",
        aiRecommendationTags: ["fitness", "rewards", "AI-powered", "gamified"]
      },
      // Additional products from addNewProducts.ts script
      {
        id: 6,
        name: "VoltEdge Noise-Cancelling Earbuds",
        description: "Enjoy crystal-clear sound with VoltEdge earbuds featuring hybrid ANC technology, up to 24 hours battery life, touch controls, and IPX5 water resistance. Perfect for workouts, commutes, and video calls.",
        category: "Electronics",
        price: "0.025",
        priceUSD: 1.0,
        sustainabilityScore: 78,
        averageRating: 4.6,
        features: [
          "Hybrid ANC technology", "24 hours battery life", "Touch controls",
          "IPX5 water resistance", "Crystal-clear sound", "Ergonomic design",
          "Quick charge", "Voice assistant support"
        ],
        benefits: [
          "Immersive audio experience", "All-day battery", "Workout-friendly",
          "Hands-free control", "Professional call quality"
        ],
        specifications: {
          "Driver": "10mm dynamic drivers",
          "Battery": "24 hours with case",
          "Water Resistance": "IPX5",
          "Connectivity": "Bluetooth 5.2",
          "Charging": "USB-C fast charging",
          "Weight": "45g with case"
        },
        useCases: [
          "Music listening", "Workout sessions", "Video calls",
          "Commuting", "Gaming", "Podcast listening"
        ],
        targetAudience: [
          "Music lovers", "Fitness enthusiasts", "Remote workers",
          "Commuters", "Gamers"
        ],
        keywords: [
          "earbuds", "noise cancelling", "wireless", "bluetooth", "waterproof",
          "battery", "audio", "music", "workout", "calls"
        ],
        alternatives: [1], // AI-Powered Smart Watch
        certifications: ["Bluetooth Certified", "IPX5 Rated", "Blockchain Verified"],
        carbonFootprint: 1.2,
        materials: ["Recycled plastics", "Sustainable packaging"],
        brandStory: "VoltEdge Audio delivers premium sound with environmental consciousness",
        warranty: "1 year international warranty",
        shipping: "Free shipping, 3-5 business days",
        aiRecommendationTags: ["audio", "wireless", "workout", "premium"]
      },
      {
        id: 7,
        name: "AuroraGlow Smart LED Strip",
        description: "Transform your room with 16M color options, music sync, and voice control (Alexa/Google). Easily installable and perfect for gamers, streamers, or mood lighting lovers.",
        category: "Electronics",
        price: "0.032",
        priceUSD: 1.28,
        sustainabilityScore: 72,
        averageRating: 4.4,
        features: [
          "16M color options", "Music sync", "Voice control", "Easy installation",
          "App control", "Timer function", "DIY cutting", "Adhesive backing"
        ],
        benefits: [
          "Ambient lighting", "Gaming enhancement", "Mood setting",
          "Smart home integration", "Energy efficient"
        ],
        specifications: {
          "Length": "5 meters",
          "Colors": "16 million RGB",
          "Control": "WiFi + App",
          "Voice": "Alexa, Google Assistant",
          "Power": "12V LED",
          "Installation": "Adhesive backing"
        },
        useCases: [
          "Gaming setup", "Streaming background", "Mood lighting",
          "Party atmosphere", "Home decoration", "Smart home"
        ],
        targetAudience: [
          "Gamers", "Streamers", "Smart home enthusiasts",
          "Interior designers", "Tech lovers"
        ],
        keywords: [
          "LED strip", "smart lighting", "RGB", "voice control", "gaming",
          "streaming", "mood", "decoration", "wifi", "app control"
        ],
        alternatives: [],
        certifications: ["WiFi Certified", "Voice Assistant Compatible", "Blockchain Verified"],
        carbonFootprint: 0.8,
        materials: ["LED chips", "Recyclable copper", "Eco-friendly adhesive"],
        brandStory: "Aurora Lighting Co illuminates spaces with smart, sustainable technology",
        warranty: "2 years manufacturer warranty",
        shipping: "Standard shipping, 4-6 business days",
        aiRecommendationTags: ["smart-home", "gaming", "decoration", "tech"]
      },
      {
        id: 8,
        name: "EverSoft Bamboo Joggers",
        description: "Lightweight joggers made from eco-friendly bamboo fabric. Ultra-breathable, soft, and anti-odor — ideal for workouts, travel, or lounging.",
        category: "Clothing",
        price: "0.018",
        priceUSD: 0.72,
        sustainabilityScore: 94,
        averageRating: 4.5,
        features: [
          "Eco-friendly bamboo fabric", "Ultra-breathable", "Anti-odor technology",
          "Lightweight design", "Moisture-wicking", "Soft texture", "Elastic waistband"
        ],
        benefits: [
          "Sustainable fashion", "All-day comfort", "Odor resistance",
          "Temperature regulation", "Versatile wear"
        ],
        specifications: {
          "Material": "95% Bamboo, 5% Spandex",
          "Weight": "200g",
          "Sizes": "XS to XXL",
          "Care": "Machine washable",
          "Features": "Anti-microbial, UV protection",
          "Fit": "Relaxed athletic fit"
        },
        useCases: [
          "Workout sessions", "Yoga practice", "Travel comfort",
          "Lounging", "Casual wear", "Sleep wear"
        ],
        targetAudience: [
          "Eco-conscious consumers", "Fitness enthusiasts", "Travelers",
          "Comfort seekers", "Sustainable fashion lovers"
        ],
        keywords: [
          "bamboo joggers", "eco-friendly", "sustainable", "breathable",
          "anti-odor", "workout", "comfort", "organic", "clothing"
        ],
        alternatives: [4], // Organic Hemp T-Shirt
        certifications: ["Organic Bamboo", "Anti-Microbial", "Sustainable Fashion", "Blockchain Verified"],
        carbonFootprint: 0.6,
        materials: ["Organic bamboo fiber", "Natural spandex"],
        brandStory: "EcoStyle Collective creates comfortable, sustainable clothing for conscious consumers",
        warranty: "Quality guarantee - 6 months",
        shipping: "Carbon-neutral shipping, 3-5 business days",
        aiRecommendationTags: ["sustainable", "comfort", "eco-friendly", "athletic"]
      },
      {
        id: 9,
        name: "MindFuel: The Crypto Hustler's Handbook",
        description: "A must-read book for Web3 builders, traders, and degens — packed with mental models, real-life stories, and productivity hacks to help you thrive in the crypto jungle.",
        category: "Books",
        price: "0.012",
        priceUSD: 0.48,
        sustainabilityScore: 85,
        averageRating: 4.7,
        features: [
          "Mental models for crypto", "Real-life success stories", "Productivity hacks",
          "Web3 building strategies", "Trading psychology", "Digital format", "Actionable insights"
        ],
        benefits: [
          "Crypto knowledge", "Mental clarity", "Productivity boost",
          "Strategic thinking", "Success mindset"
        ],
        specifications: {
          "Format": "Digital PDF + ePub",
          "Pages": "280 pages",
          "Language": "English",
          "Updates": "Lifetime updates",
          "Bonus": "Exclusive community access",
          "Compatibility": "All devices"
        },
        useCases: [
          "Crypto education", "Trading improvement", "Web3 building",
          "Mindset development", "Productivity enhancement"
        ],
        targetAudience: [
          "Crypto traders", "Web3 builders", "Blockchain developers",
          "Crypto investors", "Digital entrepreneurs"
        ],
        keywords: [
          "crypto book", "web3", "blockchain", "trading", "productivity",
          "mental models", "handbook", "digital", "education"
        ],
        alternatives: [3], // NFT Art Collection Guide
        certifications: ["Digital Product", "Blockchain Verified", "Educational Content"],
        carbonFootprint: 0.1,
        materials: ["Digital content"],
        brandStory: "Crypto Publishing House empowers the next generation of Web3 builders",
        warranty: "Satisfaction guarantee",
        shipping: "Instant digital download",
        aiRecommendationTags: ["education", "crypto", "digital", "productivity"]
      },
      {
        id: 10,
        name: "EcoBloom Smart Planter",
        description: "Self-watering, app-connected planter with light sensors and soil monitors. Perfect for growing herbs indoors with minimal effort.",
        category: "Home & Garden",
        price: "0.045",
        priceUSD: 1.8,
        sustainabilityScore: 89,
        averageRating: 4.3,
        features: [
          "Self-watering system", "App connectivity", "Light sensors", "Soil monitoring",
          "Herb growing optimized", "Minimal maintenance", "Smart notifications", "Eco-friendly materials"
        ],
        benefits: [
          "Fresh herbs at home", "Automated care", "Smart monitoring",
          "Sustainable gardening", "Space efficient"
        ],
        specifications: {
          "Capacity": "2 liters water reservoir",
          "Sensors": "Light, moisture, temperature",
          "Connectivity": "WiFi + Bluetooth",
          "App": "iOS and Android",
          "Size": "25cm x 15cm x 20cm",
          "Material": "Recycled plastic"
        },
        useCases: [
          "Indoor herb growing", "Smart gardening", "Kitchen herbs",
          "Educational gardening", "Sustainable living"
        ],
        targetAudience: [
          "Home gardeners", "Cooking enthusiasts", "Smart home users",
          "Sustainability advocates", "Urban dwellers"
        ],
        keywords: [
          "smart planter", "indoor garden", "herbs", "self-watering",
          "app-connected", "sensors", "sustainable", "home garden"
        ],
        alternatives: [],
        certifications: ["Smart Garden Certified", "Eco-Friendly Materials", "Blockchain Verified"],
        carbonFootprint: 1.5,
        materials: ["Recycled plastic", "Sustainable electronics"],
        brandStory: "Smart Garden Solutions brings nature and technology together sustainably",
        warranty: "1 year warranty on electronics",
        shipping: "Eco-friendly packaging, 5-7 business days",
        aiRecommendationTags: ["smart-home", "gardening", "sustainable", "automation"]
      },
      {
        id: 11,
        name: "ZenFlex Resistance Band Kit",
        description: "Full-body home workout solution with 5 levels of resistance, door anchors, and ergonomic handles. Compact and travel-friendly.",
        category: "Sports",
        price: "0.022",
        priceUSD: 0.88,
        sustainabilityScore: 76,
        averageRating: 4.4,
        features: [
          "5 resistance levels", "Door anchors included", "Ergonomic handles",
          "Compact design", "Travel-friendly", "Full-body workout", "Durable materials", "Exercise guide"
        ],
        benefits: [
          "Home gym solution", "Space saving", "Portable fitness",
          "Versatile workouts", "Cost effective"
        ],
        specifications: {
          "Resistance Levels": "5 bands (10-50 lbs)",
          "Material": "Natural latex",
          "Handles": "Foam grip",
          "Accessories": "Door anchor, ankle straps",
          "Weight": "1.2 kg total",
          "Storage": "Mesh carry bag"
        },
        useCases: [
          "Home workouts", "Travel fitness", "Strength training",
          "Rehabilitation", "Yoga enhancement", "Full-body exercise"
        ],
        targetAudience: [
          "Home fitness enthusiasts", "Travelers", "Busy professionals",
          "Rehabilitation patients", "Budget-conscious fitness lovers"
        ],
        keywords: [
          "resistance bands", "home gym", "workout", "fitness", "portable",
          "strength training", "exercise", "travel", "compact"
        ],
        alternatives: [5], // Smart Fitness Tracker
        certifications: ["Fitness Equipment Certified", "Natural Latex", "Blockchain Verified"],
        carbonFootprint: 0.9,
        materials: ["Natural latex", "Recycled foam"],
        brandStory: "FitLife Essentials makes fitness accessible anywhere, anytime",
        warranty: "1 year warranty against defects",
        shipping: "Standard shipping, 3-5 business days",
        aiRecommendationTags: ["fitness", "portable", "home-gym", "affordable"]
      },
      {
        id: 12,
        name: "GlowDrip Hydrating Serum",
        description: "Infused with hyaluronic acid, vitamin C, and green tea extract. Revives dull skin, reduces fine lines, and boosts glow — suitable for all skin types.",
        category: "Beauty",
        price: "0.035",
        priceUSD: 1.4,
        sustainabilityScore: 83,
        averageRating: 4.6,
        features: [
          "Hyaluronic acid", "Vitamin C infused", "Green tea extract",
          "Anti-aging formula", "All skin types", "Glow enhancement", "Fine line reduction", "Natural ingredients"
        ],
        benefits: [
          "Skin hydration", "Anti-aging effects", "Natural glow",
          "Fine line reduction", "Skin revitalization"
        ],
        specifications: {
          "Volume": "30ml",
          "Key Ingredients": "Hyaluronic acid, Vitamin C, Green tea",
          "Skin Type": "All skin types",
          "Application": "Morning and evening",
          "Shelf Life": "24 months",
          "Packaging": "Glass bottle with dropper"
        },
        useCases: [
          "Daily skincare", "Anti-aging routine", "Skin hydration",
          "Glow enhancement", "Fine line treatment"
        ],
        targetAudience: [
          "Skincare enthusiasts", "Anti-aging focused", "Natural beauty lovers",
          "All age groups", "Health-conscious consumers"
        ],
        keywords: [
          "serum", "skincare", "hydrating", "anti-aging", "vitamin C",
          "hyaluronic acid", "glow", "beauty", "natural"
        ],
        alternatives: [],
        certifications: ["Natural Ingredients", "Dermatologist Tested", "Cruelty-Free", "Blockchain Verified"],
        carbonFootprint: 0.7,
        materials: ["Natural ingredients", "Recyclable glass packaging"],
        brandStory: "Beauty Lab Premium creates effective, natural skincare solutions",
        warranty: "Satisfaction guarantee - 30 days",
        shipping: "Protective packaging, 3-5 business days",
        aiRecommendationTags: ["beauty", "skincare", "natural", "anti-aging"]
      },
      {
        id: 13,
        name: "AutoMate Wireless Dash Cam",
        description: "1080p HD recording, motion detection, loop recording, and WiFi-enabled review. Boost your car's safety and evidence protection.",
        category: "Automotive",
        price: "0.055",
        priceUSD: 2.2,
        sustainabilityScore: 71,
        averageRating: 4.3,
        features: [
          "1080p HD recording", "Motion detection", "Loop recording", "WiFi connectivity",
          "Night vision", "G-sensor", "Parking mode", "Mobile app control"
        ],
        benefits: [
          "Enhanced safety", "Evidence protection", "Insurance claims",
          "Parking monitoring", "Peace of mind"
        ],
        specifications: {
          "Resolution": "1080p Full HD",
          "Storage": "MicroSD up to 128GB",
          "Connectivity": "WiFi + App",
          "Power": "12V car adapter",
          "Viewing Angle": "170 degrees",
          "Night Vision": "Infrared LED"
        },
        useCases: [
          "Daily driving", "Parking monitoring", "Insurance evidence",
          "Road trip recording", "Security surveillance"
        ],
        targetAudience: [
          "Car owners", "Safety-conscious drivers", "Insurance holders",
          "Fleet managers", "Security-minded individuals"
        ],
        keywords: [
          "dash cam", "car camera", "1080p", "recording", "automotive",
          "safety", "wifi", "motion detection", "security"
        ],
        alternatives: [],
        certifications: ["Automotive Grade", "WiFi Certified", "Safety Tested", "Blockchain Verified"],
        carbonFootprint: 1.3,
        materials: ["Automotive-grade plastics", "Electronic components"],
        brandStory: "AutoTech Solutions enhances vehicle safety through innovative technology",
        warranty: "2 years manufacturer warranty",
        shipping: "Secure packaging, 4-6 business days",
        aiRecommendationTags: ["automotive", "safety", "security", "tech"]
      },
      {
        id: 14,
        name: "PixelCraze NFT Creator Suite",
        description: "A digital toolkit for NFT creators with pre-built smart contract templates, AI art prompts, metadata generator, and one-click IPFS uploads.",
        category: "Digital",
        price: "0.038",
        priceUSD: 1.52,
        sustainabilityScore: 78,
        averageRating: 4.5,
        features: [
          "Smart contract templates", "AI art prompts", "Metadata generator",
          "IPFS uploads", "NFT minting tools", "Royalty management", "Collection builder", "Market integration"
        ],
        benefits: [
          "Easy NFT creation", "Professional tools", "Time saving",
          "Technical simplification", "Market ready"
        ],
        specifications: {
          "Platform": "Web-based application",
          "Blockchain": "Ethereum, Polygon, Avalanche",
          "File Support": "PNG, JPG, GIF, MP4",
          "Storage": "IPFS integration",
          "Templates": "50+ smart contract templates",
          "Updates": "Regular feature updates"
        },
        useCases: [
          "NFT creation", "Digital art", "Collection building",
          "Smart contract deployment", "Metadata management"
        ],
        targetAudience: [
          "Digital artists", "NFT creators", "Blockchain developers",
          "Crypto entrepreneurs", "Creative professionals"
        ],
        keywords: [
          "NFT", "creator tools", "smart contracts", "digital art",
          "blockchain", "IPFS", "metadata", "minting", "crypto"
        ],
        alternatives: [3, 9], // NFT Art Collection Guide, MindFuel book
        certifications: ["Blockchain Compatible", "Smart Contract Audited", "Digital Product", "Blockchain Verified"],
        carbonFootprint: 0.2,
        materials: ["Digital software"],
        brandStory: "Digital Creators Hub empowers artists in the Web3 revolution",
        warranty: "Software support - 1 year",
        shipping: "Instant digital access",
        aiRecommendationTags: ["NFT", "digital", "creator-tools", "blockchain"]
      },
      {
        id: 15,
        name: "MetaFit VR Boxing Trainer",
        description: "A gamified VR fitness app offering real-time cardio boxing workouts with a leaderboard, avatar coach, and customizable intensity.",
        category: "Digital",
        price: "0.028",
        priceUSD: 1.12,
        sustainabilityScore: 80,
        averageRating: 4.4,
        features: [
          "VR boxing workouts", "Real-time coaching", "Gamified experience",
          "Leaderboard system", "Avatar coach", "Customizable intensity", "Cardio tracking", "Progress analytics"
        ],
        benefits: [
          "Immersive fitness", "Motivation through gaming", "Personalized training",
          "Social competition", "Convenient home workouts"
        ],
        specifications: {
          "Platform": "VR headsets (Oculus, HTC Vive)",
          "Space Required": "2m x 2m minimum",
          "Tracking": "Hand and body tracking",
          "Workouts": "50+ boxing routines",
          "Multiplayer": "Online competitions",
          "Updates": "Monthly content updates"
        },
        useCases: [
          "VR fitness", "Boxing training", "Cardio workouts",
          "Gaming fitness", "Home exercise", "Competitive training"
        ],
        targetAudience: [
          "VR enthusiasts", "Fitness gamers", "Boxing fans",
          "Home fitness users", "Tech-savvy athletes"
        ],
        keywords: [
          "VR fitness", "boxing", "virtual reality", "workout", "gaming",
          "cardio", "training", "immersive", "digital"
        ],
        alternatives: [5, 11], // Smart Fitness Tracker, ZenFlex Resistance Band Kit
        certifications: ["VR Compatible", "Fitness App Certified", "Digital Product", "Blockchain Verified"],
        carbonFootprint: 0.3,
        materials: ["Digital software"],
        brandStory: "VR Fitness Studio revolutionizes exercise through immersive technology",
        warranty: "Software support - 1 year",
        shipping: "Digital download",
        aiRecommendationTags: ["VR", "fitness", "gaming", "immersive"]
      },
      // Products from deployment script (01_deploy_product_registry.ts)
      {
        id: 16,
        name: "Solar Phone Charger",
        description: "Portable solar-powered charger with fast charging capabilities. Perfect for outdoor activities and emergency use.",
        category: "Electronics",
        price: "0.05",
        priceUSD: 2.0,
        sustainabilityScore: 92,
        averageRating: 4.5,
        features: [
          "Solar powered", "Fast charging", "Portable design", "Weather resistant",
          "Multiple device compatibility", "LED indicators", "Emergency backup", "Eco-friendly"
        ],
        benefits: [
          "Renewable energy", "Emergency power", "Outdoor convenience",
          "Environmental friendly", "Cost savings"
        ],
        specifications: {
          "Capacity": "10,000mAh",
          "Solar Panel": "Monocrystalline",
          "Charging": "USB-A, USB-C",
          "Weather Rating": "IP65",
          "Weight": "350g",
          "Dimensions": "15cm x 8cm x 2cm"
        },
        useCases: [
          "Outdoor activities", "Emergency backup", "Travel charging",
          "Camping", "Hiking", "Power outages"
        ],
        targetAudience: [
          "Outdoor enthusiasts", "Travelers", "Emergency preparedness",
          "Eco-conscious users", "Tech users"
        ],
        keywords: [
          "solar charger", "portable", "renewable", "emergency", "outdoor",
          "eco-friendly", "power bank", "sustainable", "charging"
        ],
        alternatives: [],
        certifications: ["Solar Certified", "Weather Resistant", "Eco-Friendly", "Blockchain Verified"],
        carbonFootprint: 0.8,
        materials: ["Solar cells", "Recycled plastics", "Sustainable electronics"],
        brandStory: "Harnessing the power of the sun for sustainable mobile charging",
        warranty: "2 years manufacturer warranty",
        shipping: "Eco-friendly packaging, 3-5 business days",
        aiRecommendationTags: ["solar", "sustainable", "outdoor", "emergency"]
      },
      {
        id: 17,
        name: "Organic Cotton T-Shirt",
        description: "100% organic cotton t-shirt made with sustainable practices. Available in multiple colors.",
        category: "Clothing",
        price: "0.02",
        priceUSD: 0.8,
        sustainabilityScore: 96,
        averageRating: 4.6,
        features: [
          "100% organic cotton", "Sustainable production", "Multiple colors",
          "Soft texture", "Breathable fabric", "Fair trade", "Pre-shrunk", "Durable"
        ],
        benefits: [
          "Sustainable fashion", "Comfort", "Ethical production",
          "Skin-friendly", "Long-lasting"
        ],
        specifications: {
          "Material": "100% Organic Cotton",
          "Weight": "180 GSM",
          "Sizes": "XS to XXL",
          "Colors": "8 color options",
          "Care": "Machine washable",
          "Certification": "GOTS Certified"
        },
        useCases: [
          "Casual wear", "Everyday comfort", "Sustainable fashion",
          "Gift giving", "Wardrobe basics"
        ],
        targetAudience: [
          "Eco-conscious consumers", "Fashion enthusiasts", "Comfort seekers",
          "Ethical shoppers", "Organic lifestyle"
        ],
        keywords: [
          "organic cotton", "t-shirt", "sustainable", "clothing", "eco-friendly",
          "fair trade", "organic", "fashion", "comfortable"
        ],
        alternatives: [4, 8], // Organic Hemp T-Shirt, EverSoft Bamboo Joggers
        certifications: ["GOTS Certified", "Organic Cotton", "Fair Trade", "Blockchain Verified"],
        carbonFootprint: 0.9,
        materials: ["100% Organic cotton"],
        brandStory: "Promoting sustainable fashion through certified organic cotton",
        warranty: "Quality guarantee - 6 months",
        shipping: "Carbon-neutral shipping, 3-5 business days",
        aiRecommendationTags: ["organic", "sustainable", "fashion", "comfortable"]
      },
      {
        id: 18,
        name: "Blockchain Development Guide",
        description: "Comprehensive digital guide to smart contract development with practical examples and best practices.",
        category: "Digital",
        price: "0.01",
        priceUSD: 0.4,
        sustainabilityScore: 88,
        averageRating: 4.8,
        features: [
          "Smart contract development", "Practical examples", "Best practices",
          "Step-by-step tutorials", "Code samples", "Security guidelines", "Testing strategies", "Deployment guides"
        ],
        benefits: [
          "Blockchain expertise", "Practical skills", "Career advancement",
          "Technical knowledge", "Industry insights"
        ],
        specifications: {
          "Format": "Digital PDF + Code Repository",
          "Pages": "350 pages",
          "Code Examples": "50+ practical examples",
          "Languages": "Solidity, JavaScript",
          "Updates": "Quarterly updates",
          "Support": "Community forum access"
        },
        useCases: [
          "Learning blockchain", "Smart contract development", "Career development",
          "Technical reference", "Educational resource"
        ],
        targetAudience: [
          "Developers", "Blockchain enthusiasts", "Students", "Tech professionals",
          "Career changers"
        ],
        keywords: [
          "blockchain", "smart contracts", "development", "guide", "programming",
          "solidity", "education", "tutorial", "digital"
        ],
        alternatives: [9, 14], // MindFuel book, PixelCraze NFT Creator Suite
        certifications: ["Technical Content", "Educational Resource", "Digital Product", "Blockchain Verified"],
        carbonFootprint: 0.1,
        materials: ["Digital content"],
        brandStory: "Empowering developers to build the decentralized future",
        warranty: "Content accuracy guarantee",
        shipping: "Instant digital download",
        aiRecommendationTags: ["education", "blockchain", "development", "technical"]
      },
      {
        id: 19,
        name: "Smart Plant Monitor",
        description: "IoT device that monitors soil moisture, light levels, and temperature for optimal plant care.",
        category: "Electronics",
        price: "0.08",
        priceUSD: 3.2,
        sustainabilityScore: 87,
        averageRating: 4.4,
        features: [
          "Soil moisture monitoring", "Light level sensors", "Temperature tracking",
          "Mobile app connectivity", "Plant care alerts", "Data logging", "Battery powered", "Weather resistant"
        ],
        benefits: [
          "Optimal plant care", "Automated monitoring", "Plant health insights",
          "Water conservation", "Smart gardening"
        ],
        specifications: {
          "Sensors": "Moisture, Light, Temperature",
          "Connectivity": "WiFi + Bluetooth",
          "Battery": "6 months battery life",
          "App": "iOS and Android",
          "Range": "Indoor and outdoor use",
          "Data": "Cloud storage included"
        },
        useCases: [
          "Plant monitoring", "Garden automation", "Indoor plants",
          "Greenhouse management", "Plant research"
        ],
        targetAudience: [
          "Plant enthusiasts", "Gardeners", "Smart home users",
          "Agricultural professionals", "Plant researchers"
        ],
        keywords: [
          "plant monitor", "IoT", "smart garden", "sensors", "plant care",
          "monitoring", "agriculture", "gardening", "automation"
        ],
        alternatives: [10], // EcoBloom Smart Planter
        certifications: ["IoT Certified", "Weather Resistant", "Smart Garden", "Blockchain Verified"],
        carbonFootprint: 1.4,
        materials: ["Sustainable electronics", "Weather-resistant plastics"],
        brandStory: "Bringing IoT technology to sustainable plant care and gardening",
        warranty: "2 years electronics warranty",
        shipping: "Protective packaging, 4-6 business days",
        aiRecommendationTags: ["IoT", "gardening", "smart-home", "monitoring"]
      },
      {
        id: 20,
        name: "Recycled Yoga Mat",
        description: "Eco-friendly yoga mat made from recycled materials. Non-slip surface with excellent grip.",
        category: "Sports",
        price: "0.03",
        priceUSD: 1.2,
        sustainabilityScore: 93,
        averageRating: 4.5,
        features: [
          "Recycled materials", "Non-slip surface", "Excellent grip",
          "Eco-friendly", "Durable construction", "Easy to clean", "Lightweight", "Portable"
        ],
        benefits: [
          "Sustainable fitness", "Superior grip", "Environmental impact",
          "Comfort during practice", "Long-lasting"
        ],
        specifications: {
          "Material": "Recycled TPE",
          "Thickness": "6mm",
          "Size": "183cm x 61cm",
          "Weight": "1.2kg",
          "Grip": "Non-slip texture",
          "Care": "Easy wipe clean"
        },
        useCases: [
          "Yoga practice", "Pilates", "Meditation", "Stretching",
          "Home workouts", "Studio classes"
        ],
        targetAudience: [
          "Yoga practitioners", "Fitness enthusiasts", "Eco-conscious users",
          "Meditation practitioners", "Home workout users"
        ],
        keywords: [
          "yoga mat", "recycled", "eco-friendly", "non-slip", "sustainable",
          "fitness", "yoga", "exercise", "meditation"
        ],
        alternatives: [11], // ZenFlex Resistance Band Kit
        certifications: ["Recycled Materials", "Non-Toxic", "Eco-Friendly", "Blockchain Verified"],
        carbonFootprint: 0.7,
        materials: ["Recycled TPE", "Natural rubber"],
        brandStory: "Transforming waste into wellness through sustainable yoga equipment",
        warranty: "1 year warranty against defects",
        shipping: "Eco-friendly packaging, 3-5 business days",
        aiRecommendationTags: ["yoga", "sustainable", "fitness", "eco-friendly"]
      },
      {
        id: 21,
        name: "Eco-Friendly Water Bottle",
        description: "Reusable water bottle made from recycled materials with smart hydration tracking",
        category: "Health",
        price: "0.025",
        priceUSD: 1.0,
        sustainabilityScore: 91,
        averageRating: 4.3,
        features: [
          "Recycled materials", "Smart hydration tracking", "BPA-free",
          "Insulated design", "Leak-proof", "Easy cleaning", "Temperature retention", "App connectivity"
        ],
        benefits: [
          "Sustainable hydration", "Health tracking", "Temperature control",
          "Environmental impact", "Convenience"
        ],
        specifications: {
          "Capacity": "750ml",
          "Material": "Recycled stainless steel",
          "Insulation": "Double-wall vacuum",
          "Temperature": "Hot 12hrs, Cold 24hrs",
          "Smart Features": "Hydration tracking",
          "App": "iOS and Android"
        },
        useCases: [
          "Daily hydration", "Fitness tracking", "Office use",
          "Travel companion", "Health monitoring"
        ],
        targetAudience: [
          "Health-conscious users", "Fitness enthusiasts", "Eco-conscious consumers",
          "Office workers", "Active lifestyle"
        ],
        keywords: [
          "water bottle", "smart", "hydration", "recycled", "sustainable",
          "health", "tracking", "insulated", "eco-friendly"
        ],
        alternatives: [],
        certifications: ["BPA-Free", "Recycled Materials", "Food Safe", "Blockchain Verified"],
        carbonFootprint: 0.6,
        materials: ["Recycled stainless steel", "Sustainable electronics"],
        brandStory: "Smart hydration solutions for a sustainable future",
        warranty: "2 years warranty on smart features",
        shipping: "Eco-friendly packaging, 3-5 business days",
        aiRecommendationTags: ["health", "smart", "sustainable", "hydration"]
      }
    ];

    // Store products in map
    products.forEach(product => {
      this.products.set(product.id, product);
    });
  }

  private buildIndexes(): void {
    // Build category index
    this.products.forEach((product, id) => {
      const category = product.category.toLowerCase();
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, []);
      }
      this.categoryIndex.get(category)!.push(id);
    });

    // Build keyword index
    this.products.forEach((product, id) => {
      product.keywords.forEach(keyword => {
        const key = keyword.toLowerCase();
        if (!this.keywordIndex.has(key)) {
          this.keywordIndex.set(key, []);
        }
        this.keywordIndex.get(key)!.push(id);
      });
    });

    // Build price range index
    this.products.forEach((product, id) => {
      const price = product.priceUSD;
      let range = 'high';
      if (price < 2) range = 'low';
      else if (price < 5) range = 'medium';
      
      if (!this.priceRanges.has(range)) {
        this.priceRanges.set(range, []);
      }
      this.priceRanges.get(range)!.push(id);
    });
  }

  // Public methods for AI agent to use
  public getProduct(id: number): ProductKnowledge | undefined {
    return this.products.get(id);
  }

  public getAllProducts(): ProductKnowledge[] {
    return Array.from(this.products.values());
  }

  public searchByKeywords(keywords: string[]): ProductKnowledge[] {
    const productIds = new Set<number>();
    
    keywords.forEach(keyword => {
      const key = keyword.toLowerCase();
      const ids = this.keywordIndex.get(key) || [];
      ids.forEach(id => productIds.add(id));
    });

    return Array.from(productIds).map(id => this.products.get(id)!).filter(Boolean);
  }

  public getByCategory(category: string): ProductKnowledge[] {
    const ids = this.categoryIndex.get(category.toLowerCase()) || [];
    return ids.map(id => this.products.get(id)!).filter(Boolean);
  }

  public getByPriceRange(maxPrice: number): ProductKnowledge[] {
    return Array.from(this.products.values()).filter(p => p.priceUSD <= maxPrice);
  }

  public getBySustainabilityScore(minScore: number): ProductKnowledge[] {
    return Array.from(this.products.values()).filter(p => p.sustainabilityScore >= minScore);
  }

  public getRecommendations(productId: number): ProductKnowledge[] {
    const product = this.products.get(productId);
    if (!product) return [];

    const alternatives = product.alternatives.map(id => this.products.get(id)!).filter(Boolean);
    
    // Also find products in same category
    const categoryProducts = this.getByCategory(product.category)
      .filter(p => p.id !== productId)
      .slice(0, 3);

    return [...alternatives, ...categoryProducts];
  }

  public smartSearch(query: string, filters?: {
    category?: string;
    maxPrice?: number;
    sustainabilityMin?: number;
  }): ProductKnowledge[] {
    let results = Array.from(this.products.values());

    // Apply filters first
    if (filters?.category) {
      results = results.filter(p => 
        p.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    if (filters?.maxPrice) {
      results = results.filter(p => p.priceUSD <= filters.maxPrice!);
    }

    if (filters?.sustainabilityMin) {
      results = results.filter(p => p.sustainabilityScore >= filters.sustainabilityMin!);
    }

    // Search by query
    if (query) {
      const queryWords = query.toLowerCase().split(' ');
      results = results.filter(product => {
        const searchText = `${product.name} ${product.description} ${product.keywords.join(' ')} ${product.features.join(' ')}`.toLowerCase();
        return queryWords.some(word => searchText.includes(word));
      });
    }

    // Sort by relevance (sustainability + rating + keyword matches)
    results.sort((a, b) => {
      const scoreA = a.sustainabilityScore + (a.averageRating * 20);
      const scoreB = b.sustainabilityScore + (b.averageRating * 20);
      return scoreB - scoreA;
    });

    return results;
  }
}

// Export singleton instance
export const productKnowledgeBase = ProductKnowledgeBase.getInstance();
