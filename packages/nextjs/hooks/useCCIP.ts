import { useState } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { parseEther } from "viem";
import { notification } from "~~/utils/scaffold-eth";

const ESCROW_MANAGER_ADDRESS = "0x959591Bab069599cAbb2A72AA371503ba2d042FF";

// CCIP Chain Selectors (testnet)
export const SUPPORTED_CHAINS = {
  ETHEREUM_SEPOLIA: {
    selector: 16015286601757825753n,
    name: "Ethereum Sepolia",
    chainId: 11155111
  },
  AVALANCHE_FUJI: {
    selector: 14767482510784806043n,
    name: "Avalanche Fuji", 
    chainId: 43113
  },
  BASE_SEPOLIA: {
    selector: 10344971235874465080n,
    name: "Base Sepolia",
    chainId: 84532
  }
} as const;

export const useCCIP = () => {
  const [isCreatingCrossChainEscrow, setIsCreatingCrossChainEscrow] = useState(false);

  // Write contract hook for creating cross-chain escrow
  const { writeContractAsync } = useWriteContract();

  // Read contract hook for getting cross-chain fees
  const getCrossChainFee = async (destinationChainSelector: bigint, amount: bigint) => {
    try {
      // For demo purposes, return estimated fee based on destination chain
      // In production, this would call the actual contract
      if (destinationChainSelector === SUPPORTED_CHAINS.ETHEREUM_SEPOLIA.selector) {
        return BigInt("500000000000000000"); // 0.5 ETH estimated fee for Ethereum
      } else if (destinationChainSelector === SUPPORTED_CHAINS.BASE_SEPOLIA.selector) {
        return BigInt("100000000000000000"); // 0.1 ETH estimated fee for Base
      }
      return BigInt("200000000000000000"); // 0.2 ETH default fee
    } catch (error) {
      console.error("Error getting CCIP fee:", error);
      return 0n;
    }
  };

  const createCrossChainEscrow = async (
    destinationChain: keyof typeof SUPPORTED_CHAINS,
    productId: number,
    seller: string,
    amount: bigint
  ) => {
    try {
      setIsCreatingCrossChainEscrow(true);
      
      const chainConfig = SUPPORTED_CHAINS[destinationChain];
      if (!chainConfig) {
        throw new Error(`Unsupported destination chain: ${destinationChain}`);
      }

      // Get the required fee for cross-chain transaction
      const fee = await getCrossChainFee(chainConfig.selector, amount);
      
      // For now, show info about what would happen
      notification.info(`Cross-chain purchase to ${chainConfig.name} would require ${(Number(fee) / 1e18).toFixed(3)} ETH in fees. This feature needs EscrowManager deployed on destination chain.`);

      // TODO: Remove this when contracts are deployed on other chains
      const isDestinationChainReady = true; // Set to true when contracts deployed

      if (!isDestinationChainReady) {
        throw new Error(`EscrowManager not yet deployed on ${chainConfig.name}. Currently only available on Avalanche Fuji.`);
      }

      const result = await writeContractAsync({
        address: ESCROW_MANAGER_ADDRESS,
        abi: [
          {
            name: "createCrossChainEscrow",
            type: "function",
            stateMutability: "payable",
            inputs: [
              { name: "destinationChainSelector", type: "uint64" },
              { name: "productId", type: "uint256" },
              { name: "seller", type: "address" },
              { name: "amount", type: "uint256" }
            ],
            outputs: []
          }
        ],
        functionName: "createCrossChainEscrow",
        args: [chainConfig.selector, BigInt(productId), seller, amount],
        value: fee // Send ETH to cover CCIP fees
      });

      notification.success(`Cross-chain escrow created! Transaction: ${result}`);
      
      return result;
    } catch (error: any) {
      console.error("Error creating cross-chain escrow:", error);
      notification.error(`Cross-chain purchase: ${error.message}`);
      throw error;
    } finally {
      setIsCreatingCrossChainEscrow(false);
    }
  };

  const checkChainSupport = async (chainSelector: bigint): Promise<boolean> => {
    try {
      // For now, only Avalanche Fuji is supported since that's where our contract is deployed
      // In production, this would check the contract's supportedDestinationChains mapping
      return chainSelector === SUPPORTED_CHAINS.AVALANCHE_FUJI.selector;
    } catch (error) {
      console.error("Error checking chain support:", error);
      return false;
    }
  };

  return {
    createCrossChainEscrow,
    getCrossChainFee,
    checkChainSupport,
    isCreatingCrossChainEscrow,
    SUPPORTED_CHAINS
  };
};