import React, { useState, useEffect } from "react";
import { parseEther, parseUnits, formatEther, formatUnits } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useEscrow } from "~~/hooks/useEscrow";
import { notification } from "~~/utils/scaffold-eth";

interface Product {
  id: bigint;
  name: string;
  description: string;
  category: string;
  price: bigint;
  seller: string;
  imageHash: string;
  metadataHash: string;
  isActive: boolean;
  createdAt: bigint;
  totalSales: bigint;
  totalReviews: bigint;
  averageRating: bigint;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (escrowId: bigint) => void;
}

interface PriceData {
  ethereum: { usd: number };
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, product, onSuccess }) => {
  const { address, isConnected } = useAccount();
  const { createEscrowETH, createEscrowUSDC, loading, USDC_ADDRESS, ESCROW_MANAGER_ADDRESS } = useEscrow();
  
  const [paymentMethod, setPaymentMethod] = useState<'ETH' | 'USDC'>('ETH');
  const [ethPrice, setEthPrice] = useState<number>(2000); // Default fallback
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select');

  // Fetch ETH price from CoinGecko
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data: PriceData = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
      }
    };

    if (isOpen) {
      fetchEthPrice();
    }
  }, [isOpen]);

  // Note: ETH balance can be fetched with useBalance hook if needed

  // Get user's USDC balance (currently unused but available for balance checks)
  const { data: _usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: [
      {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
      }
    ],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && paymentMethod === 'USDC',
    },
  });

  // USDC Approval
  const { writeContractAsync: approveUSDC } = useWriteContract();

  const productPriceETH = product.price;
  const productPriceUSD = Number(formatEther(product.price)) * ethPrice;
  const productPriceUSDC = parseUnits(productPriceUSD.toFixed(6), 6);

  const handlePayment = async () => {
    if (!isConnected || !address) {
      notification.error("Please connect your wallet");
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      let transactionHash: string;

      if (paymentMethod === 'ETH') {
        // Add 2.5% platform fee
        const totalAmount = productPriceETH + (productPriceETH * 25n) / 1000n;
        transactionHash = await createEscrowETH(product.id, totalAmount);
      } else {
        // USDC payment
        const totalAmount = productPriceUSDC + (productPriceUSDC * 25n) / 1000n;
        
        // First approve USDC spending
        await approveUSDC({
          address: USDC_ADDRESS,
          abi: [
            {
              "constant": false,
              "inputs": [
                {"name": "_spender", "type": "address"},
                {"name": "_value", "type": "uint256"}
              ],
              "name": "approve",
              "outputs": [{"name": "", "type": "bool"}],
              "type": "function"
            }
          ],
          functionName: 'approve',
          args: [ESCROW_MANAGER_ADDRESS, totalAmount],
        });

        // Then create escrow
        transactionHash = await createEscrowUSDC(product.id, totalAmount);
      }

      setStep('success');
      notification.success(`Payment successful! Transaction: ${transactionHash}`);
      
      if (onSuccess) {
        // We'll pass a dummy escrow ID since the actual ID will be available later via events
        onSuccess(1n);
      }

      setTimeout(() => {
        onClose();
        setStep('select');
      }, 3000);

    } catch (error: any) {
      console.error('Payment failed:', error);
      notification.error(error.message || "Payment failed");
      setStep('select');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (amount: bigint, currency: 'ETH' | 'USDC'): string => {
    if (currency === 'ETH') {
      return `${formatEther(amount)} ETH`;
    } else {
      return `${formatUnits(amount, 6)} USDC`;
    }
  };

  const getPlatformFee = (): string => {
    if (paymentMethod === 'ETH') {
      const fee = (productPriceETH * 25n) / 1000n;
      return formatEther(fee);
    } else {
      const fee = (productPriceUSDC * 25n) / 1000n;
      return formatUnits(fee, 6);
    }
  };

  const getTotalAmount = (): string => {
    if (paymentMethod === 'ETH') {
      const total = productPriceETH + (productPriceETH * 25n) / 1000n;
      return formatEther(total);
    } else {
      const total = productPriceUSDC + (productPriceUSDC * 25n) / 1000n;
      return formatUnits(total, 6);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-base-300">
          <h3 className="text-xl font-bold">Purchase Product</h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            disabled={isProcessing}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Product Info */}
          <div className="mb-6">
            <h4 className="font-semibold text-lg mb-2">{product.name}</h4>
            <p className="text-base-content/70 text-sm mb-4">{product.description}</p>
            <div className="bg-base-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/70">Product Price:</span>
                <span className="font-semibold">
                  {formatEther(product.price)} ETH
                  <span className="text-sm text-base-content/70 ml-2">
                    (${productPriceUSD.toFixed(2)})
                  </span>
                </span>
              </div>
            </div>
          </div>

          {step === 'select' && (
            <>
              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('ETH')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'ETH'
                        ? 'border-primary bg-primary/10'
                        : 'border-base-300 hover:border-base-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold">ETH</div>
                      <div className="text-sm text-base-content/70">Ethereum</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('USDC')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === 'USDC'
                        ? 'border-primary bg-primary/10'
                        : 'border-base-300 hover:border-base-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold">USDC</div>
                      <div className="text-sm text-base-content/70">USD Coin</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mb-6">
                <div className="bg-base-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span>Product Price:</span>
                    <span>
                      {paymentMethod === 'ETH' 
                        ? formatPrice(productPriceETH, 'ETH')
                        : formatPrice(productPriceUSDC, 'USDC')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee (2.5%):</span>
                    <span>{getPlatformFee()} {paymentMethod}</span>
                  </div>
                  <hr className="border-base-300" />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{getTotalAmount()} {paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Escrow Information */}
              <div className="mb-6 p-4 bg-info/10 rounded-lg border border-info/20">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-info flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">ℹ</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium mb-1">Escrow Protection</p>
                    <p className="text-base-content/70">
                      Your payment will be held in escrow until you confirm delivery. 
                      If there are any issues, you can initiate a dispute for resolution.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handlePayment}
                disabled={!isConnected || isProcessing}
                className="btn btn-primary btn-block"
              >
                {!isConnected ? 'Connect Wallet' : `Pay with ${paymentMethod}`}
              </button>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="loading loading-spinner loading-lg mb-4"></div>
              <h4 className="text-lg font-semibold mb-2">Processing Payment</h4>
              <p className="text-base-content/70">
                Please confirm the transaction in your wallet...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">✓</span>
              </div>
              <h4 className="text-lg font-semibold mb-2">Payment Successful!</h4>
              <p className="text-base-content/70">
                Your escrow has been created successfully. You will be redirected shortly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;