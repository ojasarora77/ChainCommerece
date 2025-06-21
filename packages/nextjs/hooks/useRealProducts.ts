import { useScaffoldReadContract } from './scaffold-eth';
import { ContractProduct } from '~~/services/marketplace/contractProductService';

export const useRealProducts = () => {
  // Get total number of products
  const { data: totalProducts } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "totalProducts",
  });

  // Get all product IDs (assuming they start from 1)
  const productIds = totalProducts ? Array.from({ length: Number(totalProducts) }, (_, i) => i + 1) : [];

  // Get batch products data
  const { data: rawProducts, isLoading } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "getBatchProducts",
    args: [productIds],
  });

  // Convert raw contract data to ContractProduct format
  const products: ContractProduct[] = rawProducts ? rawProducts.map((product: any, index: number) => {
    // Convert BigInt values to numbers/strings
    const priceInWei = product.price ? Number(product.price) : 0;
    const priceInEth = priceInWei / 1e18; // Convert wei to ETH
    const priceInUSD = priceInEth * 2500; // Approximate ETH to USD conversion

    return {
      id: Number(product.id || index + 1),
      name: product.name || `Product ${index + 1}`,
      description: product.description || "No description available",
      category: product.category || "Uncategorized",
      price: priceInEth.toFixed(6), // ETH price as string
      priceUSD: Math.round(priceInUSD * 100) / 100, // USD price rounded to 2 decimals
      seller: product.seller || "0x0000000000000000000000000000000000000000",
      averageRating: product.averageRating ? Number(product.averageRating) / 100 : 0, // Assuming rating is stored as uint (e.g., 450 = 4.5)
      isActive: product.isActive !== false,
      sustainabilityScore: 85, // Default sustainability score (you can add this to your contract)
      certifications: ["Blockchain Verified"], // Default certifications
      carbonFootprint: 2.0, // Default carbon footprint
      chain: "ethereum" as const // Adjust based on your deployment
    };
  }) : [];

  return {
    products,
    isLoading,
    totalProducts: Number(totalProducts || 0)
  };
};
