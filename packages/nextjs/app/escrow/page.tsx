"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { useEscrow } from "~~/hooks/useEscrow";
import EscrowStatus from "~~/components/marketplace/EscrowStatus";
import DisputeResolution from "~~/components/marketplace/DisputeResolution";
import PaymentModal from "~~/components/marketplace/PaymentModal";

// Mock product data for demo
const mockProduct = {
  id: 1n,
  name: "Premium Wireless Headphones",
  description: "High-quality noise-canceling wireless headphones with premium sound quality",
  category: "Electronics",
  price: BigInt("50000000000000000"), // 0.05 ETH
  seller: "0x742d35Cc6634C0532925a3b8D0331d2c0d8Ceb13",
  imageHash: "QmExample123",
  metadataHash: "QmMetadata456",
  isActive: true,
  createdAt: BigInt(Math.floor(Date.now() / 1000)),
  totalSales: 0n,
  totalReviews: 0n,
  averageRating: 0n,
};

const EscrowPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { userEscrows, sellerEscrows, refetchUserEscrows, refetchSellerEscrows } = useEscrow();
  
  const [selectedEscrowId, setSelectedEscrowId] = useState<bigint | null>(null);
  const [selectedDisputeId, setSelectedDisputeId] = useState<bigint | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Parse URL parameters to get product information
  useEffect(() => {
    const productId = searchParams.get('productId');
    const productName = searchParams.get('productName');
    const productPrice = searchParams.get('productPrice');
    const seller = searchParams.get('seller');
    const category = searchParams.get('category');
    const description = searchParams.get('description');
    const action = searchParams.get('action');

    if (productId && productName && productPrice && seller && action === 'create') {
      const product = {
        id: BigInt(productId),
        name: productName,
        description: description || "Product from marketplace",
        category: category || "General",
        price: parseEther(productPrice),
        seller: seller,
        imageHash: "QmExample123",
        metadataHash: "QmMetadata456",
        isActive: true,
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
        totalSales: 0n,
        totalReviews: 0n,
        averageRating: 0n,
      };

      setSelectedProduct(product);
      setShowPaymentModal(true); // Automatically show payment modal
    }
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState<'overview' | 'escrows' | 'disputes'>('overview');

  const handlePaymentSuccess = (escrowId: bigint) => {
    setSelectedEscrowId(escrowId);
    setActiveTab('escrows');
    refetchUserEscrows();
    refetchSellerEscrows();
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Escrow Management</h1>
          <p className="text-lg text-base-content/70 mb-8">
            Connect your wallet to manage your escrows and disputes
          </p>
          <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
            <div className="card-body text-center">
              <h2 className="card-title justify-center">Connect Wallet</h2>
              <p className="text-base-content/70">
                Please connect your wallet to access escrow features
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Escrow Management</h1>
          <p className="text-base-content/70">
            Manage your secure transactions with escrow protection
          </p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="btn btn-primary mt-4 md:mt-0"
        >
          Create Test Purchase
        </button>
      </div>

      {/* Product Purchase Banner */}
      {selectedProduct && (
        <div className="alert alert-info mb-6">
          <div className="flex items-center gap-4 w-full">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold">Creating Escrow for Purchase</h3>
              <div className="text-sm opacity-90">
                <span className="font-medium">{selectedProduct.name}</span> - {selectedProduct.category} - {(Number(selectedProduct.price) / 1e18).toFixed(4)} ETH
              </div>
            </div>
            <div className="flex-shrink-0">
              <button 
                onClick={() => {
                  setSelectedProduct(null);
                  setShowPaymentModal(false);
                  router.push('/marketplace');
                }}
                className="btn btn-sm btn-outline"
              >
                ← Back to Marketplace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs tabs-lifted mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`tab tab-lg ${activeTab === 'overview' ? 'tab-active' : ''}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('escrows')}
          className={`tab tab-lg ${activeTab === 'escrows' ? 'tab-active' : ''}`}
        >
          My Escrows
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`tab tab-lg ${activeTab === 'disputes' ? 'tab-active' : ''}`}
        >
          Disputes
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* How It Works */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">How Escrow Works</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold">Payment Held in Escrow</h3>
                      <p className="text-sm text-base-content/70">
                        Your payment is securely held in a smart contract until delivery is confirmed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold">Confirm Delivery</h3>
                      <p className="text-sm text-base-content/70">
                        Once you receive your product, confirm delivery to release funds to the seller
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold">Auto-Release Protection</h3>
                      <p className="text-sm text-base-content/70">
                        If no issues are reported, funds are automatically released after 7 days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-warning text-white flex items-center justify-center font-bold text-sm">
                      !
                    </div>
                    <div>
                      <h3 className="font-semibold">Dispute Resolution</h3>
                      <p className="text-sm text-base-content/70">
                        If there's an issue, create a dispute for AI-powered resolution with arbitrators
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">Your Escrow Activity</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="stat">
                    <div className="stat-value text-2xl text-primary">
                      {userEscrows?.length || 0}
                    </div>
                    <div className="stat-title">As Buyer</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value text-2xl text-success">
                      {sellerEscrows?.length || 0}
                    </div>
                    <div className="stat-title">As Seller</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-info/10 rounded-lg">
                  <p className="text-sm text-base-content/70">
                    Connected as: <span className="font-mono">{address}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Escrow Details */}
            {selectedEscrowId && (
              <div className="lg:col-span-2">
                <EscrowStatus escrowId={selectedEscrowId} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'escrows' && (
          <div className="space-y-6">
            {/* Buyer Escrows */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Purchases (As Buyer)</h2>
              {userEscrows && userEscrows.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {userEscrows.map((escrowId) => (
                    <div
                      key={escrowId.toString()}
                      className={`cursor-pointer transition-transform hover:scale-[1.02] ${
                        selectedEscrowId === escrowId ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedEscrowId(escrowId)}
                    >
                      <EscrowStatus escrowId={escrowId} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body text-center">
                    <p className="text-base-content/70">No purchases found</p>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="btn btn-primary btn-sm mt-2"
                    >
                      Make a Test Purchase
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Seller Escrows */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Sales (As Seller)</h2>
              {sellerEscrows && sellerEscrows.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {sellerEscrows.map((escrowId) => (
                    <div
                      key={escrowId.toString()}
                      className={`cursor-pointer transition-transform hover:scale-[1.02] ${
                        selectedEscrowId === escrowId ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedEscrowId(escrowId)}
                    >
                      <EscrowStatus escrowId={escrowId} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body text-center">
                    <p className="text-base-content/70">No sales found</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Active Disputes</h2>
            {selectedDisputeId ? (
              <DisputeResolution disputeId={selectedDisputeId} />
            ) : (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body text-center">
                  <p className="text-base-content/70 mb-4">
                    No active disputes. Disputes will appear here when created from escrow transactions.
                  </p>
                  <div className="text-sm text-base-content/60">
                    To create a dispute, go to an active escrow and click "Report Issue"
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        product={selectedProduct || mockProduct}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default EscrowPage;